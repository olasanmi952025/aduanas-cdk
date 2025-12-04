"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var XmlGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlGenerationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../documentos/entities");
const xml_util_1 = require("../../shared/utils/xml.util");
let XmlGenerationService = XmlGenerationService_1 = class XmlGenerationService {
    constructor(s3Service, configService, documentoBaseRepository) {
        this.s3Service = s3Service;
        this.configService = configService;
        this.documentoBaseRepository = documentoBaseRepository;
        this.logger = new common_1.Logger(XmlGenerationService_1.name);
    }
    async generateXml(filters, requestId, fileName) {
        this.logger.log(`Generating XML for requestId: ${requestId}`);
        try {
            const where = [];
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
            let xml = xml_util_1.XmlUtil.createXmlHeader();
            xml += '<Rows>\n';
            for (const row of rows) {
                xml += '<Row>\n';
                xml += `  <NumeroDoc>${xml_util_1.XmlUtil.escapeXml(row.NUMEROEXTERNO || '')}</NumeroDoc>\n`;
                xml += `  <MotivoSeleccion>${xml_util_1.XmlUtil.escapeXml(row.MOTIVO_SELECCION || '')}</MotivoSeleccion>\n`;
                xml += `  <ResultadoSeleccion>${xml_util_1.XmlUtil.escapeXml(row.RESULTADO_SELECCION || '')}</ResultadoSeleccion>\n`;
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
        }
        catch (error) {
            this.logger.error(`Error generating XML: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.XmlGenerationService = XmlGenerationService;
exports.XmlGenerationService = XmlGenerationService = XmlGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.DocDocumentoBase))
], XmlGenerationService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1sLWdlbmVyYXRpb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInhtbC1nZW5lcmF0aW9uLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUFvRDtBQUlwRCw2Q0FBbUQ7QUFDbkQscURBQTBEO0FBQzFELDBEQUFzRDtBQUcvQyxJQUFNLG9CQUFvQiw0QkFBMUIsTUFBTSxvQkFBb0I7SUFHL0IsWUFDbUIsU0FBb0IsRUFDcEIsYUFBNEIsRUFFN0MsdUJBQXNFO1FBSHJELGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFFNUIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUE4QjtRQU52RCxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsc0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFPN0QsQ0FBQztJQUVKLEtBQUssQ0FBQyxXQUFXLENBQ2YsT0FBNEIsRUFDNUIsU0FBaUIsRUFDakIsUUFBaUI7UUFFakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFOUQsSUFBSSxDQUFDO1lBQ0gsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDcEQsOEVBQThFO1lBQzlFLHNGQUFzRjtZQUN0Rix3REFBd0Q7WUFDeEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBRXhCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGlEQUFpRCxnQkFBZ0IsbUJBQW1CLGFBQWEsbUJBQW1CLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFL0ksSUFBSSxHQUFHLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F5QlQsQ0FBQztZQUVGLG9CQUFvQjtZQUNwQixLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFn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QkFBZ0IsRUFBQywyQkFBZ0IsQ0FBQyxDQUFBO0dBTjFCLG9CQUFvQixDQTBIaEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IFMzU2VydmljZSB9IGZyb20gJy4uL3MzJztcclxuaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gJ3R5cGVvcm0nO1xyXG5pbXBvcnQgeyBJbmplY3RSZXBvc2l0b3J5IH0gZnJvbSAnQG5lc3Rqcy90eXBlb3JtJztcclxuaW1wb3J0IHsgRG9jRG9jdW1lbnRvQmFzZSB9IGZyb20gJy4uL2RvY3VtZW50b3MvZW50aXRpZXMnO1xyXG5pbXBvcnQgeyBYbWxVdGlsIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzL3htbC51dGlsJztcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIFhtbEdlbmVyYXRpb25TZXJ2aWNlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoWG1sR2VuZXJhdGlvblNlcnZpY2UubmFtZSk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzM1NlcnZpY2U6IFMzU2VydmljZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnU2VydmljZTogQ29uZmlnU2VydmljZSxcclxuICAgIEBJbmplY3RSZXBvc2l0b3J5KERvY0RvY3VtZW50b0Jhc2UpXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50b0Jhc2VSZXBvc2l0b3J5OiBSZXBvc2l0b3J5PERvY0RvY3VtZW50b0Jhc2U+LFxyXG4gICkge31cclxuXHJcbiAgYXN5bmMgZ2VuZXJhdGVYbWwoXHJcbiAgICBmaWx0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgcmVxdWVzdElkOiBzdHJpbmcsXHJcbiAgICBmaWxlTmFtZT86IHN0cmluZyxcclxuICApOiBQcm9taXNlPHsgZmlsZVBhdGg6IHN0cmluZzsgczNLZXk6IHN0cmluZzsgczNVcmw6IHN0cmluZyB9PiB7XHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYEdlbmVyYXRpbmcgWE1MIGZvciByZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHdoZXJlOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICBjb25zdCB7IG51bWVyb0FjZXB0YWNpb24sIHRpcG9Eb2N1bWVudG8gfSA9IGZpbHRlcnM7XHJcbiAgICAgIC8vIElNUE9SVEFOVEU6IFNpZW1wcmUgdXNhciBHVElNRSBwYXJhIGxhIGNvbnN1bHRhLCBjb21vIGVuIGVsIGPDs2RpZ28gb3JpZ2luYWxcclxuICAgICAgLy8gRWwgdGlwb0RvY3VtZW50byBlbiBsb3MgZmlsdHJvcyBlcyBwYXJhIGlkZW50aWZpY2FyIGVsIG1hbmlmaWVzdG8sIHBlcm8gbGEgY29uc3VsdGFcclxuICAgICAgLy8gc2llbXByZSBidXNjYSBkb2N1bWVudG9zIHRpcG8gR1RJTUUgKGd1w61hcykgYXNvY2lhZG9zXHJcbiAgICAgIGNvbnN0IHR5cGVEb2MgPSAnR1RJTUUnO1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBHZW5lcmF0aW5nIFhNTCB3aXRoIGZpbHRlcnM6IG51bWVyb0FjZXB0YWNpb249JHtudW1lcm9BY2VwdGFjaW9ufSwgdGlwb0RvY3VtZW50bz0ke3RpcG9Eb2N1bWVudG99LCB1c2luZyB0eXBlRG9jPSR7dHlwZURvY31gKTtcclxuXHJcbiAgICAgIGxldCBzcWwgPSBgXHJcbiAgICAgICAgU0VMRUNUIERJU1RJTkNUXHJcbiAgICAgICAgICBELklEICAgICAgICAgICAgICAgIEFTIElELFxyXG4gICAgICAgICAgRC5OVU1FUk9FWFRFUk5PICAgICBBUyBOVU1FUk9FWFRFUk5PLFxyXG4gICAgICAgICAgRC5USVBPRE9DVU1FTlRPICAgICBBUyBUSVBPRE9DVU1FTlRPLFxyXG4gICAgICAgICAgRC5BQ1RJVk8gICAgICAgICAgICBBUyBBQ1RJVk8sXHJcbiAgICAgICAgICBOVkwoKFNFTEVDVCBMSVNUQUdHKE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhIHx8ICctJyB8fCBNb3Rpdm8uRGVzY3JpcGNpb24sICcgLyAnKSBXSVRISU4gR1JPVVAgKE9SREVSIEJZIE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhKVxyXG4gICAgICAgICAgIEZST00gT3BGaXNjTWFyY2EgT3BGaXNjTWFyY2FcclxuICAgICAgICAgICBKT0lOIE9wRmlzY01vdGl2b01hcmNhIE1vdGl2b1xyXG4gICAgICAgICAgICAgT04gTW90aXZvLkNvZGlnbyA9IE9wRmlzY01hcmNhLkNvZGlnb09wRmlzY01vdGl2b01hcmNhXHJcbiAgICAgICAgICAgV0hFUkUgT3BGaXNjTWFyY2EuSWREb2N1bWVudG8gPSBELklEXHJcbiAgICAgICAgICAgICBBTkQgT3BGaXNjTWFyY2EuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICApLCAnJykgQVMgTU9USVZPX1NFTEVDQ0lPTixcclxuICAgICAgICAgIE5WTCgoU0VMRUNUIExJU1RBR0coUkVTLmNvZGlnb29wZmlzY3Jlc3VsdGFkbyB8fCAnIC8gJyB8fCBSRVMub2JzZXJ2YWNpb24sICcgLyAnKSBXSVRISU4gR1JPVVAgKE9SREVSIEJZIFJFUy5jb2RpZ29vcGZpc2NyZXN1bHRhZG8gfHwgJyAvICcgfHwgUkVTLm9ic2VydmFjaW9uIEFTQylcclxuICAgICAgICAgICBGUk9NIE9QRklTQ1JFU1VMVEFET0FDQ0lPTiBSRVNcclxuICAgICAgICAgICBJTk5FUiBKT0lOIE9wRmlzY1JlZ2lzdHJvRmlzY2FsaXphY2kgUkVHXHJcbiAgICAgICAgICAgICBPTiBSRUcuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaSA9IFJFUy5JZE9wRmlzY0FjY2lvbkZpc2NhbGl6YWNpXHJcbiAgICAgICAgICAgIEFORCBSRUcuSUQgPSBSRVMuaWRvcGZpc2NyZWdpc3Ryb2Zpc2NhbGl6YVxyXG4gICAgICAgICAgIElOTkVSIEpPSU4gZmlzY2FsaXphY2lvbmVzLk9wRmlzY01hcmNhIEZJU1xyXG4gICAgICAgICAgICAgT04gRklTLklET1BGSVNDQUNDSU9ORklTQ0FMSVpBQ0kgPSBSRUcuSWRPcEZpc2NBY2Npb25GaXNjYWxpemFjaVxyXG4gICAgICAgICAgIFdIRVJFIEZJUy5JZERvY3VtZW50byA9IEQuSURcclxuICAgICAgICAgICAgIEFORCBGSVMuQWN0aXZhID0gJ1MnXHJcbiAgICAgICAgICAgICBBTkQgUkVHLmFjdGl2byA9ICdTJ1xyXG4gICAgICAgICAgKSwgJyAnKSBBUyBSRVNVTFRBRE9fU0VMRUNDSU9OXHJcbiAgICAgICAgRlJPTSBET0NVTUVOVE9TLkRPQ0RPQ1VNRU5UT0JBU0UgRFxyXG4gICAgICBgO1xyXG5cclxuICAgICAgLy8gV0hFUkUgcG9yIGZpbHRlcnNcclxuICAgICAgd2hlcmUucHVzaChgRC5BQ1RJVk8gPSAnUydgKTtcclxuICAgICAgLy8gU29sbyBhZ3JlZ2FyIGVsIGZpbHRybyBkZSB0aXBvIGRlIGRvY3VtZW50byBzaSBleGlzdGUgdGlwb0RvY3VtZW50byBlbiBsb3MgZmlsdHJvc1xyXG4gICAgICAvLyAoY29tbyBlbiBlbCBjw7NkaWdvIG9yaWdpbmFsKVxyXG4gICAgICBpZiAodGlwb0RvY3VtZW50bykge1xyXG4gICAgICAgIHdoZXJlLnB1c2goYEQuVElQT0RPQ1VNRU5UTyA9ICcke3R5cGVEb2N9J2ApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobnVtZXJvQWNlcHRhY2lvbikge1xyXG4gICAgICAgIGNvbnN0IHYgPSBTdHJpbmcobnVtZXJvQWNlcHRhY2lvbikucmVwbGFjZSgvJy9nLCBcIicnXCIpO1xyXG4gICAgICAgIHdoZXJlLnB1c2goYEQuTlVNRVJPQUNFUFRBQ0lPTiA9ICcke3Z9J2ApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFbnNhbWJsYXIgY29uc3VsdGEgZmluYWxcclxuICAgICAgaWYgKHdoZXJlLmxlbmd0aCkge1xyXG4gICAgICAgIHNxbCArPSAnXFxuV0hFUkUgJyArIHdoZXJlLmpvaW4oJ1xcbiAgQU5EICcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBFamVjdXRhciBjb25zdWx0YSBzaW4gbMOtbWl0ZVxyXG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgdGhpcy5kb2N1bWVudG9CYXNlUmVwb3NpdG9yeS5xdWVyeShzcWwpO1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBUb3RhbCBkb2N1bWVudHMgdG8gZXhwb3J0OiAke3Jvd3MubGVuZ3RofWApO1xyXG5cclxuICAgICAgLy8gR2VuZXJhciBYTUwgZW4gZWwgZm9ybWF0byBzb2xpY2l0YWRvXHJcbiAgICAgIGxldCB4bWwgPSBYbWxVdGlsLmNyZWF0ZVhtbEhlYWRlcigpO1xyXG4gICAgICB4bWwgKz0gJzxSb3dzPlxcbic7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XHJcbiAgICAgICAgeG1sICs9ICc8Um93Plxcbic7XHJcbiAgICAgICAgeG1sICs9IGAgIDxOdW1lcm9Eb2M+JHtYbWxVdGlsLmVzY2FwZVhtbChcclxuICAgICAgICAgIHJvdy5OVU1FUk9FWFRFUk5PIHx8ICcnLFxyXG4gICAgICAgICl9PC9OdW1lcm9Eb2M+XFxuYDtcclxuICAgICAgICB4bWwgKz0gYCAgPE1vdGl2b1NlbGVjY2lvbj4ke1htbFV0aWwuZXNjYXBlWG1sKFxyXG4gICAgICAgICAgcm93Lk1PVElWT19TRUxFQ0NJT04gfHwgJycsXHJcbiAgICAgICAgKX08L01vdGl2b1NlbGVjY2lvbj5cXG5gO1xyXG4gICAgICAgIHhtbCArPSBgICA8UmVzdWx0YWRvU2VsZWNjaW9uPiR7WG1sVXRpbC5lc2NhcGVYbWwoXHJcbiAgICAgICAgICByb3cuUkVTVUxUQURPX1NFTEVDQ0lPTiB8fCAnJyxcclxuICAgICAgICApfTwvUmVzdWx0YWRvU2VsZWNjaW9uPlxcbmA7XHJcbiAgICAgICAgeG1sICs9IGAgIDxEZXRhbGxlPk3DoXMgSW5mby48L0RldGFsbGU+XFxuYDtcclxuICAgICAgICB4bWwgKz0gJzwvUm93Plxcbic7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhtbCArPSAnPC9Sb3dzPic7XHJcblxyXG4gICAgICAvLyBDb252ZXJ0aXIgWE1MIGEgQnVmZmVyXHJcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHhtbCwgJ3V0Zi04Jyk7XHJcblxyXG4gICAgICBjb25zdCBmaW5hbEZpbGVOYW1lID0gZmlsZU5hbWUgfHwgYGRvY3VtZW50b3NfZXhwb3J0XyR7cmVxdWVzdElkfV8ke0RhdGUubm93KCl9LnhtbGA7XHJcbiAgICAgIGNvbnN0IHMzS2V5ID0gYGV4cG9ydHMveG1scy8ke2ZpbmFsRmlsZU5hbWV9YDtcclxuXHJcbiAgICAgIGNvbnN0IHMzVXJsID0gYXdhaXQgdGhpcy5zM1NlcnZpY2UudXBsb2FkRmlsZSh7XHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGtleTogczNLZXksXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94bWwnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgWE1MIGdlbmVyYXRlZCBhbmQgdXBsb2FkZWQgdG8gUzM6ICR7czNVcmx9YCk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpbGVQYXRoOiBmaW5hbEZpbGVOYW1lLFxyXG4gICAgICAgIHMzS2V5LFxyXG4gICAgICAgIHMzVXJsLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgZ2VuZXJhdGluZyBYTUw6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuIl19