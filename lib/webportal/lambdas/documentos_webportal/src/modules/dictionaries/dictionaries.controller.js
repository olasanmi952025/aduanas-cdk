"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionariesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../auth/public.decorator");
let DictionariesController = class DictionariesController {
    constructor(dictionariesService) {
        this.dictionariesService = dictionariesService;
    }
    async getTypeLocations(filters) {
        const documentType = filters?.documentType ?? '';
        return this.dictionariesService.getTypeLocations(documentType);
    }
    async getRoles() {
        return this.dictionariesService.getRoles();
    }
    async getUsersCreators(filters) {
        return this.dictionariesService.getUsersCreators(filters.soloActivos, filters.searchTerm || "", filters.page || 1, filters.limit || 20);
    }
    async getLocations(filters) {
        return this.dictionariesService.getLocations(filters);
    }
    async getLocalitiesDictionary(filters) {
        return this.dictionariesService.getLocalitiesDictionary(filters);
    }
    async getRolesParticipation() {
        return this.dictionariesService.getRolesParticipation();
    }
    // Endpoints para DocTipoFecha
    async getDateTypes(filters) {
        return this.dictionariesService.getDateTypesDoc(filters.typeDoc);
    }
    // Endpoints para DocStatusType
    async getStatusTypes(filters) {
        const typeDoc = filters?.typeDoc || 'MFTOC';
        return this.dictionariesService.getStatusTypesDoc(typeDoc);
    }
    // Endpoints para emisores
    async getEmitters() {
        return this.dictionariesService.getEmitters();
    }
    async getEmittersFilteredByName(filters) {
        return this.dictionariesService.getEmittersWithFilters(filters.searchTerm || '', filters.page || 1, filters.limit || 50);
    }
    async getParticipantsByRoleWithPerson(rol, filtros) {
        return this.dictionariesService.getParticipantsByRoleWithPerson(rol, filtros.searchTerm || '', filtros.page || 1, filtros.limit || 50);
    }
    // Endpoint to list customs offices from DIN schema
    async getCustoms() {
        return this.dictionariesService.getAduanas();
    }
};
exports.DictionariesController = DictionariesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("type-locations"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener tipos de locación" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de tipos de locación" }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getTypeLocations", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("roles"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener roles" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de roles" })
], DictionariesController.prototype, "getRoles", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("users-creators"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener usuarios creadores" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de usuarios creadores" }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getUsersCreators", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("locations"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener locaciones únicas" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de locaciones únicas" }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getLocations", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("localities-query"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener consulta de localidades" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Consulta estática de localidades" }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getLocalitiesDictionary", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("roles-participation"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener roles de participación" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de roles de participación" })
], DictionariesController.prototype, "getRolesParticipation", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('date-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener tipos de fecha' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de tipos de fecha' }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getDateTypes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('status-types'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener tipos de estado' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de tipos de estado' }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getStatusTypes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('emitters'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener emisores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de emisores' })
], DictionariesController.prototype, "getEmitters", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('emitters-filtered-by-name'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener emisores filtrados por nombre (opcional)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de emisores filtrados por nombre con paginación' }),
    __param(0, (0, common_1.Query)())
], DictionariesController.prototype, "getEmittersFilteredByName", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('participants-by-role-with-person/:rol'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener participantes por rol usando PER_PERSONA' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de participantes por rol con información de PER_PERSONA' }),
    __param(0, (0, common_1.Param)('rol')),
    __param(1, (0, common_1.Query)())
], DictionariesController.prototype, "getParticipantsByRoleWithPerson", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('customs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of customs offices from DIN schema' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of customs offices' })
], DictionariesController.prototype, "getCustoms", null);
exports.DictionariesController = DictionariesController = __decorate([
    (0, swagger_1.ApiTags)("dictionaries"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("dictionaries")
], DictionariesController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdGlvbmFyaWVzLmNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWN0aW9uYXJpZXMuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FLd0I7QUFDeEIsNkNBS3lCO0FBU3pCLGtFQUFxRDtBQU05QyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtJQUNqQyxZQUE2QixtQkFBd0M7UUFBeEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtJQUFHLENBQUM7SUFNbkUsQUFBTixLQUFLLENBQUMsZ0JBQWdCLENBQVUsT0FBNEI7UUFDMUQsTUFBTSxZQUFZLEdBQUcsT0FBTyxFQUFFLFlBQVksSUFBSSxFQUFFLENBQUM7UUFDakQsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLFFBQVE7UUFDWixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsZ0JBQWdCLENBQVUsT0FBb0M7UUFDbEUsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQzlDLE9BQU8sQ0FBQyxXQUFXLEVBQ25CLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRSxFQUN4QixPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsRUFDakIsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQ3BCLENBQUM7SUFDSixDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsWUFBWSxDQUFVLE9BQTZCO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBTUssQUFBTixLQUFLLENBQUMsdUJBQXVCLENBQVUsT0FBNkI7UUFDbEUsT0FBTyxJQUFJLENBQUMsbUJB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QUcsRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsQ0FBQzt3REFHcEU7aUNBeEhVLHNCQUFzQjtJQUhsQyxJQUFBLGlCQUFPLEVBQUMsY0FBYyxDQUFDO0lBQ3ZCLElBQUEsdUJBQWEsR0FBRTtJQUNmLElBQUEsbUJBQVUsRUFBQyxjQUFjLENBQUM7R0FDZCxzQkFBc0IsQ0F5SGxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBDb250cm9sbGVyLFxyXG4gIEdldCxcclxuICBQYXJhbSxcclxuICBRdWVyeSxcclxufSBmcm9tIFwiQG5lc3Rqcy9jb21tb25cIjtcclxuaW1wb3J0IHtcclxuICBBcGlUYWdzLFxyXG4gIEFwaU9wZXJhdGlvbixcclxuICBBcGlSZXNwb25zZSxcclxuICBBcGlCZWFyZXJBdXRoLFxyXG59IGZyb20gXCJAbmVzdGpzL3N3YWdnZXJcIjtcclxuaW1wb3J0IHtcclxuICBCdXNjYXJMb2NhbGlkYWRlc0R0byxcclxuICBPYnRlbmVyVXN1YXJpb3NDcmVhZG9yZXNEdG8sXHJcbiAgT2J0ZW5lckxvY2FjaW9uZXNEdG8sXHJcbiAgT2J0ZW5lckVtaXNvcmVzRHRvLFxyXG4gIEdldFR5cGVMb2NhdGlvbnNEdG8sXHJcbiAgR2V0RG9jVHlwZXNEdG8sXHJcbn0gZnJvbSBcIi4vZHRvL2RpY3Rpb25hcmllcy5kdG9cIjtcclxuaW1wb3J0IHsgUHVibGljIH0gZnJvbSBcIi4uLy4uL2F1dGgvcHVibGljLmRlY29yYXRvclwiO1xyXG5pbXBvcnQgeyBEaWN0aW9uYXJpZXNTZXJ2aWNlIH0gZnJvbSBcIi4vZGljdGlvbmFyaWVzLnNlcnZpY2VcIjtcclxuXHJcbkBBcGlUYWdzKFwiZGljdGlvbmFyaWVzXCIpXHJcbkBBcGlCZWFyZXJBdXRoKClcclxuQENvbnRyb2xsZXIoXCJkaWN0aW9uYXJpZXNcIilcclxuZXhwb3J0IGNsYXNzIERpY3Rpb25hcmllc0NvbnRyb2xsZXIge1xyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZGljdGlvbmFyaWVzU2VydmljZTogRGljdGlvbmFyaWVzU2VydmljZSkge31cclxuXHJcbiAgQFB1YmxpYygpXHJcbiAgQEdldChcInR5cGUtbG9jYXRpb25zXCIpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6IFwiT2J0ZW5lciB0aXBvcyBkZSBsb2NhY2nDs25cIiB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogXCJMaXN0YSBkZSB0aXBvcyBkZSBsb2NhY2nDs25cIiB9KVxyXG4gIGFzeW5jIGdldFR5cGVMb2NhdGlvbnMoQFF1ZXJ5KCkgZmlsdGVyczogR2V0VHlwZUxvY2F0aW9uc0R0bykge1xyXG4gICAgY29uc3QgZG9jdW1lbnRUeXBlID0gZmlsdGVycz8uZG9jdW1lbnRUeXBlID8/ICcnO1xyXG4gICAgcmV0dXJuIHRoaXMuZGljdGlvbmFyaWVzU2VydmljZS5nZXRUeXBlTG9jYXRpb25zKGRvY3VtZW50VHlwZSk7XHJcbiAgfVxyXG5cclxuICBAUHVibGljKClcclxuICBAR2V0KFwicm9sZXNcIilcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogXCJPYnRlbmVyIHJvbGVzXCIgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246IFwiTGlzdGEgZGUgcm9sZXNcIiB9KVxyXG4gIGFzeW5jIGdldFJvbGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGljdGlvbmFyaWVzU2VydmljZS5nZXRSb2xlcygpO1xyXG4gIH1cclxuXHJcbiAgQFB1YmxpYygpXHJcbiAgQEdldChcInVzZXJzLWNyZWF0b3JzXCIpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6IFwiT2J0ZW5lciB1c3VhcmlvcyBjcmVhZG9yZXNcIiB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogXCJMaXN0YSBkZSB1c3VhcmlvcyBjcmVhZG9yZXNcIiB9KVxyXG4gIGFzeW5jIGdldFVzZXJzQ3JlYXRvcnMoQFF1ZXJ5KCkgZmlsdGVyczogT2J0ZW5lclVzdWFyaW9zQ3JlYWRvcmVzRHRvKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJpZXNTZXJ2aWNlLmdldFVzZXJzQ3JlYXRvcnMoXHJcbiAgICAgIGZpbHRlcnMuc29sb0FjdGl2b3MsXHJcbiAgICAgIGZpbHRlcnMuc2VhcmNoVGVybSB8fCBcIlwiLFxyXG4gICAgICBmaWx0ZXJzLnBhZ2UgfHwgMSxcclxuICAgICAgZmlsdGVycy5saW1pdCB8fCAyMFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoXCJsb2NhdGlvbnNcIilcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogXCJPYnRlbmVyIGxvY2FjaW9uZXMgw7puaWNhc1wiIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiBcIkxpc3RhIGRlIGxvY2FjaW9uZXMgw7puaWNhc1wiIH0pXHJcbiAgYXN5bmMgZ2V0TG9jYXRpb25zKEBRdWVyeSgpIGZpbHRlcnM6IE9idGVuZXJMb2NhY2lvbmVzRHRvKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJpZXNTZXJ2aWNlLmdldExvY2F0aW9ucyhmaWx0ZXJzKTtcclxuICB9XHJcblxyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoXCJsb2NhbGl0aWVzLXF1ZXJ5XCIpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6IFwiT2J0ZW5lciBjb25zdWx0YSBkZSBsb2NhbGlkYWRlc1wiIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiBcIkNvbnN1bHRhIGVzdMOhdGljYSBkZSBsb2NhbGlkYWRlc1wiIH0pXHJcbiAgYXN5bmMgZ2V0TG9jYWxpdGllc0RpY3Rpb25hcnkoQFF1ZXJ5KCkgZmlsdGVyczogQnVzY2FyTG9jYWxpZGFkZXNEdG8pIHtcclxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcmllc1NlcnZpY2UuZ2V0TG9jYWxpdGllc0RpY3Rpb25hcnkoZmlsdGVycyk7XHJcbiAgfVxyXG5cclxuICBAUHVibGljKClcclxuICBAR2V0KFwicm9sZXMtcGFydGljaXBhdGlvblwiKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiBcIk9idGVuZXIgcm9sZXMgZGUgcGFydGljaXBhY2nDs25cIiB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogXCJMaXN0YSBkZSByb2xlcyBkZSBwYXJ0aWNpcGFjacOzblwiIH0pXHJcbiAgYXN5bmMgZ2V0Um9sZXNQYXJ0aWNpcGF0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGljdGlvbmFyaWVzU2VydmljZS5nZXRSb2xlc1BhcnRpY2lwYXRpb24oKTtcclxuICB9XHJcblxyXG4gIC8vIEVuZHBvaW50cyBwYXJhIERvY1RpcG9GZWNoYVxyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoJ2RhdGUtdHlwZXMnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnT2J0ZW5lciB0aXBvcyBkZSBmZWNoYScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdMaXN0YSBkZSB0aXBvcyBkZSBmZWNoYScgfSlcclxuICBhc3luYyBnZXREYXRlVHlwZXMoQFF1ZXJ5KCkgZmlsdGVyczogR2V0RG9jVHlwZXNEdG8pIHtcclxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcmllc1NlcnZpY2UuZ2V0RGF0ZVR5cGVzRG9jKGZpbHRlcnMudHlwZURvYyk7XHJcbiAgfVxyXG5cclxuICAvLyBFbmRwb2ludHMgcGFyYSBEb2NTdGF0dXNUeXBlXHJcbiAgQFB1YmxpYygpXHJcbiAgQEdldCgnc3RhdHVzLXR5cGVzJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ09idGVuZXIgdGlwb3MgZGUgZXN0YWRvJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ0xpc3RhIGRlIHRpcG9zIGRlIGVzdGFkbycgfSlcclxuICBhc3luYyBnZXRTdGF0dXNUeXBlcyhAUXVlcnkoKSBmaWx0ZXJzOiBHZXREb2NUeXBlc0R0bykge1xyXG4gICAgY29uc3QgdHlwZURvYyA9IGZpbHRlcnM/LnR5cGVEb2MgfHwgJ01GVE9DJztcclxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcmllc1NlcnZpY2UuZ2V0U3RhdHVzVHlwZXNEb2ModHlwZURvYyk7XHJcbiAgfVxyXG5cclxuICAvLyBFbmRwb2ludHMgcGFyYSBlbWlzb3Jlc1xyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoJ2VtaXR0ZXJzJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ09idGVuZXIgZW1pc29yZXMnIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiAnTGlzdGEgZGUgZW1pc29yZXMnIH0pXHJcbiAgYXN5bmMgZ2V0RW1pdHRlcnMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJpZXNTZXJ2aWNlLmdldEVtaXR0ZXJzKCk7XHJcbiAgfVxyXG5cclxuICBAUHVibGljKClcclxuICBAR2V0KCdlbWl0dGVycy1maWx0ZXJlZC1ieS1uYW1lJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ09idGVuZXIgZW1pc29yZXMgZmlsdHJhZG9zIHBvciBub21icmUgKG9wY2lvbmFsKScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdMaXN0YSBkZSBlbWlzb3JlcyBmaWx0cmFkb3MgcG9yIG5vbWJyZSBjb24gcGFnaW5hY2nDs24nIH0pXHJcbiAgYXN5bmMgZ2V0RW1pdHRlcnNGaWx0ZXJlZEJ5TmFtZShAUXVlcnkoKSBmaWx0ZXJzOiBPYnRlbmVyRW1pc29yZXNEdG8pIHtcclxuICAgIHJldHVybiB0aGlzLmRpY3Rpb25hcmllc1NlcnZpY2UuZ2V0RW1pdHRlcnNXaXRoRmlsdGVycyhcclxuICAgICAgZmlsdGVycy5zZWFyY2hUZXJtIHx8ICcnLFxyXG4gICAgICBmaWx0ZXJzLnBhZ2UgfHwgMSxcclxuICAgICAgZmlsdGVycy5saW1pdCB8fCA1MFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoJ3BhcnRpY2lwYW50cy1ieS1yb2xlLXdpdGgtcGVyc29uLzpyb2wnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnT2J0ZW5lciBwYXJ0aWNpcGFudGVzIHBvciByb2wgdXNhbmRvIFBFUl9QRVJTT05BJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ0xpc3RhIGRlIHBhcnRpY2lwYW50ZXMgcG9yIHJvbCBjb24gaW5mb3JtYWNpw7NuIGRlIFBFUl9QRVJTT05BJyB9KVxyXG4gIGFzeW5jIGdldFBhcnRpY2lwYW50c0J5Um9sZVdpdGhQZXJzb24oXHJcbiAgICBAUGFyYW0oJ3JvbCcpIHJvbDogc3RyaW5nLFxyXG4gICAgQFF1ZXJ5KCkgZmlsdHJvczogT2J0ZW5lckVtaXNvcmVzRHRvXHJcbiAgKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJpZXNTZXJ2aWNlLmdldFBhcnRpY2lwYW50c0J5Um9sZVdpdGhQZXJzb24oXHJcbiAgICAgIHJvbCxcclxuICAgICAgZmlsdHJvcy5zZWFyY2hUZXJtIHx8ICcnLFxyXG4gICAgICBmaWx0cm9zLnBhZ2UgfHwgMSxcclxuICAgICAgZmlsdHJvcy5saW1pdCB8fCA1MFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIEVuZHBvaW50IHRvIGxpc3QgY3VzdG9tcyBvZmZpY2VzIGZyb20gRElOIHNjaGVtYVxyXG4gIEBQdWJsaWMoKVxyXG4gIEBHZXQoJ2N1c3RvbXMnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnR2V0IGxpc3Qgb2YgY3VzdG9tcyBvZmZpY2VzIGZyb20gRElOIHNjaGVtYScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdMaXN0IG9mIGN1c3RvbXMgb2ZmaWNlcycgfSlcclxuICBhc3luYyBnZXRDdXN0b21zKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGljdGlvbmFyaWVzU2VydmljZS5nZXRBZHVhbmFzKCk7XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=