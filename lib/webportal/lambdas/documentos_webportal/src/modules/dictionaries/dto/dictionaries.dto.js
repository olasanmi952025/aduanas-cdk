"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDocTypesDto = exports.ObtenerEmisoresDto = exports.BuscarLocalidadesDto = exports.ObtenerLocacionesDto = exports.ObtenerUsuariosCreadoresDto = exports.GetTypeLocationsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GetTypeLocationsDto {
}
exports.GetTypeLocationsDto = GetTypeLocationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: true, description: "Document type code" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)()
], GetTypeLocationsDto.prototype, "documentType", void 0);
class ObtenerUsuariosCreadoresDto {
}
exports.ObtenerUsuariosCreadoresDto = ObtenerUsuariosCreadoresDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Solo usuarios activos",
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean)
], ObtenerUsuariosCreadoresDto.prototype, "soloActivos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Término de búsqueda" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerUsuariosCreadoresDto.prototype, "searchTerm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Página", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerUsuariosCreadoresDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite por página",
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerUsuariosCreadoresDto.prototype, "limit", void 0);
class ObtenerLocacionesDto {
}
exports.ObtenerLocacionesDto = ObtenerLocacionesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Término de búsqueda" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerLocacionesDto.prototype, "searchTerm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de locación" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerLocacionesDto.prototype, "tipoLocacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Página", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerLocacionesDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite por página",
        default: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerLocacionesDto.prototype, "limit", void 0);
