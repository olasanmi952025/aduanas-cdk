import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { SoapClientService } from './soap-client.service';
import { DocumentsQueryService } from '../documentos/documents-query.service';
export declare class PdfGenerationService {
    private readonly s3Service;
    private readonly configService;
    private readonly soapClientService;
    private readonly documentsQueryService;
    private readonly logger;
    constructor(s3Service: S3Service, configService: ConfigService, soapClientService: SoapClientService, documentsQueryService: DocumentsQueryService);
    /**
     * Genera PDFs para las guías especificadas
     * Si es un solo ID: sube el PDF directamente
     * Si son múltiples IDs: genera los PDFs, los comprime en ZIP y sube el ZIP
     * Máximo: 20 guías por solicitud
     */
    generatePdfForGuides(guideIds: number[], requestId: string, fileName?: string, userId?: number): Promise<{
        filePath: string;
        s3Key: string;
        s3Url: string;
    }>;
    /**
     * Genera un solo PDF y lo sube a S3
     */
    private generateSinglePdf;
    /**
     * Genera múltiples PDFs y los comprime en un archivo ZIP
     */
    private generateMultiplePdfsAsZip;
    /**
     * Crea un buffer ZIP con los PDFs proporcionados
     */
    private createZipBuffer;
}
