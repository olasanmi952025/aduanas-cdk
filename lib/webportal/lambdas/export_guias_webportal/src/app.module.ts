import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { validationSchema } from './config/validation.schema';
import { AWSModule } from './modules/aws';
import { S3Module } from './modules/s3';
import { SQSModule, SQSConsumerService } from './modules/sqs';
import { ExcelModule } from './modules/excel';
import { XmlModule } from './modules/xml';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { ExportStatusModule } from './modules/export-status';

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
    S3Module,
    SQSModule,
    DocumentosModule,
    ExcelModule,
    XmlModule,
    ExportStatusModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly sqsConsumer: SQSConsumerService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enableLocalConsumer = this.configService.get<string>('ENABLE_LOCAL_SQS_CONSUMER') === 'true';
    
    if (enableLocalConsumer) {
      this.sqsConsumer.listen().catch((error) => {
        console.error('Error starting SQS consumer:', error);
      });
    }
  }
}