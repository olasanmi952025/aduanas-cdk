import { S3Module } from '../s3';
import { AWSModule } from '../aws';
import { ExcelModule } from '../excel';
import { PdfModule } from '../pdf';
import { XmlModule } from '../xml';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExportStatusModule } from '../export-status';
import { ManifiestoModule } from '../manifiesto';
import { SQSConsumerService } from './sqs-consumer.service';
import { SQSConsumerController } from './sqs-consumer.controller';

@Module({
  imports: [
    ConfigModule,
    AWSModule,
    ExcelModule,
    PdfModule,
    XmlModule,
    ExportStatusModule,
    S3Module,
    ManifiestoModule,
  ],
  controllers: [SQSConsumerController],
  providers: [SQSConsumerService],
  exports: [SQSConsumerService],
})
export class SQSModule {}
