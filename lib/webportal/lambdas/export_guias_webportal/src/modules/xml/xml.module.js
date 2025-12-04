"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const xml_generation_service_1 = require("./xml-generation.service");
const s3_1 = require("../s3");
const documentos_module_1 = require("../documentos/documentos.module");
const entities_1 = require("../documentos/entities");
let XmlModule = class XmlModule {
};
exports.XmlModule = XmlModule;
exports.XmlModule = XmlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            s3_1.S3Module,
            documentos_module_1.DocumentosModule,
            typeorm_1.TypeOrmModule.forFeature([entities_1.DocDocumentoBase]),
        ],
        providers: [xml_generation_service_1.XmlGenerationService],
        exports: [xml_generation_service_1.XmlGenerationService],
    })
], XmlModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1sLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInhtbC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLDJDQUE4QztBQUM5Qyw2Q0FBZ0Q7QUFDaEQscUVBQWdFO0FBQ2hFLDhCQUFpQztBQUNqQyx1RUFBbUU7QUFDbkUscURBQTBEO0FBWW5ELElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBUztDQUFHLENBQUE7QUFBWiw4QkFBUztvQkFBVCxTQUFTO0lBVnJCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFO1lBQ1AscUJBQVk7WUFDWixhQUFRO1lBQ1Isb0NBQWdCO1lBQ2hCLHVCQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsMkJBQWdCLENBQUMsQ0FBQztTQUM3QztRQUNELFNBQVMsRUFBRSxDQUFDLDZDQUFvQixDQUFDO1FBQ2pDLE9BQU8sRUFBRSxDQUFDLDZDQUFvQixDQUFDO0tBQ2hDLENBQUM7R0FDVyxTQUFTLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ01vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgVHlwZU9ybU1vZHVsZSB9IGZyb20gJ0BuZXN0anMvdHlwZW9ybSc7XHJcbmltcG9ydCB7IFhtbEdlbmVyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi94bWwtZ2VuZXJhdGlvbi5zZXJ2aWNlJztcclxuaW1wb3J0IHsgUzNNb2R1bGUgfSBmcm9tICcuLi9zMyc7XHJcbmltcG9ydCB7IERvY3VtZW50b3NNb2R1bGUgfSBmcm9tICcuLi9kb2N1bWVudG9zL2RvY3VtZW50b3MubW9kdWxlJztcclxuaW1wb3J0IHsgRG9jRG9jdW1lbnRvQmFzZSB9IGZyb20gJy4uL2RvY3VtZW50b3MvZW50aXRpZXMnO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW1xyXG4gICAgQ29uZmlnTW9kdWxlLFxyXG4gICAgUzNNb2R1bGUsXHJcbiAgICBEb2N1bWVudG9zTW9kdWxlLFxyXG4gICAgVHlwZU9ybU1vZHVsZS5mb3JGZWF0dXJlKFtEb2NEb2N1bWVudG9CYXNlXSksXHJcbiAgXSxcclxuICBwcm92aWRlcnM6IFtYbWxHZW5lcmF0aW9uU2VydmljZV0sXHJcbiAgZXhwb3J0czogW1htbEdlbmVyYXRpb25TZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFhtbE1vZHVsZSB7fVxyXG5cclxuIl19