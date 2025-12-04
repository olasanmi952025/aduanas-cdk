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
            // Health check endpoint (después de inicializar NestJS)
            fastifyApp.get('/api/health', async (request, reply) => {
                return { status: 'OK', ts: new Date().toISOString() };
            });
        }
        catch (error) {
            console.log('Error initializing NestJS app:', error.message);
            // Health check básico si NestJS falla
            fastifyApp.get('/api/health', async (request, reply) => {
                return {
                    status: 'ERROR',
                    ts: new Date().toISOString(),
                    error: 'NestJS initialization failed'
                };
            });
        }
        cachedServer = (0, aws_lambda_1.default)(fastifyApp);
    }
    return cachedServer;
}
const handler = async (event, context) => {
    // Health check directo sin pasar por NestJS
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
        console.log('Processing HTTP event');
        const server = await createNestServer();
        const awsLambdaHandler = (0, aws_lambda_1.default)(server);
        return awsLambdaHandler(event, context);
    }
    // Fallback para otros tipos de eventos
    console.log('Processing unknown event type, falling back to HTTP handler');
    const server = await createNestServer();
    const awsLambdaHandler = (0, aws_lambda_1.default)(server);
    return awsLambdaHandler(event, context);
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQix1Q0FBMkM7QUFDM0MsK0RBQTBEO0FBQzFELDJDQUFnRDtBQUNoRCw2Q0FBaUU7QUFDakUsc0RBQWdFO0FBQ2hFLHFFQUE0QztBQUU1Qyw2Q0FBeUM7QUFFekMsd0RBQW9EO0FBRXBELElBQUksWUFBaUIsQ0FBQztBQUV0QixLQUFLLFVBQVUsZ0JBQWdCO0lBQzdCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztRQUU3QixJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFTLEVBQUUsSUFBSSxpQ0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFaEYsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHVCQUFjLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTlFLG9DQUFvQztZQUNwQyxNQUFNLEdBQUcsR0FBRyxJQUFJLHlCQUFlLEVBQUUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDMUcsTUFBTSxHQUFHLEdBQUcsdUJBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRW5ELHFEQUFxRDtZQUNy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LEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sSUFBQSx3QkFBVSxFQUFDLEtBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUVyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixFQUFFLENBQUM7UUFDeEMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLG9CQUFTLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFFM0MsT0FBTyxnQkFBZ0IsQ0FBQyxLQUE2QixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLEVBQUUsQ0FBQztJQUN4QyxNQUFNLGdCQUFnQixHQUFHLElBQUEsb0JBQVMsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxPQUFPLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUM7QUF6Q1csUUFBQSxPQUFPLFdBeUNsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgeyBOZXN0RmFjdG9yeSB9IGZyb20gJ0BuZXN0anMvY29yZSc7XG5pbXBvcnQgeyBGYXN0aWZ5QWRhcHRlciB9IGZyb20gJ0BuZXN0anMvcGxhdGZvcm0tZmFzdGlmeSc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uUGlwZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7IFN3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlciB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQgZmFzdGlmeSwgeyBGYXN0aWZ5UmVxdWVzdCwgRmFzdGlmeVJlcGx5IH0gZnJvbSAnZmFzdGlmeSc7XG5pbXBvcnQgYXdzbGFtYmRhIGZyb20gJ0BmYXN0aWZ5L2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCwgQ29udGV4dCwgU1FTRXZlbnQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwLm1vZHVsZSc7XG5pbXBvcnQgeyBodHRwSGFuZGxlciB9IGZyb20gJy4vaGFuZGxlcnMvaHR0cC5oYW5kbGVyJztcbmltcG9ydCB7IHNxc0hhbmRsZXIgfSBmcm9tICcuL2hhbmRsZXJzL3Nxcy5oYW5kbGVyJztcblxubGV0IGNhY2hlZFNlcnZlcjogYW55O1xuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVOZXN0U2VydmVyKCkge1xuICBpZiAoIWNhY2hlZFNlcnZlcikge1xuICAgIGNvbnN0IGZhc3RpZnlBcHAgPSBmYXN0aWZ5KCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgYXBwID0gYXdhaXQgTmVzdEZhY3RvcnkuY3JlYXRlKEFwcE1vZHVsZSwgbmV3IEZhc3RpZnlBZGFwdGVyKGZhc3RpZnlBcHApKTtcblxuICAgICAgYXBwLnVzZUdsb2JhbFBpcGVzKG5ldyBWYWxpZGF0aW9uUGlwZSh7IHdoaXRlbGlzdDogdHJ1ZSwgZm9yYmlkTm9uV2hpdGVsaXN0ZWQ6IHRydWUsIHRyYW5zZm9ybTogdHJ1ZSB9KSk7XG4gICAgICBhcHAuZW5hYmxlQ29ycyh7IG9yaWdpbjogcHJvY2Vzcy5lbnYuQ09SU19PUklHSU4gfHwgJyonLCBjcmVkZW50aWFsczogdHJ1ZSB9KTtcblxuICAgICAgLy8gU3dhZ2dlciBzaW1wbGlmaWNhZG8gcGFyYSBGYXN0aWZ5XG4gICAgICBjb25zdCBjZmcgPSBuZXcgRG9jdW1lbnRCdWlsZGVyKCkuc2V0VGl0bGUoJ0FkdWFuYXMgU2VydmljZScpLnNldFZlcnNpb24oJzEuMC4wJykuYWRkQmVhcmVyQXV0aCgpLmJ1aWxkKCk7XG4gICAgICBjb25zdCBkb2MgPSBTd2FnZ2VyTW9kdWxlLmNyZWF0ZURvY3VtZW50KGFwcCwgY2ZnKTtcbiAgICAgIFxuICAgICAgLy8gRW5kcG9pbnQgc2ltcGxlIHBhcmEgb2J0ZW5lciBsYSBkb2N1bWVudGFjacOzbiBKU09OXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9kb2NzLWpzb24nLCBhc3luYyAocmVxdWVzdDogRmFzdGlmeVJlcXVlc3QsIHJlcGx5OiBGYXN0aWZ5UmVwbHkpID0+IHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBGdW5jacOzbiBwYXJhIGdlbmVyYXIgSFRNTCBkZSBkb2N1bWVudGFjacOzbiBjb24gU3dhZ2dlciBVSVxuICAgICAgY29uc3QgZ2VuZXJhdGVEb2NzSFRNTCA9ICgpID0+IGBcbiAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgIDxodG1sPlxuICAgICAgICA8aGVhZD5cbiAgICAgICAgICA8dGl0bGU+QWR1YW5hcyBTZXJ2aWNlIEFQSTwvdGl0bGU+XG4gICAgICAgICAgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJodHRwczovL3VucGtnLmNvbS9zd2FnZ2VyLXVpLWRpc3RANC4xNS41L3N3YWdnZXItdWkuY3NzXCIgLz5cbiAgICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgICBodG1sIHsgYm94LXNpemluZzogYm9yZGVyLWJveDsgb3ZlcmZsb3c6IC1tb3otc2Nyb2xsYmFycy12ZXJ0aWNhbDsgb3ZlcmZsb3cteTogc2Nyb2xsOyB9XG4gICAgICAgICAgICAqLCAqOmJlZm9yZSwgKjphZnRlciB7IGJveC1zaXppbmc6IGluaGVyaXQ7IH1cbiAgICAgICAgICAgIGJvZHkgeyBtYXJnaW46MDsgYmFja2dyb3VuZDogI2ZhZmFmYTsgfVxuICAgICAgICAgIDwvc3R5bGU+XG4gICAgICAgIDwvaGVhZD5cbiAgICAgICAgPGJvZHk+XG4gICAgICAgICAgPGRpdiBpZD1cInN3YWdnZXItdWlcIj48L2Rpdj5cbiAgICAgICAgICA8c2NyaXB0IHNyYz1cImh0dHBzOi8vdW5wa2cuY29tL3N3YWdnZXItdWktZGlzdEA0LjE1LjUvc3dhZ2dlci11aS1idW5kbGUuanNcIj48L3NjcmlwdD5cbiAgICAgICAgICA8c2NyaXB0IHNyYz1cImh0dHBzOi8vdW5wa2cuY29tL3N3YWdnZXItdWktZGlzdEA0LjE1LjUvc3dhZ2dlci11aS1zdGFuZGFsb25lLXByZXNldC5qc1wiPjwvc2NyaXB0PlxuICAgICAgICAgIDxzY3JpcHQ+XG4gICAgICAgICAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHVpID0gU3dhZ2dlclVJQnVuZGxlKHtcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2RvY3MtanNvbicsXG4gICAgICAgICAgICAgICAgZG9tX2lkOiAnI3N3YWdnZXItdWknLFxuICAgICAgICAgICAgICAgIGRlZXBMaW5raW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgIHByZXNldHM6IFtcbiAgICAgICAgICAgICAgICAgIFN3YWdnZXJVSUJ1bmRsZS5wcmVzZXRzLmFwaXMsXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlTdGFuZGFsb25lUHJlc2V0XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlCdW5kbGUucGx1Z2lucy5Eb3dubG9hZFVybFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgbGF5b3V0OiBcIlN0YW5kYWxvbmVMYXlvdXRcIlxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgIDwvYm9keT5cbiAgICAgICAgPC9odG1sPlxuICAgICAgYDtcblxuICAgICAgLy8gRW5kcG9pbnQgc2ltcGxlIHBhcmEgbW9zdHJhciBkb2N1bWVudGFjacOzbiBiw6FzaWNhIChzaW4gYmFycmEpXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9kb2NzJywgYXN5bmMgKHJlcXVlc3Q6IEZhc3RpZnlSZXF1ZXN0LCByZXBseTogRmFzdGlmeVJlcGx5KSA9PiB7XG4gICAgICAgIHJlcGx5LnR5cGUoJ3RleHQvaHRtbCcpO1xuICAgICAgICByZXR1cm4gZ2VuZXJhdGVEb2NzSFRNTCgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEVuZHBvaW50IHNpbXBsZSBwYXJhIG1vc3RyYXIgZG9jdW1lbnRhY2nDs24gYsOhc2ljYSAoY29uIGJhcnJhKVxuICAgICAgZmFzdGlmeUFwcC5nZXQoJy9hcGkvZG9jcy8nLCBhc3luYyAocmVxdWVzdDogRmFzdGlmeVJlcXVlc3QsIHJlcGx5OiBGYXN0aWZ5UmVwbHkpID0+IHtcbiAgICAgICAgcmVwbHkudHlwZSgndGV4dC9odG1sJyk7XG4gICAgICAgIHJldHVybiBnZW5lcmF0ZURvY3NIVE1MKCk7XG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgYXBwLmluaXQoKTtcbiAgICAgIFxuICAgICAgLy8gSGVhbHRoIGNoZWNrIGVuZHBvaW50IChkZXNwdcOpcyBkZSBpbmljaWFsaXphciBOZXN0SlMpXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9oZWFsdGgnLCBhc3luYyAocmVxdWVzdDogRmFzdGlmeVJlcXVlc3QsIHJlcGx5OiBGYXN0aWZ5UmVwbHkpID0+IHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiAnT0snLCB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH07XG4gICAgICB9KTtcbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbml0aWFsaXppbmcgTmVzdEpTIGFwcDonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIFxuICAgICAgLy8gSGVhbHRoIGNoZWNrIGLDoXNpY28gc2kgTmVzdEpTIGZhbGxhXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9oZWFsdGgnLCBhc3luYyAocmVxdWVzdDogRmFzdGlmeVJlcXVlc3QsIHJlcGx5OiBGYXN0aWZ5UmVwbHkpID0+IHtcbiAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgc3RhdHVzOiAnRVJST1InLCBcbiAgICAgICAgICB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIGVycm9yOiAnTmVzdEpTIGluaXRpYWxpemF0aW9uIGZhaWxlZCdcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjYWNoZWRTZXJ2ZXIgPSBhd3NsYW1iZGEoZmFzdGlmeUFwcCk7XG4gIH1cbiAgcmV0dXJuIGNhY2hlZFNlcnZlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55KSA9PiB7XG4gIC8vIEhlYWx0aCBjaGVjayBkaXJlY3RvIHNpbiBwYXNhciBwb3IgTmVzdEpTXG4gIGlmIChldmVudC5wYXRoID09PSAnL2FwaS9oZWFsdGgnICYmIGV2ZW50Lmh0dHBNZXRob2QgPT09ICdHRVQnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUydcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICBzdGF0dXM6ICdPSycsIFxuICAgICAgICB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBzZXJ2aWNlOiAnQWR1YW5hcyBTZXJ2aWNlJyxcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJ1xuICAgICAgfSlcbiAgICB9O1xuICB9XG5cbiAgLy8gRGV0ZWN0YXIgc2kgZXMgdW4gZXZlbnRvIFNRU1xuICBpZiAoZXZlbnQuUmVjb3JkcyAmJiBldmVudC5SZWNvcmRzWzBdPy5ldmVudFNvdXJjZSA9PT0gJ2F3czpzcXMnKSB7XG4gICAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgU1FTIGV2ZW50Jyk7XG4gICAgcmV0dXJuIHNxc0hhbmRsZXIoZXZlbnQgYXMgU1FTRXZlbnQsIGNvbnRleHQpO1xuICB9XG5cbiAgLy8gRGV0ZWN0YXIgc2kgZXMgdW4gZXZlbnRvIEhUVFAgKEFQSSBHYXRld2F5KVxuICBpZiAoZXZlbnQuaHR0cE1ldGhvZCB8fCBldmVudC5yZXF1ZXN0Q29udGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdQcm9jZXNzaW5nIEhUVFAgZXZlbnQnKTtcbiAgICBcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCBjcmVhdGVOZXN0U2VydmVyKCk7XG4gICAgY29uc3QgYXdzTGFtYmRhSGFuZGxlciA9IGF3c2xhbWJkYShzZXJ2ZXIpO1xuICAgIFxuICAgIHJldHVybiBhd3NMYW1iZGFIYW5kbGVyKGV2ZW50IGFzIEFQSUdhdGV3YXlQcm94eUV2ZW50LCBjb250ZXh0KTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHBhcmEgb3Ryb3MgdGlwb3MgZGUgZXZlbnRvc1xuICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyB1bmtub3duIGV2ZW50IHR5cGUsIGZhbGxpbmcgYmFjayB0byBIVFRQIGhhbmRsZXInKTtcbiAgY29uc3Qgc2VydmVyID0gYXdhaXQgY3JlYXRlTmVzdFNlcnZlcigpO1xuICBjb25zdCBhd3NMYW1iZGFIYW5kbGVyID0gYXdzbGFtYmRhKHNlcnZlcik7XG4gIHJldHVybiBhd3NMYW1iZGFIYW5kbGVyKGV2ZW50LCBjb250ZXh0KTtcbn07XG4iXX0=