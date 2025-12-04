import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documentos.service';
import { ManifestSQSService } from '../../service/manifest-sqs.service';
import { DocumentsController } from './documentos.controller';
import { ExportStatusService } from '../../service/export-status.service';
import { 
  DocDocumentoBase
} from './entities';
import {
  DocLocacionDocumento,
  DocParticipacion
} from '../dictionaries/entities';
import { ManifestJobMapping } from './entities/manifest-job-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocDocumentoBase,
      DocLocacionDocumento,
      DocParticipacion,
      ManifestJobMapping,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService, 
    ManifestSQSService, 
    ExportStatusService,
  ],
  exports: [DocumentsService],
})
export class DocumentosModule {}
