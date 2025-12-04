import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export class GetTypeLocationsDto {
  @ApiProperty({ required: true, description: "Document type code" })
  @IsString()
  @IsNotEmpty()
  documentType: string;
}

export class ObtenerUsuariosCreadoresDto {
  @ApiProperty({
    required: false,
    description: "Solo usuarios activos",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  soloActivos?: boolean;

  @ApiProperty({ required: false, description: "Término de búsqueda" })
  @IsOptional()
  @IsString()
  searchTerm?: string;

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
}

export class ObtenerLocacionesDto {
  @ApiProperty({ required: false, description: "Término de búsqueda" })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ required: false, description: "Tipo de locación" })
  @IsOptional()
  @IsString()
  tipoLocacion?: string;

  @ApiProperty({ required: false, description: "Página", default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    description: "Límite por página",
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class BuscarLocalidadesDto {
  @ApiProperty({
    required: false,
    description: "Término de búsqueda general (busca en ciudad, país, código, descripción)",
  })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiProperty({
    required: false,
    description: "Página",
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    description: "Límite máximo de resultados",
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class ObtenerEmisoresDto {
  @ApiProperty({ required: false, description: "Término de búsqueda" })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ required: false, description: "Página", default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    description: "Límite por página",
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class GetDocTypesDto {
  @ApiProperty({ required: false, description: "Tipo de documento", default: 'MFTOC' })
  @IsOptional()
  @IsString()
  typeDoc?: string;
}

