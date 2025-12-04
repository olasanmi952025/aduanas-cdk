import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

// Función helper para parsear fecha DD/MM/YYYY
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) return null;
  
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Verificar que la fecha sea válida
  if (
    date.getFullYear() !== parseInt(year) ||
    date.getMonth() !== parseInt(month) - 1 ||
    date.getDate() !== parseInt(day)
  ) {
    return null;
  }
  
  return date;
}

// Validador personalizado para validar el rango de fechas
@ValidatorConstraint({ name: "IsValidDateRange", async: false })
export class IsValidDateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as BuscarDocumentosDto;
    
    // Si no hay fechas, no hay nada que validar
    if (!dto.fechaDesde && !dto.fechaHasta) {
      return true;
    }

    // Validar que fechaDesde no sea mayor a hoy
    if (dto.fechaDesde) {
      const fechaDesde = parseDate(dto.fechaDesde);
      if (!fechaDesde) {
        return false; // Fecha inválida
      }
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaDesde.setHours(0, 0, 0, 0);
      
      if (fechaDesde > hoy) {
        return false; // fechaDesde es mayor a hoy
      }
    }

    // Validar que fechaDesde no sea mayor que fechaHasta
    if (dto.fechaDesde && dto.fechaHasta) {
      const fechaDesde = parseDate(dto.fechaDesde);
      const fechaHasta = parseDate(dto.fechaHasta);
      
      if (!fechaDesde || !fechaHasta) {
        return false; // Alguna fecha es inválida
      }
      
      fechaDesde.setHours(0, 0, 0, 0);
      fechaHasta.setHours(0, 0, 0, 0);
      
      if (fechaDesde > fechaHasta) {
        return false; // fechaDesde es mayor que fechaHasta
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as BuscarDocumentosDto;

    // Verificar si fechaDesde es mayor a hoy
    if (dto.fechaDesde) {
      const fechaDesde = parseDate(dto.fechaDesde);
      if (fechaDesde) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaDesde.setHours(0, 0, 0, 0);
        
        if (fechaDesde > hoy) {
          return "La fecha desde no puede ser mayor a la fecha de hoy";
        }
      }
    }

    // Verificar si fechaDesde es mayor que fechaHasta
    if (dto.fechaDesde && dto.fechaHasta) {
      const fechaDesde = parseDate(dto.fechaDesde);
      const fechaHasta = parseDate(dto.fechaHasta);
      
      if (fechaDesde && fechaHasta) {
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(0, 0, 0, 0);
        
        if (fechaDesde > fechaHasta) {
          return "La fecha desde no puede ser mayor que la fecha hasta";
        }
      }
    }

    return "El rango de fechas no es válido";
  }
}

// Decorador personalizado para aplicar validación a nivel de clase
export function IsValidDateRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidDateRange',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsValidDateRangeConstraint,
    });
  };
}

export class BuscarDocumentosDto {
  @ApiProperty({ required: false, description: "ID del usuario" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ required: false, description: "Tipo de documento" })
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiProperty({ required: false, description: "Tipo de locación" })
  @IsOptional()
  @IsString()
  tipoLocacion?: string;

  @ApiProperty({ required: false, description: "Código o ID de locación" })
  @IsOptional()
  @IsString()
  locacion?: string;

  @ApiProperty({ required: false, description: "Tipo de fecha para filtro" })
  @IsOptional()
  @IsString()
  tipoFecha?: string;

  @ApiProperty({ required: false, description: "Fecha desde (DD/MM/YYYY)" })
  @IsOptional()
  @IsString()
  @IsValidDateRange()
  fechaDesde?: string;

  @ApiProperty({ required: false, description: "Fecha hasta (DD/MM/YYYY)" })
  @IsOptional()
  @IsString()
  @IsValidDateRange()
  fechaHasta?: string;

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

  @ApiProperty({ required: false, description: "Sentido de operación" })
  @IsOptional()
  @IsString()
  sentidoOperacion?: string;

  @ApiProperty({ required: false, description: "Número de vuelo" })
  @IsOptional()
  @IsString()
  numeroVuelo?: string;

  @ApiProperty({ required: false, description: "Número de aceptación" })
  @IsOptional()
  @IsString()
  numeroAceptacion?: string;

  @ApiProperty({ required: false, description: "Número de manifiesto original" })
  @IsOptional()
  @IsString()
  numeroManifiestoOriginal?: string;

  @ApiProperty({ required: false, description: "Estado" })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({ required: false, description: "ID del participante" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  participante?: number;

  @ApiProperty({ required: false, description: "Tipo de participante" })
  @IsOptional()
  @IsString()
  tipoParticipante?: string;

  @ApiProperty({ required: false, description: "Emisor (búsqueda por nombre)" })
  @IsOptional()
  @IsString()
  emisor?: string;

  @ApiProperty({ required: false, description: "Campo por el cual ordenar" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, description: "Dirección de ordenamiento (asc o desc)", enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class ObtenerDetallesCompletosDto {
  @ApiProperty({ required: false, description: "Tipo de relación" })
  @IsOptional()
  @IsString()
  tipoRelacion?: string;

  @ApiProperty({ required: false, description: "Fecha inicio operaciones" })
  @IsOptional()
  @IsDateString()
  fechaInicioOperaciones?: string;

  @ApiProperty({ required: false, description: "Fecha término operaciones" })
  @IsOptional()
  @IsDateString()
  fechaTerminoOperaciones?: string;

  @ApiProperty({ required: false, description: "Tipo de operación" })
  @IsOptional()
  @IsString()
  tipoOperacion?: string;
}

export class CloseManifestDto {
  @ApiProperty({ description: "Document identifier" })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  documentoId!: number;
}
