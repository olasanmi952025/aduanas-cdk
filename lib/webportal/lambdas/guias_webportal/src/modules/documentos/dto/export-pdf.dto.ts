import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Type } from "class-transformer";

export class ExportPdfDto {
  @ApiProperty({
    description: "Array de IDs de guías a exportar (mínimo 1, máximo 20)",
    example: [123, 456, 789],
    type: [Number],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Debe proporcionar al menos 1 ID de guía" })
  @ArrayMaxSize(20, { message: "No puede proporcionar más de 20 IDs de guías" })
  @IsNumber({}, { each: true, message: "Todos los IDs deben ser números" })
  @Type(() => Number)
  guideIds: number[];
}

