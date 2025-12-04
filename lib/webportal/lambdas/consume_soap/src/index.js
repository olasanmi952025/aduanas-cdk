"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Construye el request SOAP XML
 */
function buildSoapRequest(reporte, parametros) {
    const parametrosXml = parametros
        .map((param) => `
      <adu:parametro>
        <adu:Nombre>${escapeXml(param.Nombre)}</adu:Nombre>
        <adu:Valor>${escapeXml(String(param.Valor))}</adu:Valor>
      </adu:parametro>`)
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
function escapeXml(text) {
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
const handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    const soapEndpoint = process.env.SOAP_GENERAR_DOCUMENTO_URL ||
        'https://10.19.100.242/VisualDocsCliente/http/GenerarDocumentoService';
    try {
        // Parámetros de prueba (puedes ajustarlos según necesites)
        const reporte = 'gtime'; // o el reporte que necesites probar
        const parametros = [
            { Nombre: 'param1', Valor: 'valor1' },
            { Nombre: 'param2', Valor: 'valor2' }
        ];
        console.log(`Llamando a servicio SOAP: ${soapEndpoint}`);
        console.log(`Reporte: ${reporte}`);
        console.log(`Parámetros: ${JSON.stringify(parametros)}`);
        const soapRequest = buildSoapRequest(reporte, parametros);
        console.log(`SOAP Request: ${soapRequest}`);
        // Hacer la petición SOAP
        const response = await axios_1.default.post(soapEndpoint, soapRequest, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '',
            },
            timeout: 30000, // 30 segundos timeout
        });
        console.log(`Respuesta SOAP recibida. Status: ${response.status}`);
        console.log(`Response headers:`, JSON.stringify(response.headers, null, 2));
        console.log(`Response data (primeros 500 caracteres):`, typeof response.data === 'string'
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
    }
    catch (error) {
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
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxrREFBMEI7QUFPMUI7O0dBRUc7QUFDSCxTQUFTLGdCQUFnQixDQUFDLE9BQWUsRUFBRSxVQUEyQjtJQUNwRSxNQUFNLGFBQWEsR0FBRyxVQUFVO1NBQzdCLEdBQUcsQ0FDRixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7O3NCQUVLLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO3FCQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt1QkFDNUIsQ0FDbEI7U0FDQSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFWixPQUFPOzs7OztxQkFLWSxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUFpQixhQUFhOzs7b0JBR2pELENBQUM7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxTQUFTLENBQUMsSUFBWTtJQUM3QixPQUFPLElBQUk7U0FDUixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztTQUN0QixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztTQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztTQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztTQUN2QixPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRDs7R0FFRztBQUNJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBMkIsRUFDM0IsT0FBZ0IsRUFDZ0IsRUFBRTtJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUxRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQjtRQUN6RCxzRUFBc0UsQ0FBQztJQUV6RSxJQUFJLENBQUM7UUFDSCwyREFBMkQ7UUFDM0QsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsb0NBQW9DO1FBQzdELE1BQU0sVUFBVSxHQUFvQjtZQUNsQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtZQUNyQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTtTQUN0QyxDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFekQsTUFBTSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFNUMseUJBQXlCO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBSyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFO1lBQzNELE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUseUJBQXlCO2dCQUN6QyxZQUFZLEVBQUUsRUFBRTthQUNqQjtZQUNELE9BQU8sRUFBRSxLQUFLLEVBQUUsc0JBQXNCO1NBQ3ZDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLEVBQ3BELE9BQU8sUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRO1lBQy9CLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFdkQsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7YUFDbkM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsT0FBTyxFQUFFLHFDQUFxQztnQkFDOUMsWUFBWTtnQkFDWixPQUFPO2dCQUNQLFVBQVU7Z0JBQ1YsY0FBYyxFQUFFLFFBQVEsQ0FBQyxNQUFNO2dCQUMvQixlQUFlLEVBQUUsUUFBUSxDQUFDLE9BQU87Z0JBQ2pDLG1CQUFtQixFQUFFLE9BQU8sUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRO29CQUNwRCxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQztvQkFDbEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDO2dCQUNwRCxrQkFBa0IsRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUTtvQkFDbkQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTTtvQkFDdEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU07YUFDekMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pFLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUzQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7WUFDdkQsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2FBQ25DO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSw0QkFBNEI7Z0JBQ3JDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNyQixZQUFZO2dCQUNaLGNBQWMsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU07Z0JBQ3RDLFlBQVksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUk7Z0JBQ2xDLGFBQWEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRztvQkFDckIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTTtvQkFDM0IsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTztpQkFDOUIsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUNkLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNaLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBbkdXLFFBQUEsT0FBTyxXQW1HbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0LCBDb250ZXh0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XHJcblxyXG5pbnRlcmZhY2UgU29hcFBhcmFtZXRlciB7XHJcbiAgTm9tYnJlOiBzdHJpbmc7XHJcbiAgVmFsb3I6IHN0cmluZyB8IG51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnN0cnV5ZSBlbCByZXF1ZXN0IFNPQVAgWE1MXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFNvYXBSZXF1ZXN0KHJlcG9ydGU6IHN0cmluZywgcGFyYW1ldHJvczogU29hcFBhcmFtZXRlcltdKTogc3RyaW5nIHtcclxuICBjb25zdCBwYXJhbWV0cm9zWG1sID0gcGFyYW1ldHJvc1xyXG4gICAgLm1hcChcclxuICAgICAgKHBhcmFtKSA9PiBgXHJcbiAgICAgIDxhZHU6cGFyYW1ldHJvPlxyXG4gICAgICAgIDxhZHU6Tm9tYnJlPiR7ZXNjYXBlWG1sKHBhcmFtLk5vbWJyZSl9PC9hZHU6Tm9tYnJlPlxyXG4gICAgICAgIDxhZHU6VmFsb3I+JHtlc2NhcGVYbWwoU3RyaW5nKHBhcmFtLlZhbG9yKSl9PC9hZHU6VmFsb3I+XHJcbiAgICAgIDwvYWR1OnBhcmFtZXRybz5gXHJcbiAgICApXHJcbiAgICAuam9pbignJyk7XHJcblxyXG4gIHJldHVybiBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+XHJcbjxzb2FwZW52OkVudmVsb3BlIHhtbG5zOnNvYXBlbnY9XCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy9zb2FwL2VudmVsb3BlL1wiIHhtbG5zOmFkdT1cImh0dHA6Ly9hZHVhbmEuZ29iLmNsL1wiPlxyXG4gIDxzb2FwZW52OkhlYWRlci8+XHJcbiAgPHNvYXBlbnY6Qm9keT5cclxuICAgIDxhZHU6R2VuZXJhckRvY3VtZW50bz5cclxuICAgICAgPGFkdTpyZXBvcnRlPiR7ZXNjYXBlWG1sKHJlcG9ydGUpfTwvYWR1OnJlcG9ydGU+JHtwYXJhbWV0cm9zWG1sfVxyXG4gICAgPC9hZHU6R2VuZXJhckRvY3VtZW50bz5cclxuICA8L3NvYXBlbnY6Qm9keT5cclxuPC9zb2FwZW52OkVudmVsb3BlPmA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFc2NhcGEgY2FyYWN0ZXJlcyBlc3BlY2lhbGVzIFhNTFxyXG4gKi9cclxuZnVuY3Rpb24gZXNjYXBlWG1sKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHRleHRcclxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXHJcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXHJcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXHJcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXHJcbiAgICAucmVwbGFjZSgvJy9nLCAnJmFwb3M7Jyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIYW5kbGVyIHByaW5jaXBhbCBkZSBsYSBsYW1iZGFcclxuICovXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxyXG4gIGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCxcclxuICBjb250ZXh0OiBDb250ZXh0XHJcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XHJcbiAgY29uc29sZS5sb2coJ0V2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XHJcbiAgY29uc29sZS5sb2coJ0NvbnRleHQ6JywgSlNPTi5zdHJpbmdpZnkoY29udGV4dCwgbnVsbCwgMikpO1xyXG5cclxuICBjb25zdCBzb2FwRW5kcG9pbnQgPSBwcm9jZXNzLmVudi5TT0FQX0dFTkVSQVJfRE9DVU1FTlRPX1VSTCB8fCBcclxuICAgICdodHRwczovLzEwLjE5LjEwMC4yNDIvVmlzdWFsRG9jc0NsaWVudGUvaHR0cC9HZW5lcmFyRG9jdW1lbnRvU2VydmljZSc7XHJcblxyXG4gIHRyeSB7XHJcbiAgICAvLyBQYXLDoW1ldHJvcyBkZSBwcnVlYmEgKHB1ZWRlcyBhanVzdGFybG9zIHNlZ8O6biBuZWNlc2l0ZXMpXHJcbiAgICBjb25zdCByZXBvcnRlID0gJ2d0aW1lJzsgLy8gbyBlbCByZXBvcnRlIHF1ZSBuZWNlc2l0ZXMgcHJvYmFyXHJcbiAgICBjb25zdCBwYXJhbWV0cm9zOiBTb2FwUGFyYW1ldGVyW10gPSBbXHJcbiAgICAgIHsgTm9tYnJlOiAncGFyYW0xJywgVmFsb3I6ICd2YWxvcjEnIH0sXHJcbiAgICAgIHsgTm9tYnJlOiAncGFyYW0yJywgVmFsb3I6ICd2YWxvcjInIH1cclxuICAgIF07XHJcblxyXG4gICAgY29uc29sZS5sb2coYExsYW1hbmRvIGEgc2VydmljaW8gU09BUDogJHtzb2FwRW5kcG9pbnR9YCk7XHJcbiAgICBjb25zb2xlLmxvZyhgUmVwb3J0ZTogJHtyZXBvcnRlfWApO1xyXG4gICAgY29uc29sZS5sb2coYFBhcsOhbWV0cm9zOiAke0pTT04uc3RyaW5naWZ5KHBhcmFtZXRyb3MpfWApO1xyXG5cclxuICAgIGNvbnN0IHNvYXBSZXF1ZXN0ID0gYnVpbGRTb2FwUmVxdWVzdChyZXBvcnRlLCBwYXJhbWV0cm9zKTtcclxuICAgIGNvbnNvbGUubG9nKGBTT0FQIFJlcXVlc3Q6ICR7c29hcFJlcXVlc3R9YCk7XHJcblxyXG4gICAgLy8gSGFjZXIgbGEgcGV0aWNpw7NuIFNPQVBcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChzb2FwRW5kcG9pbnQsIHNvYXBSZXF1ZXN0LCB7XHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ3RleHQveG1sOyBjaGFyc2V0PXV0Zi04JyxcclxuICAgICAgICAnU09BUEFjdGlvbic6ICcnLFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiAzMDAwMCwgLy8gMzAgc2VndW5kb3MgdGltZW91dFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc29sZS5sb2coYFJlc3B1ZXN0YSBTT0FQIHJlY2liaWRhLiBTdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgY29uc29sZS5sb2coYFJlc3BvbnNlIGhlYWRlcnM6YCwgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuaGVhZGVycywgbnVsbCwgMikpO1xyXG4gICAgY29uc29sZS5sb2coYFJlc3BvbnNlIGRhdGEgKHByaW1lcm9zIDUwMCBjYXJhY3RlcmVzKTpgLCBcclxuICAgICAgdHlwZW9mIHJlc3BvbnNlLmRhdGEgPT09ICdzdHJpbmcnIFxyXG4gICAgICAgID8gcmVzcG9uc2UuZGF0YS5zdWJzdHJpbmcoMCwgNTAwKSBcclxuICAgICAgICA6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmRhdGEpLnN1YnN0cmluZygwLCA1MDApKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdTT0FQIHJlcXVlc3QgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICAgc29hcEVuZHBvaW50LFxyXG4gICAgICAgIHJlcG9ydGUsXHJcbiAgICAgICAgcGFyYW1ldHJvcyxcclxuICAgICAgICByZXNwb25zZVN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxyXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcclxuICAgICAgICByZXNwb25zZURhdGFQcmV2aWV3OiB0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ3N0cmluZycgXHJcbiAgICAgICAgICA/IHJlc3BvbnNlLmRhdGEuc3Vic3RyaW5nKDAsIDEwMDApIFxyXG4gICAgICAgICAgOiBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5kYXRhKS5zdWJzdHJpbmcoMCwgMTAwMCksXHJcbiAgICAgICAgZnVsbFJlc3BvbnNlTGVuZ3RoOiB0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ3N0cmluZycgXHJcbiAgICAgICAgICA/IHJlc3BvbnNlLmRhdGEubGVuZ3RoIFxyXG4gICAgICAgICAgOiBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5kYXRhKS5sZW5ndGgsXHJcbiAgICAgIH0sIG51bGwsIDIpLFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsbGFtYW5kbyBhbCBzZXJ2aWNpbyBTT0FQOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhY2s6JywgZXJyb3Iuc3RhY2spO1xyXG5cclxuICAgIGlmIChlcnJvci5yZXNwb25zZSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBSZXNwb25zZSBzdGF0dXM6ICR7ZXJyb3IucmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBSZXNwb25zZSBkYXRhOmAsIGVycm9yLnJlc3BvbnNlLmRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChlcnJvci5yZXF1ZXN0KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlcXVlc3QgbWFkZSBidXQgbm8gcmVzcG9uc2UgcmVjZWl2ZWQnKTtcclxuICAgICAgY29uc29sZS5lcnJvcignUmVxdWVzdCBjb25maWc6JywgZXJyb3IuY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBtZXNzYWdlOiAnRXJyb3IgY2FsbGluZyBTT0FQIHNlcnZpY2UnLFxyXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgIGVycm9yVHlwZTogZXJyb3IubmFtZSxcclxuICAgICAgICBzb2FwRW5kcG9pbnQsXHJcbiAgICAgICAgcmVzcG9uc2VTdGF0dXM6IGVycm9yLnJlc3BvbnNlPy5zdGF0dXMsXHJcbiAgICAgICAgcmVzcG9uc2VEYXRhOiBlcnJvci5yZXNwb25zZT8uZGF0YSxcclxuICAgICAgICByZXF1ZXN0Q29uZmlnOiBlcnJvci5jb25maWcgPyB7XHJcbiAgICAgICAgICB1cmw6IGVycm9yLmNvbmZpZy51cmwsXHJcbiAgICAgICAgICBtZXRob2Q6IGVycm9yLmNvbmZpZy5tZXRob2QsXHJcbiAgICAgICAgICBoZWFkZXJzOiBlcnJvci5jb25maWcuaGVhZGVycyxcclxuICAgICAgICB9IDogdW5kZWZpbmVkLFxyXG4gICAgICB9LCBudWxsLCAyKSxcclxuICAgIH07XHJcbiAgfVxyXG59O1xyXG5cclxuIl19