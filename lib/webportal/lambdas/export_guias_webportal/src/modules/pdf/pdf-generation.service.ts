import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { SoapClientService } from './soap-client.service';
import { DocumentsQueryService } from '../documentos/documents-query.service';
import archiver from 'archiver';
import { Readable } from 'stream';

interface PdfResultSuccess {
  guideId: number;
  buffer: Buffer;
  fileName: string;
  success: true;
}

interface PdfResultError {
  guideId: number;
  buffer: null;
  fileName: string;
  success: false;
  error: string;
}

type PdfResult = PdfResultSuccess | PdfResultError;

@Injectable()
export class PdfGenerationService {
  private readonly logger = new Logger(PdfGenerationService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly soapClientService: SoapClientService,
    private readonly documentsQueryService: DocumentsQueryService,
  ) {}

  /**
   * Genera PDFs para las guías especificadas
   * Si es un solo ID: sube el PDF directamente
   * Si son múltiples IDs: genera los PDFs, los comprime en ZIP y sube el ZIP
   * Máximo: 20 guías por solicitud
   */
  async generatePdfForGuides(
    guideIds: number[],
    requestId: string,
    fileName?: string,
    userId?: number,
  ): Promise<{ filePath: string; s3Key: string; s3Url: string }> {
    this.logger.log(`Generando PDFs para requestId: ${requestId}, IDs: ${guideIds.join(', ')}`);

    // Validar que no haya más de 20 guías
    if (!guideIds || guideIds.length === 0) {
      throw new Error('No se proporcionaron IDs de guías');
    }

    if (guideIds.length > 20) {
      throw new Error('No se pueden generar más de 20 PDFs por solicitud. Máximo permitido: 20 guías.');
    }

    try {
      if (guideIds.length === 1) {
        // Un solo ID: generar y subir PDF directamente
        return await this.generateSinglePdf(guideIds[0], requestId, fileName);
      } else {
        // Múltiples IDs: generar PDFs y comprimirlos en ZIP
        return await this.generateMultiplePdfsAsZip(guideIds, requestId, fileName);
      }
    } catch (error: any) {
      this.logger.error(`Error generando PDFs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Genera un solo PDF y lo sube a S3
   */
  private async generateSinglePdf(
    guideId: number,
    requestId: string,
    fileName?: string,
  ): Promise<{ filePath: string; s3Key: string; s3Url: string }> {
    this.logger.log(`Generando PDF único para guideId: ${guideId}`);

    // Obtener el número externo del documento
    const externalNumbersMap = await this.documentsQueryService.getExternalNumbersByIds([guideId]);
    const numeroExterno = externalNumbersMap.get(guideId);

    if (!numeroExterno) {
      this.logger.warn(`No se encontró número externo para guideId ${guideId}, usando ID como nombre`);
    }

    // Llamar al servicio SOAP para generar el PDF
    const base64Pdf = await this.soapClientService.generarDocumento('gtime', [
      {
        Nombre: 'iddocumento',
        Valor: guideId,
      },
    ]);

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(base64Pdf, 'base64');

    // Preparar nombre de archivo y key de S3
    const finalFileName = fileName || `guia_${numeroExterno}.pdf`;
    const s3Key = `exports/pdfs/${finalFileName}`;

    // Subir a S3
    const s3Url = await this.s3Service.uploadFile({
      buffer: pdfBuffer,
      key: s3Key,
      contentType: 'application/pdf',
    });

    this.logger.log(`PDF generado y subido a S3: ${s3Url}`);

    return {
      filePath: finalFileName,
      s3Key,
      s3Url,
    };
  }

  /**
   * Genera múltiples PDFs y los comprime en un archivo ZIP
   */
  private async generateMultiplePdfsAsZip(
    guideIds: number[],
    requestId: string,
    fileName?: string,
  ): Promise<{ filePath: string; s3Key: string; s3Url: string }> {
    this.logger.log(`Generando ${guideIds.length} PDFs y comprimiendo en ZIP`);

    // Obtener los números externos de todos los documentos en lote
    const externalNumbersMap = await this.documentsQueryService.getExternalNumbersByIds(guideIds);

    const pdfPromises = guideIds.map(async (guideId): Promise<PdfResult> => {
      try {
        const numeroExterno = externalNumbersMap.get(guideId);
        
        if (!numeroExterno) {
          this.logger.warn(`No se encontró número externo para guideId ${guideId}, usando ID como nombre`);
        }

        const base64Pdf = await this.soapClientService.generarDocumento('gtime', [
          {
            Nombre: 'iddocumento',
            Valor: guideId,
          },
        ]);

        const pdfBuffer = Buffer.from(base64Pdf, 'base64');
        const pdfFileName = `guia_${numeroExterno || guideId}.pdf`;
        
        return {
          guideId,
          buffer: pdfBuffer,
          fileName: pdfFileName,
          success: true,
        } as PdfResultSuccess;
      } catch (error: any) {
        this.logger.error(`Error generando PDF para guideId ${guideId}: ${error.message}`);
        const numeroExterno = externalNumbersMap.get(guideId);
        return {
          guideId,
          buffer: null,
          fileName: `guia_${numeroExterno || guideId}.pdf`,
          success: false,
          error: error.message,
        } as PdfResultError;
      }
    });

    const pdfResults = await Promise.all(pdfPromises);

    const successfulPdfs = pdfResults.filter(
      (result): result is PdfResultSuccess => result.success
    );

    if (successfulPdfs.length === 0) {
      throw new Error('No se pudo generar ningún PDF exitosamente');
    }

    this.logger.log(`${successfulPdfs.length} de ${guideIds.length} PDFs generados exitosamente`);

    // Crear archivo ZIP
    const zipBuffer = await this.createZipBuffer(successfulPdfs);

    // Preparar nombre de archivo y key de S3
    const finalFileName = fileName || `guias_${requestId}_${Date.now()}.zip`;
    const s3Key = `exports/pdfs/${finalFileName}`;

    // Subir ZIP a S3
    const s3Url = await this.s3Service.uploadFile({
      buffer: zipBuffer,
      key: s3Key,
      contentType: 'application/zip',
    });

    this.logger.log(`ZIP con ${successfulPdfs.length} PDFs generado y subido a S3: ${s3Url}`);

    return {
      filePath: finalFileName,
      s3Key,
      s3Url,
    };
  }

  /**
   * Crea un buffer ZIP con los PDFs proporcionados
   */
  private async createZipBuffer(
    pdfs: Array<{ fileName: string; buffer: Buffer }>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Máxima compresión
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks);
        resolve(zipBuffer);
      });

      archive.on('error', (err: Error) => {
        this.logger.error(`Error creando ZIP: ${err.message}`);
        reject(err);
      });

      // Agregar cada PDF al archivo ZIP
      pdfs.forEach((pdf) => {
        archive.append(pdf.buffer, { name: pdf.fileName });
      });

      // Finalizar el archivo
      archive.finalize();
    });
  }
}

