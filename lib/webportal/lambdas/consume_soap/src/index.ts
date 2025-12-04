import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import axios from 'axios';

interface SoapParameter {
  Nombre: string;
  Valor: string | number;
}

/**
 * Construye el request SOAP XML
 */
function buildSoapRequest(reporte: string, parametros: SoapParameter[]): string {
  const parametrosXml = parametros
    .map(
      (param) => `
      <adu:parametro>
        <adu:Nombre>${escapeXml(param.Nombre)}</adu:Nombre>
        <adu:Valor>${escapeXml(String(param.Valor))}</adu:Valor>
      </adu:parametro>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:adu="http://aduana.gob.cl/">
  <soapenv:Header/>
  <soapenv:Body>
    <adu:GenerarDocumento>
      <adu:reporte>${escapeXml(reporte)}</adu:reporte>${parametrosXml}
    </adu:GenerarDocumento>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Escapa caracteres especiales XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Handler principal de la lambda
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const soapEndpoint = process.env.SOAP_GENERAR_DOCUMENTO_URL || 
    'https://10.19.100.242/VisualDocsCliente/http/GenerarDocumentoService';

  try {
    // Parámetros de prueba (puedes ajustarlos según necesites)
    const reporte = 'gtime'; // o el reporte que necesites probar
    const parametros: SoapParameter[] = [
      { Nombre: 'param1', Valor: 'valor1' },
      { Nombre: 'param2', Valor: 'valor2' }
    ];

    console.log(`Llamando a servicio SOAP: ${soapEndpoint}`);
    console.log(`Reporte: ${reporte}`);
    console.log(`Parámetros: ${JSON.stringify(parametros)}`);

    const soapRequest = buildSoapRequest(reporte, parametros);
    console.log(`SOAP Request: ${soapRequest}`);

    // Hacer la petición SOAP
    const response = await axios.post(soapEndpoint, soapRequest, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      timeout: 30000, // 30 segundos timeout
    });

    console.log(`Respuesta SOAP recibida. Status: ${response.status}`);
    console.log(`Response headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`Response data (primeros 500 caracteres):`, 
      typeof response.data === 'string' 
        ? response.data.substring(0, 500) 
        : JSON.stringify(response.data).substring(0, 500));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'SOAP request completed successfully',
        soapEndpoint,
        reporte,
        parametros,
        responseStatus: response.status,
        responseHeaders: response.headers,
        responseDataPreview: typeof response.data === 'string' 
          ? response.data.substring(0, 1000) 
          : JSON.stringify(response.data).substring(0, 1000),
        fullResponseLength: typeof response.data === 'string' 
          ? response.data.length 
          : JSON.stringify(response.data).length,
      }, null, 2),
    };
  } catch (error: any) {
    console.error('Error llamando al servicio SOAP:', error.message);
    console.error('Error stack:', error.stack);

    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }

    if (error.request) {
      console.error('Request made but no response received');
      console.error('Request config:', error.config);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: 'Error calling SOAP service',
        error: error.message,
        errorType: error.name,
        soapEndpoint,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestConfig: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
        } : undefined,
      }, null, 2),
    };
  }
};

