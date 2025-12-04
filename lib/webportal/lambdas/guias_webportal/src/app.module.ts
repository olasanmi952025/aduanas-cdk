import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthModule } from './auth/jwt-auth.module';
import { ServiceModule } from './service/service.module';
import { AWSModule } from './modules/aws';
import { SQSModule } from './modules/sqs';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { getTypeOrmConfig } from './config/typeorm.config';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    AWSModule,
    SQSModule,
    JwtAuthModule,
    ServiceModule,
    DocumentosModule,
  ],
})
export class AppModule {}