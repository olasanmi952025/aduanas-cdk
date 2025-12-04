"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosModule = void 0;
const sqs_1 = require("../sqs");
const common_1 = require("@nestjs/common");
const entities_1 = require("./entities");
const typeorm_1 = require("@nestjs/typeorm");
const documentos_service_1 = require("./documentos.service");
const documentos_controller_1 = require("./documentos.controller");
const cache_1 = require("../../shared/cache");
const export_status_1 = require("../export-status");
let DocumentosModule = class DocumentosModule {
};
exports.DocumentosModule = DocumentosModule;
exports.DocumentosModule = DocumentosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sqs_1.SQSModule,
            export_status_1.ExportStatusModule,
            typeorm_1.TypeOrmModule.forFeature([entities_1.DocDocumentoBase]),
        ],
        controllers: [documentos_controller_1.DocumentsController],
        providers: [
            cache_1.CacheFactory,
            documentos_service_1.DocumentsService,
            cache_1.CacheServiceProvider,
        ],
        exports: [documentos_service_1.DocumentsService],
    })
], DocumentosModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudG9zLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxnQ0FBbUM7QUFDbkMsMkNBQXdDO0FBQ3hDLHlDQUE4QztBQUM5Qyw2Q0FBZ0Q7QUFDaEQsNkRBQXdEO0FBQ3hELG1FQUE4RDtBQUM5RCw4Q0FBd0U7QUFDeEUsb0RBQXNEO0FBZ0IvQyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtDQUFHLENBQUE7QUFBbkIsNENBQWdCOzJCQUFoQixnQkFBZ0I7SUFkNUIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUU7WUFDUCxlQUFTO1lBQ1Qsa0NBQWtCO1lBQ2xCLHVCQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsMkJBQWdCLENBQUMsQ0FBQztTQUM3QztRQUNELFdBQVcsRUFBRSxDQUFDLDJDQUFtQixDQUFDO1FBQ2xDLFNBQVMsRUFBRTtZQUNULG9CQUFZO1lBQ1oscUNBQWdCO1lBQ2hCLDRCQUFvQjtTQUNyQjtRQUNELE9BQU8sRUFBRSxDQUFDLHFDQUFnQixDQUFDO0tBQzVCLENBQUM7R0FDVyxnQkFBZ0IsQ0FBRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNRU01vZHVsZSB9IGZyb20gXCIuLi9zcXNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IERvY0RvY3VtZW50b0Jhc2UgfSBmcm9tIFwiLi9lbnRpdGllc1wiO1xyXG5pbXBvcnQgeyBUeXBlT3JtTW9kdWxlIH0gZnJvbSBcIkBuZXN0anMvdHlwZW9ybVwiO1xyXG5pbXBvcnQgeyBEb2N1bWVudHNTZXJ2aWNlIH0gZnJvbSBcIi4vZG9jdW1lbnRvcy5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IERvY3VtZW50c0NvbnRyb2xsZXIgfSBmcm9tIFwiLi9kb2N1bWVudG9zLmNvbnRyb2xsZXJcIjtcclxuaW1wb3J0IHsgQ2FjaGVGYWN0b3J5LCBDYWNoZVNlcnZpY2VQcm92aWRlciB9IGZyb20gXCIuLi8uLi9zaGFyZWQvY2FjaGVcIjtcclxuaW1wb3J0IHsgRXhwb3J0U3RhdHVzTW9kdWxlIH0gZnJvbSBcIi4uL2V4cG9ydC1zdGF0dXNcIjtcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtcclxuICAgIFNRU01vZHVsZSxcclxuICAgIEV4cG9ydFN0YXR1c01vZHVsZSxcclxuICAgIFR5cGVPcm1Nb2R1bGUuZm9yRmVhdHVyZShbRG9jRG9jdW1lbnRvQmFzZV0pLFxyXG4gIF0sXHJcbiAgY29udHJvbGxlcnM6IFtEb2N1bWVudHNDb250cm9sbGVyXSxcclxuICBwcm92aWRlcnM6IFtcclxuICAgIENhY2hlRmFjdG9yeSxcclxuICAgIERvY3VtZW50c1NlcnZpY2UsXHJcbiAgICBDYWNoZVNlcnZpY2VQcm92aWRlcixcclxuICBdLFxyXG4gIGV4cG9ydHM6IFtEb2N1bWVudHNTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIERvY3VtZW50b3NNb2R1bGUge31cclxuIl19