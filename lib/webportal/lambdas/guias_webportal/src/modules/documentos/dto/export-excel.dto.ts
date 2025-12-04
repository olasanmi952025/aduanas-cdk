import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEmail } from "class-validator";
import { GuideFiltersDto } from "./guide-filters.dto";

export class ExportExcelDto extends GuideFiltersDto {}

