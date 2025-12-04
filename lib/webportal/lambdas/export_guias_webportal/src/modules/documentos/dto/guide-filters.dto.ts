import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsBoolean,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class GuideFiltersDto {
  @IsOptional() 
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  order?: string;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsString()
  dateType?: string;

  @IsOptional()
  @IsString()
  guideNumber?: string;

  @IsOptional()
  @IsString()
  manifestNumber?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  participantType?: string;

  @IsOptional()
  @IsString()
  participant?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === 'true' || value === true || value === '1' || value === 1) return true;
    if (value === 'false' || value === false || value === '0' || value === 0) return false;
    return undefined;
  })
  @IsBoolean()
  isSimplified?: boolean;

  @IsOptional()
  @IsString()
  marcas?: string;

  @IsOptional()
  @IsString()
  faltanteSobrante?: string;

  @IsOptional()
  @IsString()
  operationType?: string;
}

