"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class GuideFiltersDto {
}
exports.GuideFiltersDto = GuideFiltersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Página", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite por página",
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Campo por el cual ordenar" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Dirección de ordenamiento (asc o desc)", enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha desde" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date)
], GuideFiltersDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Fecha hasta" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date)
], GuideFiltersDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de fecha para filtro" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "dateType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Guide number" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "guideNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Número de manifiesto" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "manifestNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Estado" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Location type" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "locationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Location code or ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de participante (CONS, CNTE, etc.)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "participantType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Nombre o identificador del participante/consignatario" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "participant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Indica si está en modo simplificado", type: Boolean }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        if (value === 'true' || value === true || value === '1' || value === 1)
            return true;
        if (value === 'false' || value === false || value === '0' || value === 0)
            return false;
        return undefined;
    }),
    (0, class_validator_1.IsBoolean)()
], GuideFiltersDto.prototype, "isSimplified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Filtro de marcas (SI, NO, TODOS)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "marcas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Filtro de faltante/sobrante (FALTA, SOBRA, TODAS)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "faltanteSobrante", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de operación (IMP, EXP, etc.)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GuideFiltersDto.prototype, "operationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "ID del emisor/usuario para filtrar por dd.IDEMISOR" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], GuideFiltersDto.prototype, "userId", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGUtZmlsdGVycy5kdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJndWlkZS1maWx0ZXJzLmR0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxxREFNeUI7QUFDekIseURBQW9EO0FBQ3BELDZDQUE4QztBQUU5QyxNQUFhLGVBQWU7Q0ErRzNCO0FBL0dELDBDQStHQztBQTFHQztJQUpDLElBQUEscUJBQVcsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDbkUsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFO0lBQ1YsSUFBQSx3QkFBSSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQzs2Q0FDTDtBQVVkO0lBUkMsSUFBQSxxQkFBVyxFQUFDO1FBQ1gsUUFBUSxFQUFFLEtBQUs7UUFDZixXQUFXLEVBQUUsbUJBQW1CO1FBQ2hDLE9BQU8sRUFBRSxFQUFFO0tBQ1osQ0FBQztJQUNELElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTtJQUNWLElBQUEsd0JBQUksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7OENBQ0o7QUFLZjtJQUhDLElBQUEscUJBQVcsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixFQUFFLENBQUM7SUFDMUUsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFOzZDQUNHO0FBS2Q7SUFIQyxJQUFBLHFCQUFXLEVBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSx3Q0FBd0MsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUM5RyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7OENBQ0k7QUFNZjtJQUpDLElBQUEscUJBQVcs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QUFTLENBQUM7SUFDbkIsQ0FBQyxDQUFDO0lBRUQsSUFBQSwyQkFBUyxHQUFFO3FEQUNXO0FBS3ZCO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsa0NBQWtDLEVBQUUsQ0FBQztJQUNqRixJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7K0NBQ0s7QUFLaEI7SUFIQyxJQUFBLHFCQUFXLEVBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxtREFBbUQsRUFBRSxDQUFDO0lBQ2xHLElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTt5REFDZTtBQUsxQjtJQUhDLElBQUEscUJBQVcsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLG9DQUFvQyxFQUFFLENBQUM7SUFDbkYsSUFBQSw0QkFBVSxHQUFFO0lBQ1osSUFBQSwwQkFBUSxHQUFFO3NEQUNZO0FBTXZCO0lBSkMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsb0RBQW9ELEVBQUUsQ0FBQztJQUNuRyxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7SUFDVixJQUFBLHdCQUFJLEVBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDOytDQUNIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBJc09wdGlvbmFsLFxyXG4gIElzU3RyaW5nLFxyXG4gIElzTnVtYmVyLFxyXG4gIElzRGF0ZSxcclxuICBJc0Jvb2xlYW4sXHJcbn0gZnJvbSBcImNsYXNzLXZhbGlkYXRvclwiO1xyXG5pbXBvcnQgeyBUeXBlLCBUcmFuc2Zvcm0gfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuaW1wb3J0IHsgQXBpUHJvcGVydHkgfSBmcm9tIFwiQG5lc3Rqcy9zd2FnZ2VyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgR3VpZGVGaWx0ZXJzRHRvIHtcclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlDDoWdpbmFcIiwgZGVmYXVsdDogMSB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBwYWdlPzogbnVtYmVyO1xyXG5cclxuICBAQXBpUHJvcGVydHkoe1xyXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgZGVzY3JpcHRpb246IFwiTMOtbWl0ZSBwb3IgcMOhZ2luYVwiLFxyXG4gICAgZGVmYXVsdDogMjAsXHJcbiAgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgbGltaXQ/OiBudW1iZXI7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiQ2FtcG8gcG9yIGVsIGN1YWwgb3JkZW5hclwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgc29ydD86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJEaXJlY2Npw7NuIGRlIG9yZGVuYW1pZW50byAoYXNjIG8gZGVzYylcIiwgZW51bTogWydhc2MnLCAnZGVzYyddIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgb3JkZXI/OiBzdHJpbmc7XHJcbiAgXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJGZWNoYSBkZXNkZVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc0RhdGUoKVxyXG4gIEBUeXBlKCgpID0+IERhdGUpXHJcbiAgZnJvbT86IERhdGU7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRmVjaGEgaGFzdGFcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNEYXRlKClcclxuICBAVHlwZSgoKSA9PiBEYXRlKVxyXG4gIHRvPzogRGF0ZTtcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJUaXBvIGRlIGZlY2hhIHBhcmEgZmlsdHJvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBkYXRlVHlwZT86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJHdWlkZSBudW1iZXJcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIGd1aWRlTnVtYmVyPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIk7Dum1lcm8gZGUgbWFuaWZpZXN0b1wiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbWFuaWZlc3ROdW1iZXI/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRXN0YWRvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBzdGF0dXM/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiTG9jYXRpb24gdHlwZVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgbG9jYXRpb25UeXBlPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIkxvY2F0aW9uIGNvZGUgb3IgSURcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIGxvY2F0aW9uPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgcGFydGljaXBhbnRlIChDT05TLCBDTlRFLCBldGMuKVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgcGFydGljaXBhbnRUeXBlPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIk5vbWJyZSBvIGlkZW50aWZpY2Fkb3IgZGVsIHBhcnRpY2lwYW50ZS9jb25zaWduYXRhcmlvXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBwYXJ0aWNpcGFudD86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJJbmRpY2Egc2kgZXN0w6EgZW4gbW9kbyBzaW1wbGlmaWNhZG9cIiwgdHlwZTogQm9vbGVhbiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBAVHJhbnNmb3JtKCh7IHZhbHVlIH0pID0+IHtcclxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgaWYgKHZhbHVlID09PSAndHJ1ZScgfHwgdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09ICcxJyB8fCB2YWx1ZSA9PT0gMSkgcmV0dXJuIHRydWU7XHJcbiAgICBpZiAodmFsdWUgPT09ICdmYWxzZScgfHwgdmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09PSAnMCcgfHwgdmFsdWUgPT09IDApIHJldHVybiBmYWxzZTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfSlcclxuIFxyXG4gIEBJc0Jvb2xlYW4oKVxyXG4gIGlzU2ltcGxpZmllZD86IGJvb2xlYW47XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiRmlsdHJvIGRlIG1hcmNhcyAoU0ksIE5PLCBUT0RPUylcIiB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIG1hcmNhcz86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJGaWx0cm8gZGUgZmFsdGFudGUvc29icmFudGUgKEZBTFRBLCBTT0JSQSwgVE9EQVMpXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBmYWx0YW50ZVNvYnJhbnRlPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgb3BlcmFjacOzbiAoSU1QLCBFWFAsIGV0Yy4pXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBvcGVyYXRpb25UeXBlPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIklEIGRlbCBlbWlzb3IvdXN1YXJpbyBwYXJhIGZpbHRyYXIgcG9yIGRkLklERU1JU09SXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgdXNlcklkPzogbnVtYmVyO1xyXG59Il19