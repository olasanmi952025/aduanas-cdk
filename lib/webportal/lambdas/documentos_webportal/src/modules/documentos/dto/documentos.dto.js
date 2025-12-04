"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseManifestDto = exports.ObtenerDetallesCompletosDto = exports.BuscarDocumentosDto = exports.IsValidDateRangeConstraint = void 0;
exports.IsValidDateRange = IsValidDateRange;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
// Función helper para parsear fecha DD/MM/YYYY
function parseDate(dateString) {
    if (!dateString)
        return null;
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    if (!match)
        return null;
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Verificar que la fecha sea válida
    if (date.getFullYear() !== parseInt(year) ||
        date.getMonth() !== parseInt(month) - 1 ||
        date.getDate() !== parseInt(day)) {
        return null;
    }
    return date;
}
// Validador personalizado para validar el rango de fechas
let IsValidDateRangeConstraint = class IsValidDateRangeConstraint {
    validate(value, args) {
        const dto = args.object;
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
    defaultMessage(args) {
        const dto = args.object;
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
};
exports.IsValidDateRangeConstraint = IsValidDateRangeConstraint;
exports.IsValidDateRangeConstraint = IsValidDateRangeConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: "IsValidDateRange", async: false })
], IsValidDateRangeConstraint);
// Decorador personalizado para aplicar validación a nivel de clase
function IsValidDateRange(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isValidDateRange',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: IsValidDateRangeConstraint,
        });
    };
}
class BuscarDocumentosDto {
}
exports.BuscarDocumentosDto = BuscarDocumentosDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "ID del usuario" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarDocumentosDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de documento" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "tipoDocumento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de locación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "tipoLocacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Código o ID de locación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "locacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de fecha para filtro" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "tipoFecha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha desde (DD/MM/YYYY)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    IsValidDateRange()
], BuscarDocumentosDto.prototype, "fechaDesde", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha hasta (DD/MM/YYYY)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    IsValidDateRange()
], BuscarDocumentosDto.prototype, "fechaHasta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Página", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarDocumentosDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite por página",
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarDocumentosDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Sentido de operación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "sentidoOperacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Número de vuelo" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "numeroVuelo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Número de aceptación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "numeroAceptacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Número de manifiesto original" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "numeroManifiestoOriginal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Estado" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "ID del participante" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarDocumentosDto.prototype, "participante", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de participante" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "tipoParticipante", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Emisor (búsqueda por nombre)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "emisor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Campo por el cual ordenar" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Dirección de ordenamiento (asc o desc)", enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarDocumentosDto.prototype, "sortOrder", void 0);
class ObtenerDetallesCompletosDto {
}
exports.ObtenerDetallesCompletosDto = ObtenerDetallesCompletosDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de relación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerDetallesCompletosDto.prototype, "tipoRelacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha inicio operaciones" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)()
], ObtenerDetallesCompletosDto.prototype, "fechaInicioOperaciones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha término operaciones" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)()
], ObtenerDetallesCompletosDto.prototype, "fechaTerminoOperaciones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de operación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerDetallesCompletosDto.prototype, "tipoOperacion", void 0);
class CloseManifestDto {
}
exports.CloseManifestDto = CloseManifestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Document identifier" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number)
], CloseManifestDto.prototype, "documentoId", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5kdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudG9zLmR0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUE2SEEsNENBV0M7QUF4SUQscURBY3lCO0FBQ3pCLHlEQUF5QztBQUN6Qyw2Q0FBOEM7QUFFOUMsK0NBQStDO0FBQy9DLFNBQVMsU0FBUyxDQUFDLFVBQWtCO0lBQ25DLElBQUksQ0FBQyxVQUFVO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsNkJBQTZCLENBQUM7SUFDaEQsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUxQyxJQUFJLENBQUMsS0FBSztRQUFFLE9BQU8sSUFBSSxDQUFDO0lBRXhCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ25DLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTFFLG9DQUFvQztJQUNwQyxJQUNFLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN2QyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUNoQyxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsMERBQTBEO0FBRW5ELElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTBCO0lBQ3JDLFFBQVEsQ0FBQyxLQUFVLEVBQUUs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SUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFO2lFQUNXO0FBS3RCO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQztJQUN6RSxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDhCQUFZLEdBQUU7MkVBQ2lCO0FBS2hDO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsMkJBQTJCLEVBQUUsQ0FBQztJQUMxRSxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDhCQUFZLEdBQUU7NEVBQ2tCO0FBS2pDO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQztJQUNsRSxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7a0VBQ1k7QUFHekIsTUFBYSxnQkFBZ0I7Q0FNNUI7QUFORCw0Q0FNQztBQURDO0lBSkMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLENBQUM7SUFDbkQsSUFBQSwwQkFBUSxHQUFFO0lBQ1YsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSx3QkFBSSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztxREFDRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgSXNPcHRpb25hbCxcclxuICBJc1N0cmluZyxcclxuICBJc051bWJlcixcclxuICBJc0RhdGVTdHJpbmcsXHJcbiAgSXNCb29sZWFuLFxyXG4gIElzQXJyYXksXHJcbiAgSXNOb3RFbXB0eSxcclxuICBWYWxpZGF0b3JDb25zdHJhaW50LFxyXG4gIFZhbGlkYXRvckNvbnN0cmFpbnRJbnRlcmZhY2UsXHJcbiAgVmFsaWRhdGUsXHJcbiAgVmFsaWRhdGlvbkFyZ3VtZW50cyxcclxuICByZWdpc3RlckRlY29yYXRvcixcclxuICBWYWxpZGF0aW9uT3B0aW9ucyxcclxufSBmcm9tIFwiY2xhc3MtdmFsaWRhdG9yXCI7XHJcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHsgQXBpUHJvcGVydHkgfSBmcm9tIFwiQG5lc3Rqcy9zd2FnZ2VyXCI7XHJcblxyXG4vLyBGdW5jacOzbiBoZWxwZXIgcGFyYSBwYXJzZWFyIGZlY2hhIEREL01NL1lZWVlcclxuZnVuY3Rpb24gcGFyc2VEYXRlKGRhdGVTdHJpbmc6IHN0cmluZyk6IERhdGUgfCBudWxsIHtcclxuICBpZiAoIWRhdGVTdHJpbmcpIHJldHVybiBudWxsO1xyXG4gIGNvbnN0IGRhdGVSZWdleCA9IC9eKFxcZHsyfSlcXC8oXFxkezJ9KVxcLyhcXGR7NH0pJC87XHJcbiAgY29uc3QgbWF0Y2ggPSBkYXRlU3RyaW5nLm1hdGNoKGRhdGVSZWdleCk7XHJcbiAgXHJcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XHJcbiAgXHJcbiAgY29uc3QgWywgZGF5LCBtb250aCwgeWVhcl0gPSBtYXRjaDtcclxuICBjb25zdCBkYXRlID0gbmV3IERhdGUocGFyc2VJbnQoeWVhciksIHBhcnNlSW50KG1vbnRoKSAtIDEsIHBhcnNlSW50KGRheSkpO1xyXG4gIFxyXG4gIC8vIFZlcmlmaWNhciBxdWUgbGEgZmVjaGEgc2VhIHbDoWxpZGFcclxuICBpZiAoXHJcbiAgICBkYXRlLmdldEZ1bGxZZWFyKCkgIT09IHBhcnNlSW50KHllYXIpIHx8XHJcbiAgICBkYXRlLmdldE1vbnRoKCkgIT09IHBhcnNlSW50KG1vbnRoKSAtIDEgfHxcclxuICAgIGRhdGUuZ2V0RGF0ZSgpICE9PSBwYXJzZUludChkYXkpXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGRhdGU7XHJcbn1cclxuXHJcbi8vIFZhbGlkYWRvciBwZXJzb25hbGl6YWRvIHBhcmEgdmFsaWRhciBlbCByYW5nbyBkZSBmZWNoYXNcclxuQFZhbGlkYXRvckNvbnN0cmFpbnQoeyBuYW1lOiBcIklzVmFsaWREYXRlUmFuZ2VcIiwgYXN5bmM6IGZhbHNlIH0pXHJcbmV4cG9ydCBjbGFzcyBJc1ZhbGlkRGF0ZVJhbmdlQ29uc3RyYWludCBpbXBsZW1lbnRzIFZhbGlkYXRvckNvbnN0cmFpbnRJbnRlcmZhY2Uge1xyXG4gIHZhbGlkYXRlKHZhbHVlOiBhbnksIGFyZ3M6IFZhbGlkYXRpb25Bcmd1bWVudHMpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGR0byA9IGFyZ3Mub2JqZWN0IGFzIEJ1c2NhckRvY3VtZW50b3NEdG87XHJcbiAgICBcclxuICAgIC8vIFNpIG5vIGhheSBmZWNoYXMsIG5vIGhheSBuYWRhIHF1ZSB2YWxpZGFyXHJcbiAgICBpZiAoIWR0by5mZWNoYURlc2RlICYmICFkdG8uZmVjaGFIYXN0YSkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGFyIHF1ZSBmZWNoYURlc2RlIG5vIHNlYSBtYXlvciBhIGhveVxyXG4gICAgaWYgKGR0by5mZWNoYURlc2RlKSB7XHJcbiAgICAgIGNvbnN0IGZlY2hhRGVzZGUgPSBwYXJzZURhdGUoZHRvLmZlY2hhRGVzZGUpO1xyXG4gICAgICBpZiAoIWZlY2hhRGVzZGUpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIEZlY2hhIGludsOhbGlkYVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBob3kgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICBob3kuc2V0SG91cnMoMCwgMCwgMCwgMCk7XHJcbiAgICAgIGZlY2hhRGVzZGUuc2V0SG91cnMoMCwgMCwgMCwgMCk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoZmVjaGFEZXNkZSA+IGhveSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gZmVjaGFEZXNkZSBlcyBtYXlvciBhIGhveVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVmFsaWRhciBxdWUgZmVjaGFEZXNkZSBubyBzZWEgbWF5b3IgcXVlIGZlY2hhSGFzdGFcclxuICAgIGlmIChkdG8uZmVjaGFEZXNkZSAmJiBkdG8uZmVjaGFIYXN0YSkge1xyXG4gICAgICBjb25zdCBmZWNoYURlc2RlID0gcGFyc2VEYXRlKGR0by5mZWNoYURlc2RlKTtcclxuICAgICAgY29uc3QgZmVjaGFIYXN0YSA9IHBhcnNlRGF0ZShkdG8uZmVjaGFIYXN0YSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIWZlY2hhRGVzZGUgfHwgIWZlY2hhSGFzdGEpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIEFsZ3VuYSBmZWNoYSBlcyBpbnbDoWxpZGFcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgZmVjaGFEZXNkZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcclxuICAgICAgZmVjaGFIYXN0YS5zZXRIb3VycygwLCAwLCAwLCAwKTtcclxuICAgICAgXHJcbiAgICAgIGlmIChmZWNoYURlc2RlID4gZmVjaGFIYXN0YSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gZmVjaGFEZXNkZSBlcyBtYXlvciBxdWUgZmVjaGFIYXN0YVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBkZWZhdWx0TWVzc2FnZShhcmdzOiBWYWxpZGF0aW9uQXJndW1lbnRzKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IGR0byA9IGFyZ3Mub2JqZWN0IGFzIEJ1c2NhckRvY3VtZW50b3NEdG87XHJcblxyXG4gICAgLy8gVmVyaWZpY2FyIHNpIGZlY2hhRGVzZGUgZXMgbWF5b3IgYSBob3lcclxuICAgIGlmIChkdG8uZmVjaGFEZXNkZSkge1xyXG4gICAgICBjb25zdCBmZWNoYURlc2RlID0gcGFyc2VEYXRlKGR0by5mZWNoYURlc2RlKTtcclxuICAgICAgaWYgKGZlY2hhRGVzZGUpIHtcclxuICAgICAgICBjb25zdCBob3kgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGhveS5zZXRIb3VycygwLCAwLCAwLCAwKTtcclxuICAgICAgICBmZWNoYURlc2RlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChmZWNoYURlc2RlID4gaG95KSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJMYSBmZWNoYSBkZXNkZSBubyBwdWVkZSBzZXIgbWF5b3IgYSBsYSBmZWNoYSBkZSBob3lcIjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBWZXJpZmljYXIgc2kgZmVjaGFEZXNkZSBlcyBtYXlvciBxdWUgZmVjaGFIYXN0YVxyXG4gICAgaWYgKGR0by5mZWNoYURlc2RlICYmIGR0by5mZWNoYUhhc3RhKSB7XHJcbiAgICAgIGNvbnN0IGZlY2hhRGVzZGUgPSBwYXJzZURhdGUoZHRvLmZlY2hhRGVzZGUpO1xyXG4gICAgICBjb25zdCBmZWNoYUhhc3RhID0gcGFyc2VEYXRlKGR0by5mZWNoYUhhc3RhKTtcclxuICAgICAgXHJcbiAgICAgIGlmIChmZWNoYURlc2RlICYmIGZlY2hhSGFzdGEpIHtcclxuICAgICAgICBmZWNoYURlc2RlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIGZlY2hhSGFzdGEuc2V0SG91cnMoMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGZlY2hhRGVzZGUgPiBmZWNoYUhhc3RhKSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJMYSBmZWNoYSBkZXNkZSBubyBwdWVkZSBzZXIgbWF5b3IgcXVlIGxhIGZlY2hhIGhhc3RhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFwiRWwgcmFuZ28gZGUgZmVjaGFzIG5vIGVzIHbDoWxpZG9cIjtcclxuICB9XHJcbn1cclxuXHJcbi8vIERlY29yYWRvciBwZXJzb25hbGl6YWRvIHBhcmEgYXBsaWNhciB2YWxpZGFjacOzbiBhIG5pdmVsIGRlIGNsYXNlXHJcbmV4cG9ydCBmdW5jdGlvbiBJc1ZhbGlkRGF0ZVJhbmdlKHZhbGlkYXRpb25PcHRpb25zPzogVmFsaWRhdGlvbk9wdGlvbnMpIHtcclxuICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdDogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZykge1xyXG4gICAgcmVnaXN0ZXJEZWNvcmF0b3Ioe1xyXG4gICAgICBuYW1lOiAnaXNWYWxpZERhdGVSYW5nZScsXHJcbiAgICAgIHRhcmdldDogb2JqZWN0LmNvbnN0cnVjdG9yLFxyXG4gICAgICBwcm9wZXJ0eU5hbWU6IHByb3BlcnR5TmFtZSxcclxuICAgICAgY29uc3RyYWludHM6IFtdLFxyXG4gICAgICBvcHRpb25zOiB2YWxpZGF0aW9uT3B0aW9ucyxcclxuICAgICAgdmFsaWRhdG9yOiBJc1ZhbGlkRGF0ZVJhbmdlQ29uc3RyYWludCxcclxuICAgIH0pO1xyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCdXNjYXJEb2N1bWVudG9zRHRvIHtcclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIklEIGRlbCB1c3VhcmlvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgdXNlcklkPzogbnVtYmVyO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgZG9jdW1lbnRvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICB0aXBvRG9jdW1lbnRvPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgbG9jYWNpw7NuXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICB0aXBvTG9jYWNpb24/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiQ8OzZGlnbyBvIElEIGRlIGxvY2FjacOzblwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbG9jYWNpb24/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiVGlwbyBkZSBmZWNoYSBwYXJhIGZpbHRyb1wiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgdGlwb0ZlY2hhPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIkZlY2hhIGRlc2RlIChERC9NTS9ZWVlZKVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgQElzVmFsaWREYXRlUmFuZ2UoKVxyXG4gIGZlY2hhRGVzZGU/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRmVjaGEgaGFzdGEgKEREL01NL1lZWVkpXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBASXNWYWxpZERhdGVSYW5nZSgpXHJcbiAgZmVjaGFIYXN0YT86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJQw6FnaW5hXCIsIGRlZmF1bHQ6IDEgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgcGFnZT86IG51bWJlcjtcclxuXHJcbiAgQEFwaVByb3BlcnR5KHtcclxuICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgIGRlc2NyaXB0aW9uOiBcIkzDrW1pdGUgcG9yIHDDoWdpbmFcIixcclxuICAgIGRlZmF1bHQ6IDIwLFxyXG4gIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc051bWJlcigpXHJcbiAgQFR5cGUoKCkgPT4gTnVtYmVyKVxyXG4gIGxpbWl0PzogbnVtYmVyO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlNlbnRpZG8gZGUgb3BlcmFjacOzblwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgc2VudGlkb09wZXJhY2lvbj86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJOw7ptZXJvIGRlIHZ1ZWxvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBudW1lcm9WdWVsbz86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJOw7ptZXJvIGRlIGFjZXB0YWNpw7NuXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBudW1lcm9BY2VwdGFjaW9uPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIk7Dum1lcm8gZGUgbWFuaWZpZXN0byBvcmlnaW5hbFwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbnVtZXJvTWFuaWZpZXN0b09yaWdpbmFsPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIkVzdGFkb1wiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgZXN0YWRvPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIklEIGRlbCBwYXJ0aWNpcGFudGVcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBwYXJ0aWNpcGFudGU/OiBudW1iZXI7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiVGlwbyBkZSBwYXJ0aWNpcGFudGVcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIHRpcG9QYXJ0aWNpcGFudGU/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRW1pc29yIChiw7pzcXVlZGEgcG9yIG5vbWJyZSlcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIGVtaXNvcj86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJDYW1wbyBwb3IgZWwgY3VhbCBvcmRlbmFyXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBzb3J0Qnk/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRGlyZWNjacOzbiBkZSBvcmRlbmFtaWVudG8gKGFzYyBvIGRlc2MpXCIsIGVudW06IFsnYXNjJywgJ2Rlc2MnXSB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIHNvcnRPcmRlcj86ICdhc2MnIHwgJ2Rlc2MnO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT2J0ZW5lckRldGFsbGVzQ29tcGxldG9zRHRvIHtcclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgcmVsYWNpw7NuXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICB0aXBvUmVsYWNpb24/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRmVjaGEgaW5pY2lvIG9wZXJhY2lvbmVzXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzRGF0ZVN0cmluZygpXHJcbiAgZmVjaGFJbmljaW9PcGVyYWNpb25lcz86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJGZWNoYSB0w6lybWlubyBvcGVyYWNpb25lc1wiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc0RhdGVTdHJpbmcoKVxyXG4gIGZlY2hhVGVybWlub09wZXJhY2lvbmVzPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgb3BlcmFjacOzblwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgdGlwb09wZXJhY2lvbj86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENsb3NlTWFuaWZlc3REdG8ge1xyXG4gIEBBcGlQcm9wZXJ0eSh7IGRlc2NyaXB0aW9uOiBcIkRvY3VtZW50IGlkZW50aWZpZXJcIiB9KVxyXG4gIEBJc051bWJlcigpXHJcbiAgQElzTm90RW1wdHkoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBkb2N1bWVudG9JZCE6IG51bWJlcjtcclxufVxyXG4iXX0=