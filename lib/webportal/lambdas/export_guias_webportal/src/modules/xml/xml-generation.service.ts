import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DocDocumentoBase } from '../documentos/entities';
import { XmlUtil } from '../../shared/utils/xml.util';

@Injectable()
export class XmlGenerationService {
  private readonly logger = new Logger(XmlGenerationService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    @InjectRepository(DocDocumentoBase)
    private readonly documentoBaseRepository: Repository<DocDocumentoBase>,
  ) {}

  async generateXml(
    filters: Record<string, any>,
    requestId: string,
    fileName?: string,
  ): Promise<{ filePath: string; s3Key: string; s3Url: string }> {
    this.logger.log(`Generating XML for requestId: ${requestId}`);

    try {
      const where: string[] = [];
      const { numeroAceptacion, tipoDocumento } = filters;
      // IMPORTANTE: Siempre usar GTIME para la consulta, como en el código original
      // El tipoDocumento en los filtros es para identificar el manifiesto, pero la consulta
      // siempre busca documentos tipo GTIME (guías) asociados
      const typeDoc = 'GTIME';

      this.logger.log(`Generating XML with filters: numeroAceptacion=${numeroAceptacion}, tipoDocumento=${tipoDocumento}, using typeDoc=${typeDoc}`);

      let sql = `
        SELECT DISTINCT
          D.ID                AS ID,
          D.NUMEROEXTERNO     AS NUMEROEXTERNO,
          D.TIPODOCUMENTO     AS TIPODOCUMENTO,
          D.ACTIVO            AS ACTIVO,
          NVL((SELECT LISTAGG(OpFiscMarca.CodigoOpFiscMotivoMarca || '-' || Motivo.Descripcion, ' / ') WITHIN GROUP (ORDER BY OpFiscMarca.CodigoOpFiscMotivoMarca)
           FROM OpFiscMarca OpFiscMarca
           JOIN OpFiscMotivoMarca Motivo
             ON Motivo.Codigo = OpFiscMarca.CodigoOpFiscMotivoMarca
           WHERE OpFiscMarca.IdDocumento = D.ID
             AND OpFiscMarca.Activa = 'S'
          ), '') AS MOTIVO_SELECCION,
          NVL((SELECT LISTAGG(RES.codigoopfiscresultado || ' / ' || RES.observacion, ' / ') WITHIN GROUP (ORDER BY RES.codigoopfiscresultado || ' / ' || RES.observacion ASC)
           FROM OPFISCRESULTADOACCION RES
           INNER JOIN OpFiscRegistroFiscalizaci REG
             ON REG.IdOpFiscAccionFiscalizaci = RES.IdOpFiscAccionFiscalizaci
            AND REG.ID = RES.idopfiscregistrofiscaliza
           INNER JOIN fiscalizaciones.OpFiscMarca FIS
             ON FIS.IDOPFISCACCIONFISCALIZACI = REG.IdOpFiscAccionFiscalizaci
           WHERE FIS.IdDocumento = D.ID
             AND FIS.Activa = 'S'
             AND REG.activo = 'S'
          ), ' ') AS RESULTADO_SELECCION
        FROM DOCUMENTOS.DOCDOCUMENTOBASE D
      `;

      // WHERE por filters
      where.push(`D.ACTIVO = 'S'`);
      // Solo agregar el filtro de tipo de documento si existe tipoDocumento en los filtros
      // (como en el código original)
      if (tipoDocumento) {
        where.push(`D.TIPODOCUMENTO = '${typeDoc}'`);
      }

      if (numeroAceptacion) {
        const v = String(numeroAceptacion).replace(/'/g, "''");
        where.push(`D.NUMEROACEPTACION = '${v}'`);
      }

      // Ensamblar consulta final
      if (where.length) {
        sql += '\nWHERE ' + where.join('\n  AND ');
      }

      // Ejecutar consulta sin límite
      const rows = await this.documentoBaseRepository.query(sql);

      this.logger.log(`Total documents to export: ${rows.length}`);

      // Generar XML en el formato solicitado
      let xml = XmlUtil.createXmlHeader();
      xml += '<Rows>\n';

      for (const row of rows) {
        xml += '<Row>\n';
        xml += `  <NumeroDoc>${XmlUtil.escapeXml(
          row.NUMEROEXTERNO || '',
        )}</NumeroDoc>\n`;
        xml += `  <MotivoSeleccion>${XmlUtil.escapeXml(
          row.MOTIVO_SELECCION || '',
        )}</MotivoSeleccion>\n`;
        xml += `  <ResultadoSeleccion>${XmlUtil.escapeXml(
          row.RESULTADO_SELECCION || '',
        )}</ResultadoSeleccion>\n`;
        xml += `  <Detalle>Más Info.</Detalle>\n`;
        xml += '</Row>\n';
      }

      xml += '</Rows>';

      // Convertir XML a Buffer
      const buffer = Buffer.from(xml, 'utf-8');

      const finalFileName = fileName || `documentos_export_${requestId}_${Date.now()}.xml`;
      const s3Key = `exports/xmls/${finalFileName}`;

      const s3Url = await this.s3Service.uploadFile({
        buffer,
        key: s3Key,
        contentType: 'application/xml',
      });

      this.logger.log(`XML generated and uploaded to S3: ${s3Url}`);

      return {
        filePath: finalFileName,
        s3Key,
        s3Url,
      };
    } catch (error: any) {
      this.logger.error(`Error generating XML: ${error.message}`, error.stack);
      throw error;
    }
  }
}

