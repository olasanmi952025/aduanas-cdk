import { ConfigService } from "@nestjs/config";
export interface SoapParameter {
    Nombre: string;
    Valor: string | number;
}
export interface GenerarDocumentoRequest {
    reporte: string;
    parametros: SoapParameter[];
}
export declare class SoapClientService {
    private readonly configService;
    private readonly logger;
    private readonly soapEndpoint;
    constructor(configService: ConfigService);
    /**
     * Genera un documento PDF llamando al servicio SOAP de Aduana
     * @param reporte Nombre del reporte (ej: 'gtime')
     * @param parametros Array de parámetros con Nombre y Valor
     * @returns Base64 del PDF generado
     */
    generarDocumento(reporte: string, parametros: SoapParameter[]): Promise<string>;
    /**
     * Construye el request SOAP XML
     */
    private buildSoapRequest;
    /**
     * Extrae el base64 de la respuesta SOAP
     */
    private extractBase64FromSoapResponse;
    /**
     * Escapa caracteres especiales XML
     */
    private escapeXml;
}
