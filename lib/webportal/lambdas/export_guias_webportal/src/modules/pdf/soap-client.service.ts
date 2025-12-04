import axios from "axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MOCK_SOAP_RESPONSE } from "../../shared/constants/mock-soap.constant";

export interface SoapParameter {
  Nombre: string;
  Valor: string | number;
}

export interface GenerarDocumentoRequest {
  reporte: string;
  parametros: SoapParameter[];
}

@Injectable()
export class SoapClientService {
  private readonly logger = new Logger(SoapClientService.name);
  private readonly soapEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    // URL del servicio SOAP
    this.soapEndpoint =
      this.configService.get<string>("SOAP_GENERAR_DOCUMENTO_URL") ||
      "https://testesb.aduana.cl/VisualDocsCliente/http/GenerarDocumentoService";
  }

  /**
   * Genera un documento PDF llamando al servicio SOAP de Aduana
   * @param reporte Nombre del reporte (ej: 'gtime')
   * @param parametros Array de parámetros con Nombre y Valor
   * @returns Base64 del PDF generado
   */
  async generarDocumento(
    reporte: string,
    parametros: SoapParameter[]
  ): Promise<string> {
    try {
      this.logger.log(
        `Llamando a servicio SOAP GenerarDocumento. Reporte: ${reporte}, Parámetros: ${JSON.stringify(
          parametros
        )}`
      );

      const soapRequest = this.buildSoapRequest(reporte, parametros);

      this.logger.debug(`SOAP Request: ${soapRequest}`);

      const isMockDocument = this.configService.get<boolean>("ENABLE_MOCK_DOCUMENT");
      let response: any;
      if (isMockDocument && Boolean(isMockDocument) === true) {
        this.logger.log("Usando respuesta mock en el servicio SOAP");
        response = MOCK_SOAP_RESPONSE;
      } else {
        response = await axios.post(this.soapEndpoint, soapRequest, {
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

      this.logger.log(
        `PDF generado exitosamente. Tamaño base64: ${base64.length} caracteres`
      );

      return base64;
    } catch (error: any) {
      this.logger.error(
        `Error llamando al servicio SOAP: ${error.message}`,
        error.stack
      );

      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`
        );
      }

      throw new Error(`Error generando documento SOAP: ${error.message}`);
    }
  }

  /**
   * Construye el request SOAP XML
   */
  private buildSoapRequest(
    reporte: string,
    parametros: SoapParameter[]
  ): string {
    const parametrosXml = parametros
      .map(
        (param) => `
      <adu:parametro>
        <adu:Nombre>${this.escapeXml(param.Nombre)}</adu:Nombre>
        <adu:Valor>${this.escapeXml(String(param.Valor))}</adu:Valor>
      </adu:parametro>`
      )
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
  private extractBase64FromSoapResponse(responseData: string): string | null {
    try {
      // Intentar extraer de la etiqueta <documento>
      const documentoMatch = responseData.match(
        /<documento[^>]*>([\s\S]*?)<\/documento>/i
      );

      if (documentoMatch && documentoMatch[1]) {
        // Limpiar espacios y saltos de línea
        return documentoMatch[1].trim();
      }

      // Buscar el contenido entre las etiquetas de retorno
      // El servicio típicamente retorna algo como <return>base64content</return>
      const returnMatch = responseData.match(
        /<return[^>]*>([\s\S]*?)<\/return>/i
      );

      if (returnMatch && returnMatch[1]) {
        // Limpiar espacios y saltos de línea
        return returnMatch[1].trim();
      }

      // Intentar otra estructura común
      const base64Match = responseData.match(
        /<ns\d*:return[^>]*>([\s\S]*?)<\/ns\d*:return>/i
      );

      if (base64Match && base64Match[1]) {
        return base64Match[1].trim();
      }

      this.logger.warn(
        "No se pudo encontrar el tag <documento>, <return> o <ns*:return> en la respuesta SOAP"
      );
      return null;
    } catch (error: any) {
      this.logger.error(`Error extrayendo base64: ${error.message}`);
      return null;
    }
  }

  /**
   * Escapa caracteres especiales XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
