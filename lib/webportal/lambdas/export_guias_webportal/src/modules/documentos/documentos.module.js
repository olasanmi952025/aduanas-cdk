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
const entities_1 = require("./entities");
const typeorm_1 = require("@nestjs/typeorm");
const documents_query_service_1 = require("./documents-query.service");
let DocumentosModule = class DocumentosModule {
};
exports.DocumentosModule = DocumentosModule;
exports.DocumentosModule = DocumentosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.DocDocumentoBase]),
        ],
        providers: [documents_query_service_1.DocumentsQueryService],
        exports: [documents_query_service_1.DocumentsQueryService],
    })
], DocumentosModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2N1bWVudG9zLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMseUNBQThDO0FBQzlDLDZDQUFnRDtBQUNoRCx1RUFBa0U7QUFTM0QsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7Q0FBRyxDQUFBO0FBQW5CLDRDQUFnQjsyQkFBaEIsZ0JBQWdCO0lBUDVCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFO1lBQ1AsdUJBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1NBQzdDO1FBQ0QsU0FBUyxFQUFFLENBQUMsK0NBQXFCLENBQUM7UUFDbEMsT0FBTyxFQUFFLENBQUMsK0NBQXFCLENBQUM7S0FDakMsQ0FBQztHQUNXLGdCQUFnQixDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IERvY0RvY3VtZW50b0Jhc2UgfSBmcm9tIFwiLi9lbnRpdGllc1wiO1xyXG5pbXBvcnQgeyBUeXBlT3JtTW9kdWxlIH0gZnJvbSBcIkBuZXN0anMvdHlwZW9ybVwiO1xyXG5pbXBvcnQgeyBEb2N1bWVudHNRdWVyeVNlcnZpY2UgfSBmcm9tIFwiLi9kb2N1bWVudHMtcXVlcnkuc2VydmljZVwiO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW1xyXG4gICAgVHlwZU9ybU1vZHVsZS5mb3JGZWF0dXJlKFtEb2NEb2N1bWVudG9CYXNlXSksXHJcbiAgXSxcclxuICBwcm92aWRlcnM6IFtEb2N1bWVudHNRdWVyeVNlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtEb2N1bWVudHNRdWVyeVNlcnZpY2VdLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRvc01vZHVsZSB7fVxyXG5cclxuIl19