class BuscarLocalidadesDto {
}
exports.BuscarLocalidadesDto = BuscarLocalidadesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Término de búsqueda general (busca en ciudad, país, código, descripción)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], BuscarLocalidadesDto.prototype, "busqueda", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Página",
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarLocalidadesDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite máximo de resultados",
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], BuscarLocalidadesDto.prototype, "limit", void 0);
class ObtenerEmisoresDto {
}
exports.ObtenerEmisoresDto = ObtenerEmisoresDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Término de búsqueda" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], ObtenerEmisoresDto.prototype, "searchTerm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Página", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerEmisoresDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: "Límite por página",
        default: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number)
], ObtenerEmisoresDto.prototype, "limit", void 0);
class GetDocTypesDto {
}
exports.GetDocTypesDto = GetDocTypesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: "Tipo de documento", default: 'MFTOC' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], GetDocTypesDto.prototype, "typeDoc", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdGlvbmFyaWVzLmR0by5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpY3Rpb25hcmllcy5kdG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsNkNBQThDO0FBQzlDLHFEQU15QjtBQUN6Qix5REFBeUM7QUFFekMsTUFBYSxtQkFBbUI7Q0FLL0I7QUFMRCxrREFLQztBQURDO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztJQUNsRSxJQUFBLDBCQUFRLEdBQUU7SUFDVixJQUFBLDRCQUFVLEdBQUU7eURBQ1E7QUFHdkIsTUFBYSwyQkFBMkI7Q0ErQnZDO0FBL0JELGtFQStCQztBQXRCQztJQVJDLElBQUEscUJBQVcsRUFBQztRQUNYLFFBQVEsRUFBRSxLQUFLO1FBQ2YsV0FBVyxFQUFFLHVCQUF1QjtRQUNwQyxPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUM7SUFDRCxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDJCQUFTLEdBQUU7SUFDWCxJQUFBLHdCQUFJLEVBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO2dFQUNFO0FBS3RCO0lBSEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztJQUNwRSxJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7K0RBQ1M7QUFNcEI7SUFKQyxJQUFBLHFCQUFXLEVBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ25FLElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTtJQUNWLElBQUEsd0JBQUksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7eURBQ0w7QUFVZDtJQVJDLElBQUEscUJBQVcsRUFB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QUs7UUFDZixXQUFXLEVBQUUsbUJBQW1CO1FBQ2hDLE9BQU8sRUFBRSxFQUFFO0tBQ1osQ0FBQztJQUNELElBQUEsNEJBQVUsR0FBRTtJQUNaLElBQUEsMEJBQVEsR0FBRTtJQUNWLElBQUEsd0JBQUksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7aURBQ0o7QUFHakIsTUFBYSxjQUFjO0NBSzFCO0FBTEQsd0NBS0M7QUFEQztJQUhDLElBQUEscUJBQVcsRUFBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNwRixJQUFBLDRCQUFVLEdBQUU7SUFDWixJQUFBLDBCQUFRLEdBQUU7K0NBQ00iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcGlQcm9wZXJ0eSB9IGZyb20gXCJAbmVzdGpzL3N3YWdnZXJcIjtcclxuaW1wb3J0IHtcclxuICBJc09wdGlvbmFsLFxyXG4gIElzU3RyaW5nLFxyXG4gIElzTnVtYmVyLFxyXG4gIElzQm9vbGVhbixcclxuICBJc05vdEVtcHR5LFxyXG59IGZyb20gXCJjbGFzcy12YWxpZGF0b3JcIjtcclxuaW1wb3J0IHsgVHlwZSB9IGZyb20gXCJjbGFzcy10cmFuc2Zvcm1lclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEdldFR5cGVMb2NhdGlvbnNEdG8ge1xyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiB0cnVlLCBkZXNjcmlwdGlvbjogXCJEb2N1bWVudCB0eXBlIGNvZGVcIiB9KVxyXG4gIEBJc1N0cmluZygpXHJcbiAgQElzTm90RW1wdHkoKVxyXG4gIGRvY3VtZW50VHlwZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT2J0ZW5lclVzdWFyaW9zQ3JlYWRvcmVzRHRvIHtcclxuICBAQXBpUHJvcGVydHkoe1xyXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgZGVzY3JpcHRpb246IFwiU29sbyB1c3VhcmlvcyBhY3Rpdm9zXCIsXHJcbiAgICBkZWZhdWx0OiB0cnVlLFxyXG4gIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc0Jvb2xlYW4oKVxyXG4gIEBUeXBlKCgpID0+IEJvb2xlYW4pXHJcbiAgc29sb0FjdGl2b3M/OiBib29sZWFuO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlTDqXJtaW5vIGRlIGLDunNxdWVkYVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgc2VhcmNoVGVybT86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJQw6FnaW5hXCIsIGRlZmF1bHQ6IDEgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgcGFnZT86IG51bWJlcjtcclxuXHJcbiAgQEFwaVByb3BlcnR5KHtcclxuICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgIGRlc2NyaXB0aW9uOiBcIkzDrW1pdGUgcG9yIHDDoWdpbmFcIixcclxuICAgIGRlZmF1bHQ6IDIwLFxyXG4gIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc051bWJlcigpXHJcbiAgQFR5cGUoKCkgPT4gTnVtYmVyKVxyXG4gIGxpbWl0PzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT2J0ZW5lckxvY2FjaW9uZXNEdG8ge1xyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiVMOpcm1pbm8gZGUgYsO6c3F1ZWRhXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICBzZWFyY2hUZXJtPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlRpcG8gZGUgbG9jYWNpw7NuXCIgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzU3RyaW5nKClcclxuICB0aXBvTG9jYWNpb24/OiBzdHJpbmc7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiUMOhZ2luYVwiLCBkZWZhdWx0OiAxIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc051bWJlcigpXHJcbiAgQFR5cGUoKCkgPT4gTnVtYmVyKVxyXG4gIHBhZ2U/OiBudW1iZXI7XHJcblxyXG4gIEBBcGlQcm9wZXJ0eSh7XHJcbiAgICByZXF1aXJlZDogZmFsc2UsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJMw61taXRlIHBvciBww6FnaW5hXCIsXHJcbiAgICBkZWZhdWx0OiA1MCxcclxuICB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBsaW1pdD86IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJ1c2NhckxvY2FsaWRhZGVzRHRvIHtcclxuICBAQXBpUHJvcGVydHkoe1xyXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgZGVzY3JpcHRpb246IFwiVMOpcm1pbm8gZGUgYsO6c3F1ZWRhIGdlbmVyYWwgKGJ1c2NhIGVuIGNpdWRhZCwgcGHDrXMsIGPDs2RpZ28sIGRlc2NyaXBjacOzbilcIixcclxuICB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIGJ1c3F1ZWRhPzogc3RyaW5nO1xyXG5cclxuICBAQXBpUHJvcGVydHkoe1xyXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgZGVzY3JpcHRpb246IFwiUMOhZ2luYVwiLFxyXG4gICAgZGVmYXVsdDogMSxcclxuICB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNOdW1iZXIoKVxyXG4gIEBUeXBlKCgpID0+IE51bWJlcilcclxuICBwYWdlPzogbnVtYmVyO1xyXG5cclxuICBAQXBpUHJvcGVydHkoe1xyXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgZGVzY3JpcHRpb246IFwiTMOtbWl0ZSBtw6F4aW1vIGRlIHJlc3VsdGFkb3NcIixcclxuICAgIGRlZmF1bHQ6IDIwLFxyXG4gIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc051bWJlcigpXHJcbiAgQFR5cGUoKCkgPT4gTnVtYmVyKVxyXG4gIGxpbWl0PzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT2J0ZW5lckVtaXNvcmVzRHRvIHtcclxuICBAQXBpUHJvcGVydHkoeyByZXF1aXJlZDogZmFsc2UsIGRlc2NyaXB0aW9uOiBcIlTDqXJtaW5vIGRlIGLDunNxdWVkYVwiIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc1N0cmluZygpXHJcbiAgc2VhcmNoVGVybT86IHN0cmluZztcclxuXHJcbiAgQEFwaVByb3BlcnR5KHsgcmVxdWlyZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogXCJQw6FnaW5hXCIsIGRlZmF1bHQ6IDEgfSlcclxuICBASXNPcHRpb25hbCgpXHJcbiAgQElzTnVtYmVyKClcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgcGFnZT86IG51bWJlcjtcclxuXHJcbiAgQEFwaVByb3BlcnR5KHtcclxuICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgIGRlc2NyaXB0aW9uOiBcIkzDrW1pdGUgcG9yIHDDoWdpbmFcIixcclxuICAgIGRlZmF1bHQ6IDUwLFxyXG4gIH0pXHJcbiAgQElzT3B0aW9uYWwoKVxyXG4gIEBJc051bWJlcigpXHJcbiAgQFR5cGUoKCkgPT4gTnVtYmVyKVxyXG4gIGxpbWl0PzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR2V0RG9jVHlwZXNEdG8ge1xyXG4gIEBBcGlQcm9wZXJ0eSh7IHJlcXVpcmVkOiBmYWxzZSwgZGVzY3JpcHRpb246IFwiVGlwbyBkZSBkb2N1bWVudG9cIiwgZGVmYXVsdDogJ01GVE9DJyB9KVxyXG4gIEBJc09wdGlvbmFsKClcclxuICBASXNTdHJpbmcoKVxyXG4gIHR5cGVEb2M/OiBzdHJpbmc7XHJcbn1cclxuXHJcbiJdfQ==