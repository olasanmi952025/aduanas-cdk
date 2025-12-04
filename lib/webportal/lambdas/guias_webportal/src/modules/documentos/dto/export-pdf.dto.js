"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPdfDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ExportPdfDto {
}
exports.ExportPdfDto = ExportPdfDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Array de IDs de guías a exportar (mínimo 1, máximo 20)",
        example: [123, 456, 789],
        type: [Number],
        minItems: 1,
        maxItems: 20,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: "Debe proporcionar al menos 1 ID de guía" }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: "No puede proporcionar más de 20 IDs de guías" }),
    (0, class_validator_1.IsNumber)({}, { each: true, message: "Todos los IDs deben ser números" }),
    (0, class_transformer_1.Type)(() => Number)
], ExportPdfDto.prototype, "guideIds", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXBkZi5kdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHBvcnQtcGRmLmR0by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSw2Q0FBOEM7QUFDOUMscURBQWdGO0FBQ2hGLHlEQUF5QztBQUV6QyxNQUFhLFlBQVk7Q0FjeEI7QUFkRCxvQ0FjQztBQURDO0lBWkMsSUFBQSxxQkFBVyxFQUFDO1FBQ1gsV0FBVyxFQUFFLHdEQUF3RDtRQUNyRSxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUN4QixJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDZCxRQUFRLEVBQUUsQ0FBQztRQUNYLFFBQVEsRUFBRSxFQUFFO0tBQ2IsQ0FBQztJQUNELElBQUEseUJBQU8sR0FBRTtJQUNULElBQUEsOEJBQVksRUFBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUseUNBQXlDLEVBQUUsQ0FBQztJQUN2RSxJQUFBLDhCQUFZLEVBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLDhDQUE4QyxFQUFFLENBQUM7SUFDN0UsSUFBQSwwQkFBUSxFQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGlDQUFpQyxFQUFFLENBQUM7SUFDeEUsSUFBQSx3QkFBSSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQzs4Q0FDQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwaVByb3BlcnR5IH0gZnJvbSBcIkBuZXN0anMvc3dhZ2dlclwiO1xyXG5pbXBvcnQgeyBJc0FycmF5LCBJc051bWJlciwgQXJyYXlNaW5TaXplLCBBcnJheU1heFNpemUgfSBmcm9tIFwiY2xhc3MtdmFsaWRhdG9yXCI7XHJcbmltcG9ydCB7IFR5cGUgfSBmcm9tIFwiY2xhc3MtdHJhbnNmb3JtZXJcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFeHBvcnRQZGZEdG8ge1xyXG4gIEBBcGlQcm9wZXJ0eSh7XHJcbiAgICBkZXNjcmlwdGlvbjogXCJBcnJheSBkZSBJRHMgZGUgZ3XDrWFzIGEgZXhwb3J0YXIgKG3DrW5pbW8gMSwgbcOheGltbyAyMClcIixcclxuICAgIGV4YW1wbGU6IFsxMjMsIDQ1NiwgNzg5XSxcclxuICAgIHR5cGU6IFtOdW1iZXJdLFxyXG4gICAgbWluSXRlbXM6IDEsXHJcbiAgICBtYXhJdGVtczogMjAsXHJcbiAgfSlcclxuICBASXNBcnJheSgpXHJcbiAgQEFycmF5TWluU2l6ZSgxLCB7IG1lc3NhZ2U6IFwiRGViZSBwcm9wb3JjaW9uYXIgYWwgbWVub3MgMSBJRCBkZSBndcOtYVwiIH0pXHJcbiAgQEFycmF5TWF4U2l6ZSgyMCwgeyBtZXNzYWdlOiBcIk5vIHB1ZWRlIHByb3BvcmNpb25hciBtw6FzIGRlIDIwIElEcyBkZSBndcOtYXNcIiB9KVxyXG4gIEBJc051bWJlcih7fSwgeyBlYWNoOiB0cnVlLCBtZXNzYWdlOiBcIlRvZG9zIGxvcyBJRHMgZGViZW4gc2VyIG7Dum1lcm9zXCIgfSlcclxuICBAVHlwZSgoKSA9PiBOdW1iZXIpXHJcbiAgZ3VpZGVJZHM6IG51bWJlcltdO1xyXG59XHJcblxyXG4iXX0=