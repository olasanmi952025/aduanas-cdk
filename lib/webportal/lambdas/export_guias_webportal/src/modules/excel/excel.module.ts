import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExcelGenerationService } from './excel-generation.service';
import { S3Module } from '../s3';
import { DocumentosModule } from '../documentos/documentos.module';

@Module({
  imports: [ConfigModule, S3Module, DocumentosModule],
  providers: [ExcelGenerationService],
  exports: [ExcelGenerationService],
})
export class ExcelModule {}

