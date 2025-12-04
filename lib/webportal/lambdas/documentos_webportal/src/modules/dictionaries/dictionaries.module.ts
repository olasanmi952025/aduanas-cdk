import {
  DocTipoLocacion,
  DocRoles,
  DocLocacionDocumento,
  DocParticipacion,
  DocStatusType,
  DinAduan,
} from './entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictionariesService } from './dictionaries.service';
import { DictionariesController } from './dictionaries.controller';
import { DocTipoFecha } from './entities/doc-tipo-fecha.entity';
import { DocDocumentoBase } from '../documentos/entities/doc-documento-base.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DinAduan,
      DocRoles,
      DocTipoFecha,
      DocStatusType,
      DocTipoLocacion,
      DocParticipacion,
      DocDocumentoBase,
      DocLocacionDocumento,
    ]),
  ],
  exports: [DictionariesService],
  providers: [DictionariesService],
  controllers: [DictionariesController],
})
export class DictionariesModule {}

