"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SoapClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoapClientService = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const mock_soap_constant_1 = require("../../shared/constants/mock-soap.constant");
let SoapClientService = SoapClientService_1 = class SoapClientService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SoapClientService_1.name);
        // URL del servicio SOAP
        this.soapEndpoint =
            this.configService.get("SOAP_GENERAR_DOCUMENTO_URL") ||
                "https://testesb.aduana.cl/VisualDocsCliente/http/GenerarDocumentoService";
    }
    /**
     * Genera un documento PDF llamando al servicio SOAP de Aduana
     * @param reporte Nombre del reporte (ej: 'gtime')
     * @param parametros Array de parámetros con Nombre y Valor
     * @returns Base64 del PDF generado
     */
    async generarDocumento(reporte, parametros) {
        try {
            this.logger.log(`Llamando a servicio SOAP GenerarDocumento. Reporte: ${reporte}, Parámetros: ${JSON.stringify(parametros)}`);
            const soapRequest = this.buildSoapRequest(reporte, parametros);
            this.logger.debug(`SOAP Request: ${soapRequest}`);
            const isMockDocument = this.configService.get("ENABLE_MOCK_DOCUMENT");
            let response;
            if (isMockDocument && Boolean(isMockDocument) === true) {
                this.logger.log("Usando respuesta mock en el servicio SOAP");
                response = mock_soap_constant_1.MOCK_SOAP_RESPONSE;
            }
            else {
                response = await axios_1.default.post(this.soapEndpoint, soapRequest, {
                    headers: {
                        "Content-Type": "text/xml; charset=utf-8",
                        SOAPAction: "",
                    },
                    timeout: 30000, // 30 segundos timeout
                });
            }
            this.logger.log(`Respuesta SOAP recibida. Status: ${response.status}`);
            // Extraer el base64 de la respuesta SOAP
            const base64 = this.extractBase64FromSoapResponse(response.data);
            if (!base64) {
                throw new Error("No se pudo extraer el base64 de la respuesta SOAP");
            }
            this.logger.log(`PDF generado exitosamente. Tamaño base64: ${base64.length} caracteres`);
            return base64;
        }
        catch (error) {
            this.logger.error(`Error llamando al servicio SOAP: ${error.message}`, error.stack);
            if (error.response) {
                this.logger.error(`Response status: ${error.response.status}`);
                this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Error generando documento SOAP: ${error.message}`);
        }
    }
    /**
     * Construye el request SOAP XML
     */
    buildSoapRequest(reporte, parametros) {
        const parametrosXml = parametros
            .map((param) => `
      <adu:parametro>
        <adu:Nombre>${this.escapeXml(param.Nombre)}</adu:Nombre>
        <adu:Valor>${this.escapeXml(String(param.Valor))}</adu:Valor>
      </adu:parametro>`)
            .join("");
        return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:adu="http://aduana.gob.cl/">
  <soapenv:Header/>
  <soapenv:Body>
    <adu:GenerarDocumento>
      <adu:reporte>${this.escapeXml(reporte)}</adu:reporte>${parametrosXml}
    </adu:GenerarDocumento>
  </soapenv:Body>
</soapenv:Envelope>`;
    }
    /**
     * Extrae el base64 de la respuesta SOAP
     */
    extractBase64FromSoapResponse(responseData) {
        try {
            // Intentar extraer de la etiqueta <documento>
            const documentoMatch = responseData.match(/<documento[^>]*>([\s\S]*?)<\/documento>/i);
            if (documentoMatch && documentoMatch[1]) {
                // Limpiar espacios y saltos de línea
                return documentoMatch[1].trim();
            }
            // Buscar el contenido entre las etiquetas de retorno
            // El servicio típicamente retorna algo como <return>base64content</return>
            const returnMatch = responseData.match(/<return[^>]*>([\s\S]*?)<\/return>/i);
            if (returnMatch && returnMatch[1]) {
                // Limpiar espacios y saltos de línea
                return returnMatch[1].trim();
            }
            // Intentar otra estructura común
            const base64Match = responseData.match(/<ns\d*:return[^>]*>([\s\S]*?)<\/ns\d*:return>/i);
            if (base64Match && base64Match[1]) {
                return base64Match[1].trim();
            }
            this.logger.warn("No se pudo encontrar el tag <documento>, <return> o <ns*:return> en la respuesta SOAP");
            return null;
        }
        catch (error) {
            this.logger.error(`Error extrayendo base64: ${error.message}`);
            return null;
        }
    }
    /**
     * Escapa caracteres especiales XML
     */
    escapeXml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
};
exports.SoapClientService = SoapClientService;
exports.SoapClientService = SoapClientService = SoapClientService_1 = __decorate([
    (0, common_1.Injectable)()
], SoapClientService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29hcC1jbGllbnQuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNvYXAtY2xpZW50LnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQ0FBb0Q7QUFFcEQsa0ZBQStFO0FBYXhFLElBQU0saUJBQWlCLHlCQUF2QixNQUFNLGlCQUFpQjtJQUk1QixZQUE2QixhQUE0QjtRQUE1QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUh4QyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsbUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFJM0Qsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxZQUFZO1lBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsNEJBQTRCLENBQUM7Z0JBQzVELDBFQUEwRSxDQUFDO0lBQy9FLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxnQkFBZ0IsQ0FDcEIsT0FBZSxFQUNmLFVBQTJCO1FBRTNCLElBQUksQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNiLHVEQUF1RCxPQUFPLGlCQUFpQixJQUFJLENBQUMsU0FBUyxDQUMzRixVQUFVLENBQ1gsRUFBRSxDQUNKLENBQUM7WUFFRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBRWxELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFVLHNCQUFzQixDQUFDLENBQUM7WUFDL0UsSUFBSSxRQUFhLENBQUM7WUFDbEIsSUFBSSxjQUFjLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUMsTUFBTSxD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QkFDbEMscUNBQXFDO2dCQUNyQyxPQUFPLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBRUQsaUNBQWlDO1lBQ2pDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQ3BDLGdEQUFnRCxDQUNqRCxDQUFDO1lBRUYsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9CLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZCx1RkFBdUYsQ0FDeEYsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLFNBQVMsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sSUFBSTthQUNSLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDO2FBQ3RCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO2FBQ3JCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO2FBQ3JCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO2FBQ3ZCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUNGLENBQUE7QUFsS1ksOENBQWlCOzRCQUFqQixpQkFBaUI7SUFEN0IsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsaUJBQWlCLENBa0s3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBheGlvcyBmcm9tIFwiYXhpb3NcIjtcclxuaW1wb3J0IHsgSW5qZWN0YWJsZSwgTG9nZ2VyIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tIFwiQG5lc3Rqcy9jb25maWdcIjtcclxuaW1wb3J0IHsgTU9DS19TT0FQX1JFU1BPTlNFIH0gZnJvbSBcIi4uLy4uL3NoYXJlZC9jb25zdGFudHMvbW9jay1zb2FwLmNvbnN0YW50XCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNvYXBQYXJhbWV0ZXIge1xyXG4gIE5vbWJyZTogc3RyaW5nO1xyXG4gIFZhbG9yOiBzdHJpbmcgfCBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJhckRvY3VtZW50b1JlcXVlc3Qge1xyXG4gIHJlcG9ydGU6IHN0cmluZztcclxuICBwYXJhbWV0cm9zOiBTb2FwUGFyYW1ldGVyW107XHJcbn1cclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIFNvYXBDbGllbnRTZXJ2aWNlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoU29hcENsaWVudFNlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBzb2FwRW5kcG9pbnQ6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlKSB7XHJcbiAgICAvLyBVUkwgZGVsIHNlcnZpY2lvIFNPQVBcclxuICAgIHRoaXMuc29hcEVuZHBvaW50ID1cclxuICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KFwiU09BUF9HRU5FUkFSX0RPQ1VNRU5UT19VUkxcIikgfHxcclxuICAgICAgXCJodHRwczovL3Rlc3Rlc2IuYWR1YW5hLmNsL1Zpc3VhbERvY3NDbGllbnRlL2h0dHAvR2VuZXJhckRvY3VtZW50b1NlcnZpY2VcIjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYSB1biBkb2N1bWVudG8gUERGIGxsYW1hbmRvIGFsIHNlcnZpY2lvIFNPQVAgZGUgQWR1YW5hXHJcbiAgICogQHBhcmFtIHJlcG9ydGUgTm9tYnJlIGRlbCByZXBvcnRlIChlajogJ2d0aW1lJylcclxuICAgKiBAcGFyYW0gcGFyYW1ldHJvcyBBcnJheSBkZSBwYXLDoW1ldHJvcyBjb24gTm9tYnJlIHkgVmFsb3JcclxuICAgKiBAcmV0dXJucyBCYXNlNjQgZGVsIFBERiBnZW5lcmFkb1xyXG4gICAqL1xyXG4gIGFzeW5jIGdlbmVyYXJEb2N1bWVudG8oXHJcbiAgICByZXBvcnRlOiBzdHJpbmcsXHJcbiAgICBwYXJhbWV0cm9zOiBTb2FwUGFyYW1ldGVyW11cclxuICApOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKFxyXG4gICAgICAgIGBMbGFtYW5kbyBhIHNlcnZpY2lvIFNPQVAgR2VuZXJhckRvY3VtZW50by4gUmVwb3J0ZTogJHtyZXBvcnRlfSwgUGFyw6FtZXRyb3M6ICR7SlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgICBwYXJhbWV0cm9zXHJcbiAgICAgICAgKX1gXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBjb25zdCBzb2FwUmVxdWVzdCA9IHRoaXMuYnVpbGRTb2FwUmVxdWVzdChyZXBvcnRlLCBwYXJhbWV0cm9zKTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBTT0FQIFJlcXVlc3Q6ICR7c29hcFJlcXVlc3R9YCk7XHJcblxyXG4gICAgICBjb25zdCBpc01vY2tEb2N1bWVudCA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8Ym9vbGVhbj4oXCJFTkFCTEVfTU9DS19ET0NVTUVOVFwiKTtcclxuICAgICAgbGV0IHJlc3BvbnNlOiBhbnk7XHJcbiAgICAgIGlmIChpc01vY2tEb2N1bWVudCAmJiBCb29sZWFuKGlzTW9ja0RvY3VtZW50KSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmxvZyhcIlVzYW5kbyByZXNwdWVzdGEgbW9jayBlbiBlbCBzZXJ2aWNpbyBTT0FQXCIpO1xyXG4gICAgICAgIHJlc3BvbnNlID0gTU9DS19TT0FQX1JFU1BPTlNFO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdCh0aGlzLnNvYXBFbmRwb2ludCwgc29hcFJlcXVlc3QsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3htbDsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBTT0FQQWN0aW9uOiBcIlwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHRpbWVvdXQ6IDMwMDAwLCAvLyAzMCBzZWd1bmRvcyB0aW1lb3V0XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgUmVzcHVlc3RhIFNPQVAgcmVjaWJpZGEuIFN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcblxyXG4gICAgICAvLyBFeHRyYWVyIGVsIGJhc2U2NCBkZSBsYSByZXNwdWVzdGEgU09BUFxyXG4gICAgICBjb25zdCBiYXNlNjQgPSB0aGlzLmV4dHJhY3RCYXNlNjRGcm9tU29hcFJlc3BvbnNlKHJlc3BvbnNlLmRhdGEpO1xyXG5cclxuICAgICAgaWYgKCFiYXNlNjQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBzZSBwdWRvIGV4dHJhZXIgZWwgYmFzZTY0IGRlIGxhIHJlc3B1ZXN0YSBTT0FQXCIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYFBERiBnZW5lcmFkbyBleGl0b3NhbWVudGUuIFRhbWHDsW8gYmFzZTY0OiAke2Jhc2U2NC5sZW5ndGh9IGNhcmFjdGVyZXNgXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gYmFzZTY0O1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICBgRXJyb3IgbGxhbWFuZG8gYWwgc2VydmljaW8gU09BUDogJHtlcnJvci5tZXNzYWdlfWAsXHJcbiAgICAgICAgZXJyb3Iuc3RhY2tcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChlcnJvci5yZXNwb25zZSkge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBSZXNwb25zZSBzdGF0dXM6ICR7ZXJyb3IucmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFxyXG4gICAgICAgICAgYFJlc3BvbnNlIGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IucmVzcG9uc2UuZGF0YSl9YFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZ2VuZXJhbmRvIGRvY3VtZW50byBTT0FQOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1eWUgZWwgcmVxdWVzdCBTT0FQIFhNTFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYnVpbGRTb2FwUmVxdWVzdChcclxuICAgIHJlcG9ydGU6IHN0cmluZyxcclxuICAgIHBhcmFtZXRyb3M6IFNvYXBQYXJhbWV0ZXJbXVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBwYXJhbWV0cm9zWG1sID0gcGFyYW1ldHJvc1xyXG4gICAgICAubWFwKFxyXG4gICAgICAgIChwYXJhbSkgPT4gYFxyXG4gICAgICA8YWR1OnBhcmFtZXRybz5cclxuICAgICAgICA8YWR1Ok5vbWJyZT4ke3RoaXMuZXNjYXBlWG1sKHBhcmFtLk5vbWJyZSl9PC9hZHU6Tm9tYnJlPlxyXG4gICAgICAgIDxhZHU6VmFsb3I+JHt0aGlzLmVzY2FwZVhtbChTdHJpbmcocGFyYW0uVmFsb3IpKX08L2FkdTpWYWxvcj5cclxuICAgICAgPC9hZHU6cGFyYW1ldHJvPmBcclxuICAgICAgKVxyXG4gICAgICAuam9pbihcIlwiKTtcclxuXHJcbiAgICByZXR1cm4gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxyXG48c29hcGVudjpFbnZlbG9wZSB4bWxuczpzb2FwZW52PVwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvc29hcC9lbnZlbG9wZS9cIiB4bWxuczphZHU9XCJodHRwOi8vYWR1YW5hLmdvYi5jbC9cIj5cclxuICA8c29hcGVudjpIZWFkZXIvPlxyXG4gIDxzb2FwZW52OkJvZHk+XHJcbiAgICA8YWR1OkdlbmVyYXJEb2N1bWVudG8+XHJcbiAgICAgIDxhZHU6cmVwb3J0ZT4ke3RoaXMuZXNjYXBlWG1sKHJlcG9ydGUpfTwvYWR1OnJlcG9ydGU+JHtwYXJhbWV0cm9zWG1sfVxyXG4gICAgPC9hZHU6R2VuZXJhckRvY3VtZW50bz5cclxuICA8L3NvYXBlbnY6Qm9keT5cclxuPC9zb2FwZW52OkVudmVsb3BlPmA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHRyYWUgZWwgYmFzZTY0IGRlIGxhIHJlc3B1ZXN0YSBTT0FQXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBleHRyYWN0QmFzZTY0RnJvbVNvYXBSZXNwb25zZShyZXNwb25zZURhdGE6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gSW50ZW50YXIgZXh0cmFlciBkZSBsYSBldGlxdWV0YSA8ZG9jdW1lbnRvPlxyXG4gICAgICBjb25zdCBkb2N1bWVudG9NYXRjaCA9IHJlc3BvbnNlRGF0YS5tYXRjaChcclxuICAgICAgICAvPGRvY3VtZW50b1tePl0qPihbXFxzXFxTXSo/KTxcXC9kb2N1bWVudG8+L2lcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChkb2N1bWVudG9NYXRjaCAmJiBkb2N1bWVudG9NYXRjaFsxXSkge1xyXG4gICAgICAgIC8vIExpbXBpYXIgZXNwYWNpb3MgeSBzYWx0b3MgZGUgbMOtbmVhXHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50b01hdGNoWzFdLnRyaW0oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQnVzY2FyIGVsIGNvbnRlbmlkbyBlbnRyZSBsYXMgZXRpcXVldGFzIGRlIHJldG9ybm9cclxuICAgICAgLy8gRWwgc2VydmljaW8gdMOtcGljYW1lbnRlIHJldG9ybmEgYWxnbyBjb21vIDxyZXR1cm4+YmFzZTY0Y29udGVudDwvcmV0dXJuPlxyXG4gICAgICBjb25zdCByZXR1cm5NYXRjaCA9IHJlc3BvbnNlRGF0YS5tYXRjaChcclxuICAgICAgICAvPHJldHVybltePl0qPihbXFxzXFxTXSo/KTxcXC9yZXR1cm4+L2lcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChyZXR1cm5NYXRjaCAmJiByZXR1cm5NYXRjaFsxXSkge1xyXG4gICAgICAgIC8vIExpbXBpYXIgZXNwYWNpb3MgeSBzYWx0b3MgZGUgbMOtbmVhXHJcbiAgICAgICAgcmV0dXJuIHJldHVybk1hdGNoWzFdLnRyaW0oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW50ZW50YXIgb3RyYSBlc3RydWN0dXJhIGNvbcO6blxyXG4gICAgICBjb25zdCBiYXNlNjRNYXRjaCA9IHJlc3BvbnNlRGF0YS5tYXRjaChcclxuICAgICAgICAvPG5zXFxkKjpyZXR1cm5bXj5dKj4oW1xcc1xcU10qPyk8XFwvbnNcXGQqOnJldHVybj4vaVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKGJhc2U2NE1hdGNoICYmIGJhc2U2NE1hdGNoWzFdKSB7XHJcbiAgICAgICAgcmV0dXJuIGJhc2U2NE1hdGNoWzFdLnRyaW0oKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5sb2dnZXIud2FybihcclxuICAgICAgICBcIk5vIHNlIHB1ZG8gZW5jb250cmFyIGVsIHRhZyA8ZG9jdW1lbnRvPiwgPHJldHVybj4gbyA8bnMqOnJldHVybj4gZW4gbGEgcmVzcHVlc3RhIFNPQVBcIlxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIGV4dHJheWVuZG8gYmFzZTY0OiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXNjYXBhIGNhcmFjdGVyZXMgZXNwZWNpYWxlcyBYTUxcclxuICAgKi9cclxuICBwcml2YXRlIGVzY2FwZVhtbCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRleHRcclxuICAgICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxyXG4gICAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcclxuICAgICAgLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXHJcbiAgICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxyXG4gICAgICAucmVwbGFjZSgvJy9nLCBcIiZhcG9zO1wiKTtcclxuICB9XHJcbn1cclxuIl19