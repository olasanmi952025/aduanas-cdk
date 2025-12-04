import {
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsBoolean,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class GuideFiltersDto {
  @ApiProperty({ required: false, description: "Página", default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    description: "Límite por página",
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ required: false, description: "Campo por el cual ordenar" })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({ required: false, description: "Dirección de ordenamiento (asc o desc)", enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  order?: string;
  
  @ApiProperty({ required: false, description: "Fecha desde" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiProperty({ required: false, description: "Fecha hasta" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiProperty({ required: false, description: "Tipo de fecha para filtro" })
  @IsOptional()
  @IsString()
  dateType?: string;

  @ApiProperty({ required: false, description: "Guide number" })
  @IsOptional()
  @IsString()
  guideNumber?: string;

  @ApiProperty({ required: false, description: "Número de manifiesto" })
  @IsOptional()
  @IsString()
  manifestNumber?: string;

  @ApiProperty({ required: false, description: "Estado" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: "Location type" })
  @IsOptional()
  @IsString()
  locationType?: string;

  @ApiProperty({ required: false, description: "Location code or ID" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: "Tipo de participante (CONS, CNTE, etc.)" })
  @IsOptional()
  @IsString()
  participantType?: string;

  @ApiProperty({ required: false, description: "Nombre o identificador del participante/consignatario" })
  @IsOptional()
  @IsString()
  participant?: string;

  @ApiProperty({ required: false, description: "Indica si está en modo simplificado", type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (value === 'true' || value === true || value === '1' || value === 1) return true;
    if (value === 'false' || value === false || value === '0' || value === 0) return false;
    return undefined;
  })
 
  @IsBoolean()
  isSimplified?: boolean;

  @ApiProperty({ required: false, description: "Filtro de marcas (SI, NO, TODOS)" })
  @IsOptional()
  @IsString()
  marcas?: string;

  @ApiProperty({ required: false, description: "Filtro de faltante/sobrante (FALTA, SOBRA, TODAS)" })
  @IsOptional()
  @IsString()
  faltanteSobrante?: string;

  @ApiProperty({ required: false, description: "Tipo de operación (IMP, EXP, etc.)" })
  @IsOptional()
  @IsString()
  operationType?: string;

  @ApiProperty({ required: false, description: "ID del emisor/usuario para filtrar por dd.IDEMISOR" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;
}