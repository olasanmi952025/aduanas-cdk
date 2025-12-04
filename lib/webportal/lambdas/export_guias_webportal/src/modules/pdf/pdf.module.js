"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfModule = void 0;
const common_1 = require("@nestjs/common");
const pdf_generation_service_1 = require("./pdf-generation.service");
const soap_client_service_1 = require("./soap-client.service");
const s3_1 = require("../s3");
const documentos_module_1 = require("../documentos/documentos.module");
let PdfModule = class PdfModule {
};
exports.PdfModule = PdfModule;
exports.PdfModule = PdfModule = __decorate([
    (0, common_1.Module)({
        imports: [s3_1.S3Module, documentos_module_1.DocumentosModule],
        providers: [pdf_generation_service_1.PdfGenerationService, soap_client_service_1.SoapClientService],
        exports: [pdf_generation_service_1.PdfGenerationService, soap_client_service_1.SoapClientService],
    })
], PdfModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBkZi5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLHFFQUFnRTtBQUNoRSwrREFBMEQ7QUFDMUQsOEJBQWlDO0FBQ2pDLHVFQUFtRTtBQU81RCxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVM7Q0FBRyxDQUFBO0FBQVosOEJBQVM7b0JBQVQsU0FBUztJQUxyQixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRSxDQUFDLGFBQVEsRUFBRSxvQ0FBZ0IsQ0FBQztRQUNyQyxTQUFTLEVBQUUsQ0FBQyw2Q0FBb0IsRUFBRSx1Q0FBaUIsQ0FBQztRQUNwRCxPQUFPLEVBQUUsQ0FBQyw2Q0FBb0IsRUFBRSx1Q0FBaUIsQ0FBQztLQUNuRCxDQUFDO0dBQ1csU0FBUyxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBQZGZHZW5lcmF0aW9uU2VydmljZSB9IGZyb20gJy4vcGRmLWdlbmVyYXRpb24uc2VydmljZSc7XHJcbmltcG9ydCB7IFNvYXBDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi9zb2FwLWNsaWVudC5zZXJ2aWNlJztcclxuaW1wb3J0IHsgUzNNb2R1bGUgfSBmcm9tICcuLi9zMyc7XHJcbmltcG9ydCB7IERvY3VtZW50b3NNb2R1bGUgfSBmcm9tICcuLi9kb2N1bWVudG9zL2RvY3VtZW50b3MubW9kdWxlJztcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtTM01vZHVsZSwgRG9jdW1lbnRvc01vZHVsZV0sXHJcbiAgcHJvdmlkZXJzOiBbUGRmR2VuZXJhdGlvblNlcnZpY2UsIFNvYXBDbGllbnRTZXJ2aWNlXSxcclxuICBleHBvcnRzOiBbUGRmR2VuZXJhdGlvblNlcnZpY2UsIFNvYXBDbGllbnRTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFBkZk1vZHVsZSB7fVxyXG5cclxuIl19