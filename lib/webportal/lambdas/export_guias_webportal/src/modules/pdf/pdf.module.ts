import { Module } from '@nestjs/common';
import { PdfGenerationService } from './pdf-generation.service';
import { SoapClientService } from './soap-client.service';
import { S3Module } from '../s3';
import { DocumentosModule } from '../documentos/documentos.module';

@Module({
  imports: [S3Module, DocumentosModule],
  providers: [PdfGenerationService, SoapClientService],
  exports: [PdfGenerationService, SoapClientService],
})
export class PdfModule {}

