"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const excel_generation_service_1 = require("./excel-generation.service");
const s3_1 = require("../s3");
const documentos_module_1 = require("../documentos/documentos.module");
let ExcelModule = class ExcelModule {
};
exports.ExcelModule = ExcelModule;
exports.ExcelModule = ExcelModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, s3_1.S3Module, documentos_module_1.DocumentosModule],
        providers: [excel_generation_service_1.ExcelGenerationService],
        exports: [excel_generation_service_1.ExcelGenerationService],
    })
], ExcelModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZWwubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhjZWwubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDJDQUF3QztBQUN4QywyQ0FBOEM7QUFDOUMseUVBQW9FO0FBQ3BFLDhCQUFpQztBQUNqQyx1RUFBbUU7QUFPNUQsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBVztDQUFHLENBQUE7QUFBZCxrQ0FBVztzQkFBWCxXQUFXO0lBTHZCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFLENBQUMscUJBQVksRUFBRSxhQUFRLEVBQUUsb0NBQWdCLENBQUM7UUFDbkQsU0FBUyxFQUFFLENBQUMsaURBQXNCLENBQUM7UUFDbkMsT0FBTyxFQUFFLENBQUMsaURBQXNCLENBQUM7S0FDbEMsQ0FBQztHQUNXLFdBQVcsQ0FBRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ29uZmlnTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgeyBFeGNlbEdlbmVyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9leGNlbC1nZW5lcmF0aW9uLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBTM01vZHVsZSB9IGZyb20gJy4uL3MzJztcclxuaW1wb3J0IHsgRG9jdW1lbnRvc01vZHVsZSB9IGZyb20gJy4uL2RvY3VtZW50b3MvZG9jdW1lbnRvcy5tb2R1bGUnO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW0NvbmZpZ01vZHVsZSwgUzNNb2R1bGUsIERvY3VtZW50b3NNb2R1bGVdLFxyXG4gIHByb3ZpZGVyczogW0V4Y2VsR2VuZXJhdGlvblNlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtFeGNlbEdlbmVyYXRpb25TZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIEV4Y2VsTW9kdWxlIHt9XHJcblxyXG4iXX0=