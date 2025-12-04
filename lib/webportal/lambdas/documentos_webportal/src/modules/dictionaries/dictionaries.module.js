"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionariesModule = void 0;
const entities_1 = require("./entities");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dictionaries_service_1 = require("./dictionaries.service");
const dictionaries_controller_1 = require("./dictionaries.controller");
const doc_tipo_fecha_entity_1 = require("./entities/doc-tipo-fecha.entity");
const doc_documento_base_entity_1 = require("../documentos/entities/doc-documento-base.entity");
let DictionariesModule = class DictionariesModule {
};
exports.DictionariesModule = DictionariesModule;
exports.DictionariesModule = DictionariesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.DinAduan,
                entities_1.DocRoles,
                doc_tipo_fecha_entity_1.DocTipoFecha,
                entities_1.DocStatusType,
                entities_1.DocTipoLocacion,
                entities_1.DocParticipacion,
                doc_documento_base_entity_1.DocDocumentoBase,
                entities_1.DocLocacionDocumento,
            ]),
        ],
        exports: [dictionaries_service_1.DictionariesService],
        providers: [dictionaries_service_1.DictionariesService],
        controllers: [dictionaries_controller_1.DictionariesController],
    })
], DictionariesModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdGlvbmFyaWVzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpY3Rpb25hcmllcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEseUNBT29CO0FBQ3BCLDJDQUF3QztBQUN4Qyw2Q0FBZ0Q7QUFDaEQsaUVBQTZEO0FBQzdELHVFQUFtRTtBQUNuRSw0RUFBZ0U7QUFDaEUsZ0dBQW9GO0FBbUI3RSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtDQUFHLENBQUE7QUFBckIsZ0RBQWtCOzZCQUFsQixrQkFBa0I7SUFqQjlCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFO1lBQ1AsdUJBQWEsQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZCLG1CQUFRO2dCQUNSLG1CQUFRO2dCQUNSLG9DQUFZO2dCQUNaLHdCQUFhO2dCQUNiLDBCQUFlO2dCQUNmLDJCQUFnQjtnQkFDaEIsNENBQWdCO2dCQUNoQiwrQkFBb0I7YUFDckIsQ0FBQztTQUNIO1FBQ0QsT0FBTyxFQUFFLENBQUMsMENBQW1CLENBQUM7UUFDOUIsU0FBUyxFQUFFLENBQUMsMENBQW1CLENBQUM7UUFDaEMsV0FBVyxFQUFFLENBQUMsZ0RBQXNCLENBQUM7S0FDdEMsQ0FBQztHQUNXLGtCQUFrQixDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBEb2NUaXBvTG9jYWNpb24sXHJcbiAgRG9jUm9sZXMsXHJcbiAgRG9jTG9jYWNpb25Eb2N1bWVudG8sXHJcbiAgRG9jUGFydGljaXBhY2lvbixcclxuICBEb2NTdGF0dXNUeXBlLFxyXG4gIERpbkFkdWFuLFxyXG59IGZyb20gJy4vZW50aXRpZXMnO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFR5cGVPcm1Nb2R1bGUgfSBmcm9tICdAbmVzdGpzL3R5cGVvcm0nO1xyXG5pbXBvcnQgeyBEaWN0aW9uYXJpZXNTZXJ2aWNlIH0gZnJvbSAnLi9kaWN0aW9uYXJpZXMuc2VydmljZSc7XHJcbmltcG9ydCB7IERpY3Rpb25hcmllc0NvbnRyb2xsZXIgfSBmcm9tICcuL2RpY3Rpb25hcmllcy5jb250cm9sbGVyJztcclxuaW1wb3J0IHsgRG9jVGlwb0ZlY2hhIH0gZnJvbSAnLi9lbnRpdGllcy9kb2MtdGlwby1mZWNoYS5lbnRpdHknO1xyXG5pbXBvcnQgeyBEb2NEb2N1bWVudG9CYXNlIH0gZnJvbSAnLi4vZG9jdW1lbnRvcy9lbnRpdGllcy9kb2MtZG9jdW1lbnRvLWJhc2UuZW50aXR5JztcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtcclxuICAgIFR5cGVPcm1Nb2R1bGUuZm9yRmVhdHVyZShbXHJcbiAgICAgIERpbkFkdWFuLFxyXG4gICAgICBEb2NSb2xlcyxcclxuICAgICAgRG9jVGlwb0ZlY2hhLFxyXG4gICAgICBEb2NTdGF0dXNUeXBlLFxyXG4gICAgICBEb2NUaXBvTG9jYWNpb24sXHJcbiAgICAgIERvY1BhcnRpY2lwYWNpb24sXHJcbiAgICAgIERvY0RvY3VtZW50b0Jhc2UsXHJcbiAgICAgIERvY0xvY2FjaW9uRG9jdW1lbnRvLFxyXG4gICAgXSksXHJcbiAgXSxcclxuICBleHBvcnRzOiBbRGljdGlvbmFyaWVzU2VydmljZV0sXHJcbiAgcHJvdmlkZXJzOiBbRGljdGlvbmFyaWVzU2VydmljZV0sXHJcbiAgY29udHJvbGxlcnM6IFtEaWN0aW9uYXJpZXNDb250cm9sbGVyXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIERpY3Rpb25hcmllc01vZHVsZSB7fVxyXG5cclxuIl19