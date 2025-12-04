import { Module } from '@nestjs/common';
import { SQSModule } from './sqs/sqs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthModule } from './auth/jwt-auth.module';
import { ServiceModule } from './service/service.module';
import { getTypeOrmConfig } from './config/typeorm.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    // Configuración TypeORM para Oracle
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    SQSModule,
    JwtAuthModule,
    ServiceModule,
    DocumentosModule,
    DictionariesModule,
  ],
})
export class AppModule {}