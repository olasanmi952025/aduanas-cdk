import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XmlGenerationService } from './xml-generation.service';
import { S3Module } from '../s3';
import { DocumentosModule } from '../documentos/documentos.module';
import { DocDocumentoBase } from '../documentos/entities';

@Module({
  imports: [
    ConfigModule,
    S3Module,
    DocumentosModule,
    TypeOrmModule.forFeature([DocDocumentoBase]),
  ],
  providers: [XmlGenerationService],
  exports: [XmlGenerationService],
})
export class XmlModule {}

