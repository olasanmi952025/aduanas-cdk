import { Module } from "@nestjs/common";
import { DocDocumentoBase } from "./entities";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentsQueryService } from "./documents-query.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([DocDocumentoBase]),
  ],
  providers: [DocumentsQueryService],
  exports: [DocumentsQueryService],
})
export class DocumentosModule {}

