"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const documentos_service_1 = require("./documentos.service");
const manifest_sqs_service_1 = require("../../service/manifest-sqs.service");
const documentos_controller_1 = require("./documentos.controller");
const export_status_service_1 = require("../../service/export-status.service");
const entities_1 = require("./entities");
const entities_2 = require("../dictionaries/entities");
const manifest_job_mapping_entity_1 = require("./entities/manifest-job-mapping.entity");
let DocumentosModule = class DocumentosModule {
};
exports.DocumentosModule = DocumentosModule;
exports.DocumentosModule = DocumentosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.DocDocumentoBase,
                entities_2.DocLocacionDocumento,
                entities_2.DocParticipacion,
                manifest_job_mapping_entity_1.ManifestJobMapping,
            ]),
        ],
        controllers: [documentos_controller_1.DocumentsController],
        providers: [
            documentos_service_1.DocumentsService,
            manifest_sqs_service_1.ManifestSQSService,
            export_status_service_1.ExportStatusService,
        ],
        exports: [documentos_service_1.DocumentsService],
    })
], DocumentosModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudG9zLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMsNkNBQWdEO0FBQ2hELDZEQUF3RDtBQUN4RCw2RUFBd0U7QUFDeEUsbUVBQThEO0FBQzlELCtFQUEwRTtBQUMxRSx5Q0FFb0I7QUFDcEIsdURBR2tDO0FBQ2xDLHdGQUE0RTtBQW1CckUsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7Q0FBRyxDQUFBO0FBQW5CLDRDQUFnQjsyQkFBaEIsZ0JBQWdCO0lBakI1QixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRTtZQUNQLHVCQUFhLENBQUMsVUFBVSxDQUFDO2dCQUN2QiwyQkFBZ0I7Z0JBQ2hCLCtCQUFvQjtnQkFDcEIsMkJBQWdCO2dCQUNoQixnREFBa0I7YUFDbkIsQ0FBQztTQUNIO1FBQ0QsV0FBVyxFQUFFLENBQUMsMkNBQW1CLENBQUM7UUFDbEMsU0FBUyxFQUFFO1lBQ1QscUNBQWdCO1lBQ2hCLHlDQUFrQjtZQUNsQiwyQ0FBbUI7U0FDcEI7UUFDRCxPQUFPLEVBQUUsQ0FBQyxxQ0FBZ0IsQ0FBQztLQUM1QixDQUFDO0dBQ1csZ0JBQWdCLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFR5cGVPcm1Nb2R1bGUgfSBmcm9tICdAbmVzdGpzL3R5cGVvcm0nO1xyXG5pbXBvcnQgeyBEb2N1bWVudHNTZXJ2aWNlIH0gZnJvbSAnLi9kb2N1bWVudG9zLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBNYW5pZmVzdFNRU1NlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlL21hbmlmZXN0LXNxcy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRG9jdW1lbnRzQ29udHJvbGxlciB9IGZyb20gJy4vZG9jdW1lbnRvcy5jb250cm9sbGVyJztcclxuaW1wb3J0IHsgRXhwb3J0U3RhdHVzU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2UvZXhwb3J0LXN0YXR1cy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgXHJcbiAgRG9jRG9jdW1lbnRvQmFzZVxyXG59IGZyb20gJy4vZW50aXRpZXMnO1xyXG5pbXBvcnQge1xyXG4gIERvY0xvY2FjaW9uRG9jdW1lbnRvLFxyXG4gIERvY1BhcnRpY2lwYWNpb25cclxufSBmcm9tICcuLi9kaWN0aW9uYXJpZXMvZW50aXRpZXMnO1xyXG5pbXBvcnQgeyBNYW5pZmVzdEpvYk1hcHBpbmcgfSBmcm9tICcuL2VudGl0aWVzL21hbmlmZXN0LWpvYi1tYXBwaW5nLmVudGl0eSc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbXHJcbiAgICBUeXBlT3JtTW9kdWxlLmZvckZlYXR1cmUoW1xyXG4gICAgICBEb2NEb2N1bWVudG9CYXNlLFxyXG4gICAgICBEb2NMb2NhY2lvbkRvY3VtZW50byxcclxuICAgICAgRG9jUGFydGljaXBhY2lvbixcclxuICAgICAgTWFuaWZlc3RKb2JNYXBwaW5nLFxyXG4gICAgXSksXHJcbiAgXSxcclxuICBjb250cm9sbGVyczogW0RvY3VtZW50c0NvbnRyb2xsZXJdLFxyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgRG9jdW1lbnRzU2VydmljZSwgXHJcbiAgICBNYW5pZmVzdFNRU1NlcnZpY2UsIFxyXG4gICAgRXhwb3J0U3RhdHVzU2VydmljZSxcclxuICBdLFxyXG4gIGV4cG9ydHM6IFtEb2N1bWVudHNTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIERvY3VtZW50b3NNb2R1bGUge31cclxuIl19