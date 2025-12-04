import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import awslambda from '@fastify/aws-lambda';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { AppModule } from './app.module';
import { httpHandler } from './handlers/http.handler';
import { sqsHandler } from './handlers/sqs.handler';

let cachedServer: any;

async function createNestServer() {
  if (!cachedServer) {
    const fastifyApp = fastify();

    try {
      const app = await NestFactory.create(AppModule, new FastifyAdapter(fastifyApp));

      app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
      app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });

      // Swagger simplificado para Fastify
      const cfg = new DocumentBuilder().setTitle('Aduanas Service').setVersion('1.0.0').addBearerAuth().build();
      const doc = SwaggerModule.createDocument(app, cfg);
      
      // Endpoint simple para obtener la documentación JSON
      fastifyApp.get('/api/docs-json', async (request: FastifyRequest, reply: FastifyReply) => {
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
      fastifyApp.get('/api/docs', async (request: FastifyRequest, reply: FastifyReply) => {
        reply.type('text/html');
        return generateDocsHTML();
      });

      // Endpoint simple para mostrar documentación básica (con barra)
      fastifyApp.get('/api/docs/', async (request: FastifyRequest, reply: FastifyReply) => {
        reply.type('text/html');
        return generateDocsHTML();
      });

      await app.init();
      
      // Health check endpoint (después de inicializar NestJS)
      fastifyApp.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
        return { status: 'OK', ts: new Date().toISOString() };
      });
      
    } catch (error: any) {
      console.log('Error initializing NestJS app:', error.message);
      
      // Health check básico si NestJS falla
      fastifyApp.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
        return { 
          status: 'ERROR', 
          ts: new Date().toISOString(),
          error: 'NestJS initialization failed'
        };
      });
    }
    
    cachedServer = awslambda(fastifyApp);
  }
  return cachedServer;
}

export const handler = async (event: any, context: any) => {
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
    return sqsHandler(event as SQSEvent, context);
  }

  // Detectar si es un evento HTTP (API Gateway)
  if (event.httpMethod || event.requestContext) {
    console.log('Processing HTTP event');
    
    const server = await createNestServer();
    const awsLambdaHandler = awslambda(server);
    
    return awsLambdaHandler(event as APIGatewayProxyEvent, context);
  }

  // Fallback para otros tipos de eventos
  console.log('Processing unknown event type, falling back to HTTP handler');
  const server = await createNestServer();
  const awsLambdaHandler = awslambda(server);
  return awsLambdaHandler(event, context);
};
