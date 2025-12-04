"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fastify_1 = __importDefault(require("fastify"));
const aws_lambda_1 = __importDefault(require("@fastify/aws-lambda"));
const app_module_1 = require("./app.module");
const sqs_handler_1 = require("./handlers/sqs.handler");
let cachedServer;
async function createNestServer() {
    if (!cachedServer) {
        const fastifyApp = (0, fastify_1.default)();
        try {
            const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter(fastifyApp));
            app.setGlobalPrefix('api');
            app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
            app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });
            // Swagger simplificado para Fastify
            const cfg = new swagger_1.DocumentBuilder().setTitle('Aduanas Service').setVersion('1.0.0').addBearerAuth().build();
            const doc = swagger_1.SwaggerModule.createDocument(app, cfg);
            // Endpoint simple para obtener la documentación JSON
            fastifyApp.get('/api/docs-json', async (request, reply) => {
                return doc;
            });
            // Función para generar HTML de documentación con Swagger UI
            const generateDocsHTML = () => `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aduanas Service API</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
          <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function() {
              const ui = SwaggerUIBundle({
                url: '/api/docs-json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
        </html>
      `;
            // Endpoint simple para mostrar documentación básica (sin barra)
            fastifyApp.get('/api/docs', async (request, reply) => {
                reply.type('text/html');
                return generateDocsHTML();
            });
            // Endpoint simple para mostrar documentación básica (con barra)
            fastifyApp.get('/api/docs/', async (request, reply) => {
                reply.type('text/html');
                return generateDocsHTML();
            });
            await app.init();
            // Registrar @fastify/aws-lambda DESPUÉS de inicializar NestJS y obtener el handler
            cachedServer = (0, aws_lambda_1.default)(fastifyApp);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log('Error initializing NestJS app:', errorMessage);
            // Health check básico si NestJS falla (solo si no se puede inicializar)
            fastifyApp.get('/api/health', async (request, reply) => {
                return {
                    status: 'ERROR',
                    ts: new Date().toISOString(),
                    error: 'NestJS initialization failed'
                };
            });
            cachedServer = (0, aws_lambda_1.default)(fastifyApp);
        }
    }
    return cachedServer;
}
const handler = async (event, context) => {
    // Normalizar el path removiendo el prefijo del API Gateway (/documentos o /guias)
    const normalizePath = (path) => {
        if (!path)
            return path;
        // Remover prefijos /documentos o /guias del path
        const normalized = path.replace(/^\/(documentos|guias)/, '');
        return normalized || '/';
    };
    // Normalizar el path del evento y requestContext
    if (event.path) {
        const originalPath = event.path;
        event.path = normalizePath(event.path);
        console.log(`Path normalized: ${originalPath} -> ${event.path}`);
    }
    if (event.requestContext?.path) {
        const originalRequestPath = event.requestContext.path;
        event.requestContext.path = normalizePath(event.requestContext.path);
        console.log(`RequestContext path normalized: ${originalRequestPath} -> ${event.requestContext.path}`);
    }
    if (event.requestContext?.resourcePath) {
        const originalResourcePath = event.requestContext.resourcePath;
        event.requestContext.resourcePath = normalizePath(event.requestContext.resourcePath);
        console.log(`ResourcePath normalized: ${originalResourcePath} -> ${event.requestContext.resourcePath}`);
    }
    // Health check directo sin pasar por NestJS (después de normalizar)
    if (event.path === '/api/health' && event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                status: 'OK',
                ts: new Date().toISOString(),
                service: 'Aduanas Service',
                version: '1.0.0'
            })
        };
    }
    // Detectar si es un evento SQS
    if (event.Records && event.Records[0]?.eventSource === 'aws:sqs') {
        console.log('Processing SQS event');
        return (0, sqs_handler_1.sqsHandler)(event, context);
    }
    // Detectar si es un evento HTTP (API Gateway)
    if (event.httpMethod || event.requestContext) {
        console.log('Processing HTTP event', {
            method: event.httpMethod,
            path: event.path,
            rawPath: event.rawPath,
            requestContext: event.requestContext?.path
        });
        const handler = await createNestServer();
        return handler(event, context);
    }
    // Fallback para otros tipos de eventos
    console.log('Processing unknown event type, falling back to HTTP handler');
    const handler = await createNestServer();
    return handler(event, context);
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQix1Q0FBMkM7QUFDM0MsK0RBQTBEO0FBQzFELDJDQUFnRDtBQUNoRCw2Q0FBaUU7QUFDakUsc0RBQThCO0FBQzlCLHFFQUE0QztBQUU1Qyw2Q0FBeUM7QUFFekMsd0RBQW9EO0FBRXBELElBQUksWUFBaUIsQ0FBQztBQUV0QixLQUFLLFVBQVUsZ0JBQWdCO0lBQzdCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztRQUU3QixJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFTLEVBQUUsSUFBSSxpQ0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFaEYsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksdUJBQWMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFOUUsb0NBQW9DO1lBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUkseUJBQWUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMxRyxNQUFNLEdBQUcsR0FBRyx1QkFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFbkQscURBQXFEO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLE9BQVksRUFBRSxLQUFVLEVBQUUsRUFBRTtnQkFDbEUsT0FBTyxHQUFHLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQztZQUVILDREQUE0RDtZQUM1RCxNQUFNLGdCQUFnQixHQUFHLEdBQUcsRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW1DOUIsQ0FBQztZQUVGLGdFQUFnRTtZQUNoRSxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLEtBQVUsRUFBRSxFQUFFO2dCQUM3RCxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN4QixPQUFPLGdCQUFnQixFQUFFLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxnRUFBZ0U7WUFDaEUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLE9BQVksRUFBRSxLQUFVLEVBQUUsRUFBRTtnQkFDOUQsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDeEIsT0FBTyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFakIsbUZBQW1GO1lBQ25GLFlBQVksR0FBRyxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUM7UUFFdkMsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixNQUFNLFlBQVksR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUU1RCx3RUFBd0U7WUFDeEUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLE9BQVksRUFBRSxLQUFVLEVBQUUsRUFBRTtnQkFDL0QsT0FBTztvQkFDTCxNQUFNLEVBQUUsT0FBTztvQkFDZixFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7b0JBQzVCLEtBQUssRUFBRSw4QkFBOEI7aUJBQ3RDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILFlBQVksR0FBRyxJQUFBLG9CQUFTLEVBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN4RCxrRkFBa0Y7SUFDbEYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRTtRQUM3QyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3ZCLGlEQUFpRDtRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdELE9BQU8sVUFBVSxJQUFJLEdBQUcsQ0FBQztJQUMzQixDQUFDLENBQUM7SUFFRixpREFBaUQ7SUFDakQsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ2hDLEtBQUssQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixZQUFZLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMvQixNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO1FBQ3RELEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLG1CQUFtQixPQUFPLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN4RyxDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7UUFDL0QsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsb0JBQW9CLE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFRCxvRUFBb0U7SUFDcEUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLGFBQWEsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLEtBQUssRUFBRSxDQUFDO1FBQy9ELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2dCQUNsQyw4QkFBOEIsRUFBRSxjQUFjO2dCQUM5Qyw4QkFBOEIsRUFBRSxpQ0FBaUM7YUFDbEU7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUM1QixPQUFPLEVBQUUsaUJBQWlCO2dCQUMxQixPQUFPLEVBQUUsT0FBTzthQUNqQixDQUFDO1NBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCwrQkFBK0I7SUFDL0IsSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwQyxPQUFPLElBQUEsd0JBQVUsRUFBQyxLQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsSUFBSSxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFO1lBQ25DLE1BQU0sRUFBRSxLQUFLLENBQUMsVUFBVTtZQUN4QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLGNBQWMsRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLElBQUk7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsTUFBTSxnQkFBZ0IsRUFBRSxDQUFDO1FBRXpDLE9BQU8sT0FBTyxDQUFDLEtBQTZCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLDZEQUE2RCxDQUFDLENBQUM7SUFDM0UsTUFBTSxPQUFPLEdBQUcsTUFBTSxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3pDLE9BQU8sT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUM7QUF2RVcsUUFBQSxPQUFPLFdBdUVsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XHJcbmltcG9ydCB7IE5lc3RGYWN0b3J5IH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcclxuaW1wb3J0IHsgRmFzdGlmeUFkYXB0ZXIgfSBmcm9tICdAbmVzdGpzL3BsYXRmb3JtLWZhc3RpZnknO1xyXG5pbXBvcnQgeyBWYWxpZGF0aW9uUGlwZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgU3dhZ2dlck1vZHVsZSwgRG9jdW1lbnRCdWlsZGVyIH0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcclxuaW1wb3J0IGZhc3RpZnkgZnJvbSAnZmFzdGlmeSc7XHJcbmltcG9ydCBhd3NsYW1iZGEgZnJvbSAnQGZhc3RpZnkvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQsIENvbnRleHQsIFNRU0V2ZW50IH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwLm1vZHVsZSc7XHJcbmltcG9ydCB7IGh0dHBIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVycy9odHRwLmhhbmRsZXInO1xyXG5pbXBvcnQgeyBzcXNIYW5kbGVyIH0gZnJvbSAnLi9oYW5kbGVycy9zcXMuaGFuZGxlcic7XHJcblxyXG5sZXQgY2FjaGVkU2VydmVyOiBhbnk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVOZXN0U2VydmVyKCkge1xyXG4gIGlmICghY2FjaGVkU2VydmVyKSB7XHJcbiAgICBjb25zdCBmYXN0aWZ5QXBwID0gZmFzdGlmeSgpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGFwcCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZShBcHBNb2R1bGUsIG5ldyBGYXN0aWZ5QWRhcHRlcihmYXN0aWZ5QXBwKSk7XHJcblxyXG4gICAgICBhcHAuc2V0R2xvYmFsUHJlZml4KCdhcGknKTtcclxuICAgICAgYXBwLnVzZUdsb2JhbFBpcGVzKG5ldyBWYWxpZGF0aW9uUGlwZSh7IHdoaXRlbGlzdDogdHJ1ZSwgZm9yYmlkTm9uV2hpdGVsaXN0ZWQ6IHRydWUsIHRyYW5zZm9ybTogdHJ1ZSB9KSk7XHJcbiAgICAgIGFwcC5lbmFibGVDb3JzKHsgb3JpZ2luOiBwcm9jZXNzLmVudi5DT1JTX09SSUdJTiB8fCAnKicsIGNyZWRlbnRpYWxzOiB0cnVlIH0pO1xyXG5cclxuICAgICAgLy8gU3dhZ2dlciBzaW1wbGlmaWNhZG8gcGFyYSBGYXN0aWZ5XHJcbiAgICAgIGNvbnN0IGNmZyA9IG5ldyBEb2N1bWVudEJ1aWxkZXIoKS5zZXRUaXRsZSgnQWR1YW5hcyBTZXJ2aWNlJykuc2V0VmVyc2lvbignMS4wLjAnKS5hZGRCZWFyZXJBdXRoKCkuYnVpbGQoKTtcclxuICAgICAgY29uc3QgZG9jID0gU3dhZ2dlck1vZHVsZS5jcmVhdGVEb2N1bWVudChhcHAsIGNmZyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBFbmRwb2ludCBzaW1wbGUgcGFyYSBvYnRlbmVyIGxhIGRvY3VtZW50YWNpw7NuIEpTT05cclxuICAgICAgZmFzdGlmeUFwcC5nZXQoJy9hcGkvZG9jcy1qc29uJywgYXN5bmMgKHJlcXVlc3Q6IGFueSwgcmVwbHk6IGFueSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBkb2M7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gRnVuY2nDs24gcGFyYSBnZW5lcmFyIEhUTUwgZGUgZG9jdW1lbnRhY2nDs24gY29uIFN3YWdnZXIgVUlcclxuICAgICAgY29uc3QgZ2VuZXJhdGVEb2NzSFRNTCA9ICgpID0+IGBcclxuICAgICAgICA8IURPQ1RZUEUgaHRtbD5cclxuICAgICAgICA8aHRtbD5cclxuICAgICAgICA8aGVhZD5cclxuICAgICAgICAgIDx0aXRsZT5BZHVhbmFzIFNlcnZpY2UgQVBJPC90aXRsZT5cclxuICAgICAgICAgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiaHR0cHM6Ly91bnBrZy5jb20vc3dhZ2dlci11aS1kaXN0QDQuMTUuNS9zd2FnZ2VyLXVpLmNzc1wiIC8+XHJcbiAgICAgICAgICA8c3R5bGU+XHJcbiAgICAgICAgICAgIGh0bWwgeyBib3gtc2l6aW5nOiBib3JkZXItYm94OyBvdmVyZmxvdzogLW1vei1zY3JvbGxiYXJzLXZlcnRpY2FsOyBvdmVyZmxvdy15OiBzY3JvbGw7IH1cclxuICAgICAgICAgICAgKiwgKjpiZWZvcmUsICo6YWZ0ZXIgeyBib3gtc2l6aW5nOiBpbmhlcml0OyB9XHJcbiAgICAgICAgICAgIGJvZHkgeyBtYXJnaW46MDsgYmFja2dyb3VuZDogI2ZhZmFmYTsgfVxyXG4gICAgICAgICAgPC9zdHlsZT5cclxuICAgICAgICA8L2hlYWQ+XHJcbiAgICAgICAgPGJvZHk+XHJcbiAgICAgICAgICA8ZGl2IGlkPVwic3dhZ2dlci11aVwiPjwvZGl2PlxyXG4gICAgICAgICAgPHNjcmlwdCBzcmM9XCJodHRwczovL3VucGtnLmNvbS9zd2FnZ2VyLXVpLWRpc3RANC4xNS41L3N3YWdnZXItdWktYnVuZGxlLmpzXCI+PC9zY3JpcHQ+XHJcbiAgICAgICAgICA8c2NyaXB0IHNyYz1cImh0dHBzOi8vdW5wa2cuY29tL3N3YWdnZXItdWktZGlzdEA0LjE1LjUvc3dhZ2dlci11aS1zdGFuZGFsb25lLXByZXNldC5qc1wiPjwvc2NyaXB0PlxyXG4gICAgICAgICAgPHNjcmlwdD5cclxuICAgICAgICAgICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVpID0gU3dhZ2dlclVJQnVuZGxlKHtcclxuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvZG9jcy1qc29uJyxcclxuICAgICAgICAgICAgICAgIGRvbV9pZDogJyNzd2FnZ2VyLXVpJyxcclxuICAgICAgICAgICAgICAgIGRlZXBMaW5raW5nOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcHJlc2V0czogW1xyXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlCdW5kbGUucHJlc2V0cy5hcGlzLFxyXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlTdGFuZGFsb25lUHJlc2V0XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlCdW5kbGUucGx1Z2lucy5Eb3dubG9hZFVybFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIGxheW91dDogXCJTdGFuZGFsb25lTGF5b3V0XCJcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIDwvc2NyaXB0PlxyXG4gICAgICAgIDwvYm9keT5cclxuICAgICAgICA8L2h0bWw+XHJcbiAgICAgIGA7XHJcblxyXG4gICAgICAvLyBFbmRwb2ludCBzaW1wbGUgcGFyYSBtb3N0cmFyIGRvY3VtZW50YWNpw7NuIGLDoXNpY2EgKHNpbiBiYXJyYSlcclxuICAgICAgZmFzdGlmeUFwcC5nZXQoJy9hcGkvZG9jcycsIGFzeW5jIChyZXF1ZXN0OiBhbnksIHJlcGx5OiBhbnkpID0+IHtcclxuICAgICAgICByZXBseS50eXBlKCd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZ2VuZXJhdGVEb2NzSFRNTCgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEVuZHBvaW50IHNpbXBsZSBwYXJhIG1vc3RyYXIgZG9jdW1lbnRhY2nDs24gYsOhc2ljYSAoY29uIGJhcnJhKVxyXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9kb2NzLycsIGFzeW5jIChyZXF1ZXN0OiBhbnksIHJlcGx5OiBhbnkpID0+IHtcclxuICAgICAgICByZXBseS50eXBlKCd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZ2VuZXJhdGVEb2NzSFRNTCgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF3YWl0IGFwcC5pbml0KCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBSZWdpc3RyYXIgQGZhc3RpZnkvYXdzLWxhbWJkYSBERVNQVcOJUyBkZSBpbmljaWFsaXphciBOZXN0SlMgeSBvYnRlbmVyIGVsIGhhbmRsZXJcclxuICAgICAgY2FjaGVkU2VydmVyID0gYXdzbGFtYmRhKGZhc3RpZnlBcHApO1xyXG4gICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcclxuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGluaXRpYWxpemluZyBOZXN0SlMgYXBwOicsIGVycm9yTWVzc2FnZSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBIZWFsdGggY2hlY2sgYsOhc2ljbyBzaSBOZXN0SlMgZmFsbGEgKHNvbG8gc2kgbm8gc2UgcHVlZGUgaW5pY2lhbGl6YXIpXHJcbiAgICAgIGZhc3RpZnlBcHAuZ2V0KCcvYXBpL2hlYWx0aCcsIGFzeW5jIChyZXF1ZXN0OiBhbnksIHJlcGx5OiBhbnkpID0+IHtcclxuICAgICAgICByZXR1cm4geyBcclxuICAgICAgICAgIHN0YXR1czogJ0VSUk9SJywgXHJcbiAgICAgICAgICB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgZXJyb3I6ICdOZXN0SlMgaW5pdGlhbGl6YXRpb24gZmFpbGVkJ1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY2FjaGVkU2VydmVyID0gYXdzbGFtYmRhKGZhc3RpZnlBcHApO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gY2FjaGVkU2VydmVyO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCBjb250ZXh0OiBhbnkpID0+IHtcclxuICAvLyBOb3JtYWxpemFyIGVsIHBhdGggcmVtb3ZpZW5kbyBlbCBwcmVmaWpvIGRlbCBBUEkgR2F0ZXdheSAoL2RvY3VtZW50b3MgbyAvZ3VpYXMpXHJcbiAgY29uc3Qgbm9ybWFsaXplUGF0aCA9IChwYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG4gICAgaWYgKCFwYXRoKSByZXR1cm4gcGF0aDtcclxuICAgIC8vIFJlbW92ZXIgcHJlZmlqb3MgL2RvY3VtZW50b3MgbyAvZ3VpYXMgZGVsIHBhdGhcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBwYXRoLnJlcGxhY2UoL15cXC8oZG9jdW1lbnRvc3xndWlhcykvLCAnJyk7XHJcbiAgICByZXR1cm4gbm9ybWFsaXplZCB8fCAnLyc7XHJcbiAgfTtcclxuXHJcbiAgLy8gTm9ybWFsaXphciBlbCBwYXRoIGRlbCBldmVudG8geSByZXF1ZXN0Q29udGV4dFxyXG4gIGlmIChldmVudC5wYXRoKSB7XHJcbiAgICBjb25zdCBvcmlnaW5hbFBhdGggPSBldmVudC5wYXRoO1xyXG4gICAgZXZlbnQucGF0aCA9IG5vcm1hbGl6ZVBhdGgoZXZlbnQucGF0aCk7XHJcbiAgICBjb25zb2xlLmxvZyhgUGF0aCBub3JtYWxpemVkOiAke29yaWdpbmFsUGF0aH0gLT4gJHtldmVudC5wYXRofWApO1xyXG4gIH1cclxuICBcclxuICBpZiAoZXZlbnQucmVxdWVzdENvbnRleHQ/LnBhdGgpIHtcclxuICAgIGNvbnN0IG9yaWdpbmFsUmVxdWVzdFBhdGggPSBldmVudC5yZXF1ZXN0Q29udGV4dC5wYXRoO1xyXG4gICAgZXZlbnQucmVxdWVzdENvbnRleHQucGF0aCA9IG5vcm1hbGl6ZVBhdGgoZXZlbnQucmVxdWVzdENvbnRleHQucGF0aCk7XHJcbiAgICBjb25zb2xlLmxvZyhgUmVxdWVzdENvbnRleHQgcGF0aCBub3JtYWxpemVkOiAke29yaWdpbmFsUmVxdWVzdFBhdGh9IC0+ICR7ZXZlbnQucmVxdWVzdENvbnRleHQucGF0aH1gKTtcclxuICB9XHJcbiAgXHJcbiAgaWYgKGV2ZW50LnJlcXVlc3RDb250ZXh0Py5yZXNvdXJjZVBhdGgpIHtcclxuICAgIGNvbnN0IG9yaWdpbmFsUmVzb3VyY2VQYXRoID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVzb3VyY2VQYXRoO1xyXG4gICAgZXZlbnQucmVxdWVzdENvbnRleHQucmVzb3VyY2VQYXRoID0gbm9ybWFsaXplUGF0aChldmVudC5yZXF1ZXN0Q29udGV4dC5yZXNvdXJjZVBhdGgpO1xyXG4gICAgY29uc29sZS5sb2coYFJlc291cmNlUGF0aCBub3JtYWxpemVkOiAke29yaWdpbmFsUmVzb3VyY2VQYXRofSAtPiAke2V2ZW50LnJlcXVlc3RDb250ZXh0LnJlc291cmNlUGF0aH1gKTtcclxuICB9XHJcblxyXG4gIC8vIEhlYWx0aCBjaGVjayBkaXJlY3RvIHNpbiBwYXNhciBwb3IgTmVzdEpTIChkZXNwdcOpcyBkZSBub3JtYWxpemFyKVxyXG4gIGlmIChldmVudC5wYXRoID09PSAnL2FwaS9oZWFsdGgnICYmIGV2ZW50Lmh0dHBNZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXHJcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlJyxcclxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJ1xyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IFxyXG4gICAgICAgIHN0YXR1czogJ09LJywgXHJcbiAgICAgICAgdHM6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBzZXJ2aWNlOiAnQWR1YW5hcyBTZXJ2aWNlJyxcclxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnXHJcbiAgICAgIH0pXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gRGV0ZWN0YXIgc2kgZXMgdW4gZXZlbnRvIFNRU1xyXG4gIGlmIChldmVudC5SZWNvcmRzICYmIGV2ZW50LlJlY29yZHNbMF0/LmV2ZW50U291cmNlID09PSAnYXdzOnNxcycpIHtcclxuICAgIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIFNRUyBldmVudCcpO1xyXG4gICAgcmV0dXJuIHNxc0hhbmRsZXIoZXZlbnQgYXMgU1FTRXZlbnQsIGNvbnRleHQpO1xyXG4gIH1cclxuXHJcbiAgLy8gRGV0ZWN0YXIgc2kgZXMgdW4gZXZlbnRvIEhUVFAgKEFQSSBHYXRld2F5KVxyXG4gIGlmIChldmVudC5odHRwTWV0aG9kIHx8IGV2ZW50LnJlcXVlc3RDb250ZXh0KSB7XHJcbiAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyBIVFRQIGV2ZW50JywgeyBcclxuICAgICAgbWV0aG9kOiBldmVudC5odHRwTWV0aG9kLCBcclxuICAgICAgcGF0aDogZXZlbnQucGF0aCxcclxuICAgICAgcmF3UGF0aDogZXZlbnQucmF3UGF0aCxcclxuICAgICAgcmVxdWVzdENvbnRleHQ6IGV2ZW50LnJlcXVlc3RDb250ZXh0Py5wYXRoIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGhhbmRsZXIgPSBhd2FpdCBjcmVhdGVOZXN0U2VydmVyKCk7XHJcbiAgICBcclxuICAgIHJldHVybiBoYW5kbGVyKGV2ZW50IGFzIEFQSUdhdGV3YXlQcm94eUV2ZW50LCBjb250ZXh0KTtcclxuICB9XHJcblxyXG4gIC8vIEZhbGxiYWNrIHBhcmEgb3Ryb3MgdGlwb3MgZGUgZXZlbnRvc1xyXG4gIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIHVua25vd24gZXZlbnQgdHlwZSwgZmFsbGluZyBiYWNrIHRvIEhUVFAgaGFuZGxlcicpO1xyXG4gIGNvbnN0IGhhbmRsZXIgPSBhd2FpdCBjcmVhdGVOZXN0U2VydmVyKCk7XHJcbiAgcmV0dXJuIGhhbmRsZXIoZXZlbnQsIGNvbnRleHQpO1xyXG59O1xyXG4iXX0=