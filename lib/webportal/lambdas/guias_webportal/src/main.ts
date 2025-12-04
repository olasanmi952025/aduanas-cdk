import 'reflect-metadata';
import morgan from 'morgan';
import { AppModule } from './app.module';
import compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const helmet = require('helmet');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger (v4, compatible con Nest v7)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Aduanas Service')
    .setDescription('Microservicio NestJS con TypeORM, JWT y Swagger')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc, {
    swaggerOptions: {
      persistAuthorization: true,
      cache: false, // Deshabilitar cache
    },
    customSiteTitle: 'Aduanas Service API Docs',
  });

  // Health
  app.use('/api/health', (req: any, res: any) => {
    res.json({ status: 'OK', ts: new Date().toISOString() });
  });

  const port = process.env.PORT || 3002;
  await app.listen(port as number);
  logger.log(`Server http://localhost:${port}`);
  logger.log(`Docs   http://localhost:${port}/api/docs`);
}

bootstrap();