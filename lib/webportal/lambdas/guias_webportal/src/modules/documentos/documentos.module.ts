import { SQSModule } from "../sqs";
import { Module } from "@nestjs/common";
import { DocDocumentoBase } from "./entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentsService } from "./documentos.service";
import { DocumentsController } from "./documentos.controller";
import { CacheFactory, CacheServiceProvider } from "../../shared/cache";
import { ExportStatusModule } from "../export-status";

@Module({
  imports: [
    SQSModule,
    ExportStatusModule,
    TypeOrmModule.forFeature([DocDocumentoBase]),
  ],
  controllers: [DocumentsController],
  providers: [
    CacheFactory,
    DocumentsService,
    CacheServiceProvider,
  ],
  exports: [DocumentsService],
})
export class DocumentosModule {}
