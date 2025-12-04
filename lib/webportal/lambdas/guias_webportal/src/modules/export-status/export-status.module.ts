import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ExportStatusService } from "./export-status.service";
import { AWSModule } from "../aws";

@Module({
  imports: [ConfigModule, AWSModule],
  providers: [ExportStatusService],
  exports: [ExportStatusService],
})
export class ExportStatusModule {}

