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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../auth/roles.decorator");
let DocumentsController = class DocumentsController {
    constructor(documentsService) {
        this.documentsService = documentsService;
        this.defaultUserId = 8981;
    }
    async searchDocuments(filtros, req) {
        const { sub } = req.user;
        const userId = sub.split('_').pop() || this.defaultUserId;
        filtros.userId = Number(userId);
        return this.documentsService.searchDocuments(filtros);
    }
    // IMPORTANTE: Este endpoint debe ir ANTES de @Get(":id")
    async getManifestCloseStatus(requestId) {
        return this.documentsService.getManifestCloseStatus(requestId);
    }
    async exportDocuments(filters, fileName) {
        return this.documentsService.exportDocumentsSQS(filters, fileName);
    }
    async getXmlExportStatus(requestId) {
        return this.documentsService.getXmlExportStatus(requestId);
    }
    //@Post("close-manifest")
    //@Roles('couriers')
    //@ApiOperation({
    //  summary: "Cerrar manifiesto de forma síncrona (proceso normal)",
    //  description:
    //    "Ejecuta el proceso de cierre de manifiesto de forma síncrona. El proceso completo (18 pasos) se ejecuta inmediatamente y retorna el resultado final.",
    //})
    //@ApiResponse({
    //  status: 200,
    //  description:
    //    "Manifiesto cerrado exitosamente. Retorna el resultado del proceso completo.",
    //})
    //async closeManifest(@Body() payload: CloseManifestDto) {
    //  return this.documentsService.closeManifestSync(payload);
    //}
    async closeManifestSQS(payload, req) {
        return this.documentsService.closeManifestSQS(payload, req);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(""),
    (0, roles_decorator_1.Roles)('couriers'),
    (0, swagger_1.ApiOperation)({ summary: "Buscar documentos con filtros" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de documentos encontrados" }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)())
], DocumentsController.prototype, "searchDocuments", null);
__decorate([
    (0, common_1.Get)("close-manifest/status/:requestId"),
    (0, roles_decorator_1.Roles)('couriers'),
    (0, swagger_1.ApiOperation)({
        summary: "Consultar estado del cierre de manifiesto",
        description: "Consulta el estado del proceso de cierre de manifiesto asíncrono usando el requestId retornado al enviar el proceso con POST /documents/close-manifest-sqs. El estado se consulta desde DynamoDB donde el polling process lo actualiza.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Estado del proceso de cierre de manifiesto",
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: "Proceso no encontrado para el requestId",
    }),
    __param(0, (0, common_1.Param)("requestId"))
], DocumentsController.prototype, "getManifestCloseStatus", null);
__decorate([
    (0, common_1.Post)("exports/xml"),
    (0, roles_decorator_1.Roles)('couriers'),
    (0, swagger_1.ApiOperation)({
        summary: "Exportar documentos a XML con filtros (asíncrono)",
        description: "Envía el proceso de exportación XML directamente a la cola SQS. El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará. Retorna un requestId para consultar el estado en DynamoDB."
    }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: "Proceso de exportación XML enviado a la cola SQS. Retorna requestId para consultar el estado en DynamoDB."
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('fileName'))
], DocumentsController.prototype, "exportDocuments", null);
__decorate([
    (0, common_1.Get)("exports/xml/status/:requestId"),
    (0, roles_decorator_1.Roles)('couriers'),
    (0, swagger_1.ApiOperation)({
        summary: "Consultar estado de exportación XML",
        description: "Consulta el estado del proceso de exportación XML asíncrono usando el requestId retornado al enviar el proceso con POST /documents/exports/xml. El estado se consulta desde DynamoDB donde el polling process lo actualiza.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Estado del proceso de exportación XML",
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: "Proceso no encontrado para el requestId",
    }),
    __param(0, (0, common_1.Param)("requestId"))
], DocumentsController.prototype, "getXmlExportStatus", null);
__decorate([
    (0, common_1.Post)("close-manifest"),
    (0, roles_decorator_1.Roles)('couriers'),
    (0, swagger_1.ApiOperation)({
        summary: "Cerrar manifiesto de forma asíncrona (cola SQS)",
        description: "Envía el proceso de cierre de manifiesto directamente a la cola SQS. El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará. Retorna un requestId para consultar el estado en DynamoDB.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: "Proceso de cierre enviado a la cola SQS. Retorna requestId para consultar el estado en DynamoDB.",
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)())
], DocumentsController.prototype, "closeManifestSQS", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)("documents"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("documents")
], DocumentsController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQVV3QjtBQUN4Qiw2Q0FPeUI7QUFNekIsZ0VBQW1EO0FBUTVDLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO0lBRTlCLFlBQTZCLGdCQUFrQztRQUFsQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRDlDLGtCQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzRCLENBQUM7SUFNN0QsQUFBTixLQUFLLENBQUMsZUFBZSxDQUFVLE9BQTRCLEVBQVMsR0FBcUI7UUFDdkYsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDekIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzFELE9BQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBQ0gseURBQXlEO0lBZ0JqRCxBQUFOLEtBQUssQ0FBQyxzQkFBc0IsQ0FBcUIsU0FBaUI7UUFDaEUsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQVlLLEFBQU4sS0FBSyxDQUFDLGVBQWUsQ0FDWCxPQUE0QixFQUNqQixRQUFpQjtRQUVwQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQWdCSyxBQUFOLEtBQUssQ0FBQyxrQkFBa0IsQ0FBcUIsU0FB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QUNsTyxDQUFDO0lBQ0QsSUFBQSxxQkFBVyxFQUFDO1FBQ1gsTUFBTSxFQUFFLEdBQUc7UUFDWCxXQUFXLEVBQ1Qsa0dBQWtHO0tBQ3JHLENBQUM7SUFFQyxXQUFBLElBQUEsYUFBSSxHQUFFLENBQUE7SUFDTixXQUFBLElBQUEsWUFBRyxHQUFFLENBQUE7MkRBR1A7OEJBdEdVLG1CQUFtQjtJQUgvQixJQUFBLGlCQUFPLEVBQUMsV0FBVyxDQUFDO0lBQ3BCLElBQUEsdUJBQWEsR0FBRTtJQUNmLElBQUEsbUJBQVUsRUFBQyxXQUFXLENBQUM7R0FDWCxtQkFBbUIsQ0F3Ry9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29udHJvbGxlcixcbiAgR2V0LFxuICBQb3N0LFxuICBCb2R5LFxuICBQYXJhbSxcbiAgUXVlcnksXG4gIEhlYWRlcixcbiAgUmVzLFxuICBSZXEsXG59IGZyb20gXCJAbmVzdGpzL2NvbW1vblwiO1xuaW1wb3J0IHtcbiAgQXBpVGFncyxcbiAgQXBpT3BlcmF0aW9uLFxuICBBcGlSZXNwb25zZSxcbiAgQXBpQmVhcmVyQXV0aCxcbiAgQXBpUXVlcnksXG4gIEFwaUJvZHksXG59IGZyb20gXCJAbmVzdGpzL3N3YWdnZXJcIjtcbmltcG9ydCB7XG4gIEJ1c2NhckRvY3VtZW50b3NEdG8sXG4gIENsb3NlTWFuaWZlc3REdG8sXG59IGZyb20gXCIuL2R0by9kb2N1bWVudG9zLmR0b1wiO1xuaW1wb3J0IHsgUmVzcG9uc2UgfSBmcm9tIFwiZXhwcmVzc1wiO1xuaW1wb3J0IHsgUm9sZXMgfSBmcm9tIFwiLi4vLi4vYXV0aC9yb2xlcy5kZWNvcmF0b3JcIjtcbmltcG9ydCB7IFB1YmxpYyB9IGZyb20gXCIuLi8uLi9hdXRoL3B1YmxpYy5kZWNvcmF0b3JcIjtcbmltcG9ydCB7IERvY3VtZW50c1NlcnZpY2UgfSBmcm9tIFwiLi9kb2N1bWVudG9zLnNlcnZpY2VcIjtcbmltcG9ydCB7IFJlcXVlc3RJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9yZXF1ZXN0LmludGVyZmFjZVwiO1xuXG5AQXBpVGFncyhcImRvY3VtZW50c1wiKVxuQEFwaUJlYXJlckF1dGgoKVxuQENvbnRyb2xsZXIoXCJkb2N1bWVudHNcIilcbmV4cG9ydCBjbGFzcyBEb2N1bWVudHNDb250cm9sbGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBkZWZhdWx0VXNlcklkID0gODk4MTtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkb2N1bWVudHNTZXJ2aWNlOiBEb2N1bWVudHNTZXJ2aWNlKSB7fVxuXG4gIEBHZXQoXCJcIilcbiAgQFJvbGVzKCdjb3VyaWVycycpXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiBcIkJ1c2NhciBkb2N1bWVudG9zIGNvbiBmaWx0cm9zXCIgfSlcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiBcIkxpc3RhIGRlIGRvY3VtZW50b3MgZW5jb250cmFkb3NcIiB9KVxuICBhc3luYyBzZWFyY2hEb2N1bWVudHMoQFF1ZXJ5KCkgZmlsdHJvczogQnVzY2FyRG9jdW1lbnRvc0R0bywgQFJlcSgpIHJlcTogUmVxdWVzdEludGVyZmFjZSkge1xuICAgIGNvbnN0IHsgc3ViIH0gPSByZXEudXNlcjtcbiAgICBjb25zdCB1c2VySWQgPSBzdWIuc3BsaXQoJ18nKS5wb3AoKSB8fCB0aGlzLmRlZmF1bHRVc2VySWQ7XG4gICAgZmlsdHJvcy51c2VySWQgPSBOdW1iZXIodXNlcklkKTtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHNTZXJ2aWNlLnNlYXJjaERvY3VtZW50cyhmaWx0cm9zKTtcbiAgfVxuLy8gSU1QT1JUQU5URTogRXN0ZSBlbmRwb2ludCBkZWJlIGlyIEFOVEVTIGRlIEBHZXQoXCI6aWRcIilcbiAgQEdldChcImNsb3NlLW1hbmlmZXN0L3N0YXR1cy86cmVxdWVzdElkXCIpXG4gIEBSb2xlcygnY291cmllcnMnKVxuICBAQXBpT3BlcmF0aW9uKHtcbiAgICBzdW1tYXJ5OiBcIkNvbnN1bHRhciBlc3RhZG8gZGVsIGNpZXJyZSBkZSBtYW5pZmllc3RvXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBcIkNvbnN1bHRhIGVsIGVzdGFkbyBkZWwgcHJvY2VzbyBkZSBjaWVycmUgZGUgbWFuaWZpZXN0byBhc8OtbmNyb25vIHVzYW5kbyBlbCByZXF1ZXN0SWQgcmV0b3JuYWRvIGFsIGVudmlhciBlbCBwcm9jZXNvIGNvbiBQT1NUIC9kb2N1bWVudHMvY2xvc2UtbWFuaWZlc3Qtc3FzLiBFbCBlc3RhZG8gc2UgY29uc3VsdGEgZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cIixcbiAgfSlcbiAgQEFwaVJlc3BvbnNlKHtcbiAgICBzdGF0dXM6IDIwMCxcbiAgICBkZXNjcmlwdGlvbjogXCJFc3RhZG8gZGVsIHByb2Nlc28gZGUgY2llcnJlIGRlIG1hbmlmaWVzdG9cIixcbiAgfSlcbiAgQEFwaVJlc3BvbnNlKHtcbiAgICBzdGF0dXM6IDQwNCxcbiAgICBkZXNjcmlwdGlvbjogXCJQcm9jZXNvIG5vIGVuY29udHJhZG8gcGFyYSBlbCByZXF1ZXN0SWRcIixcbiAgfSlcbiAgYXN5bmMgZ2V0TWFuaWZlc3RDbG9zZVN0YXR1cyhAUGFyYW0oXCJyZXF1ZXN0SWRcIikgcmVxdWVzdElkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHNTZXJ2aWNlLmdldE1hbmlmZXN0Q2xvc2VTdGF0dXMocmVxdWVzdElkKTtcbiAgfVxuICBcbiAgQFBvc3QoXCJleHBvcnRzL3htbFwiKVxuICBAUm9sZXMoJ2NvdXJpZXJzJylcbiAgQEFwaU9wZXJhdGlvbih7IFxuICAgIHN1bW1hcnk6IFwiRXhwb3J0YXIgZG9jdW1lbnRvcyBhIFhNTCBjb24gZmlsdHJvcyAoYXPDrW5jcm9ubylcIixcbiAgICBkZXNjcmlwdGlvbjogXCJFbnbDrWEgZWwgcHJvY2VzbyBkZSBleHBvcnRhY2nDs24gWE1MIGRpcmVjdGFtZW50ZSBhIGxhIGNvbGEgU1FTLiBFbCBwb2xsaW5nIHByb2Nlc3MgKG1hcmNvcy9taW5pbWlzX3B3ZWJfcG9sbGluZ19wcm9jZXNzKSBjb25zdW1pcsOhIGVsIG1lbnNhamUgeSBsbyBwcm9jZXNhcsOhLiBSZXRvcm5hIHVuIHJlcXVlc3RJZCBwYXJhIGNvbnN1bHRhciBlbCBlc3RhZG8gZW4gRHluYW1vREIuXCJcbiAgfSlcbiAgQEFwaVJlc3BvbnNlKHsgXG4gICAgc3RhdHVzOiAyMDIsIFxuICAgIGRlc2NyaXB0aW9uOiBcIlByb2Nlc28gZGUgZXhwb3J0YWNpw7NuIFhNTCBlbnZpYWRvIGEgbGEgY29sYSBTUVMuIFJldG9ybmEgcmVxdWVzdElkIHBhcmEgY29uc3VsdGFyIGVsIGVzdGFkbyBlbiBEeW5hbW9EQi5cIlxuICB9KVxuICBhc3luYyBleHBvcnREb2N1bWVudHMoXG4gICAgQEJvZHkoKSBmaWx0ZXJzOiBCdXNjYXJEb2N1bWVudG9zRHRvLFxuICAgIEBRdWVyeSgnZmlsZU5hbWUnKSBmaWxlTmFtZT86IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHNTZXJ2aWNlLmV4cG9ydERvY3VtZW50c1NRUyhmaWx0ZXJzLCBmaWxlTmFtZSk7XG4gIH1cblxuICBAR2V0KFwiZXhwb3J0cy94bWwvc3RhdHVzLzpyZXF1ZXN0SWRcIilcbiAgQFJvbGVzKCdjb3VyaWVycycpXG4gIEBBcGlPcGVyYXRpb24oe1xuICAgIHN1bW1hcnk6IFwiQ29uc3VsdGFyIGVzdGFkbyBkZSBleHBvcnRhY2nDs24gWE1MXCIsXG4gICAgZGVzY3JpcHRpb246IFwiQ29uc3VsdGEgZWwgZXN0YWRvIGRlbCBwcm9jZXNvIGRlIGV4cG9ydGFjacOzbiBYTUwgYXPDrW5jcm9ubyB1c2FuZG8gZWwgcmVxdWVzdElkIHJldG9ybmFkbyBhbCBlbnZpYXIgZWwgcHJvY2VzbyBjb24gUE9TVCAvZG9jdW1lbnRzL2V4cG9ydHMveG1sLiBFbCBlc3RhZG8gc2UgY29uc3VsdGEgZGVzZGUgRHluYW1vREIgZG9uZGUgZWwgcG9sbGluZyBwcm9jZXNzIGxvIGFjdHVhbGl6YS5cIixcbiAgfSlcbiAgQEFwaVJlc3BvbnNlKHtcbiAgICBzdGF0dXM6IDIwMCxcbiAgICBkZXNjcmlwdGlvbjogXCJFc3RhZG8gZGVsIHByb2Nlc28gZGUgZXhwb3J0YWNpw7NuIFhNTFwiLFxuICB9KVxuICBAQXBpUmVzcG9uc2Uoe1xuICAgIHN0YXR1czogNDA0LFxuICAgIGRlc2NyaXB0aW9uOiBcIlByb2Nlc28gbm8gZW5jb250cmFkbyBwYXJhIGVsIHJlcXVlc3RJZFwiLFxuICB9KVxuICBhc3luYyBnZXRYbWxFeHBvcnRTdGF0dXMoQFBhcmFtKFwicmVxdWVzdElkXCIpIHJlcXVlc3RJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzU2VydmljZS5nZXRYbWxFeHBvcnRTdGF0dXMocmVxdWVzdElkKTtcbiAgfVxuXG4gIC8vQFBvc3QoXCJjbG9zZS1tYW5pZmVzdFwiKVxuICAvL0BSb2xlcygnY291cmllcnMnKVxuICAvL0BBcGlPcGVyYXRpb24oe1xuICAvLyAgc3VtbWFyeTogXCJDZXJyYXIgbWFuaWZpZXN0byBkZSBmb3JtYSBzw61uY3JvbmEgKHByb2Nlc28gbm9ybWFsKVwiLFxuICAvLyAgZGVzY3JpcHRpb246XG4gIC8vICAgIFwiRWplY3V0YSBlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvIGRlIGZvcm1hIHPDrW5jcm9uYS4gRWwgcHJvY2VzbyBjb21wbGV0byAoMTggcGFzb3MpIHNlIGVqZWN1dGEgaW5tZWRpYXRhbWVudGUgeSByZXRvcm5hIGVsIHJlc3VsdGFkbyBmaW5hbC5cIixcbiAgLy99KVxuICAvL0BBcGlSZXNwb25zZSh7XG4gIC8vICBzdGF0dXM6IDIwMCxcbiAgLy8gIGRlc2NyaXB0aW9uOlxuICAvLyAgICBcIk1hbmlmaWVzdG8gY2VycmFkbyBleGl0b3NhbWVudGUuIFJldG9ybmEgZWwgcmVzdWx0YWRvIGRlbCBwcm9jZXNvIGNvbXBsZXRvLlwiLFxuICAvL30pXG4gIC8vYXN5bmMgY2xvc2VNYW5pZmVzdChAQm9keSgpIHBheWxvYWQ6IENsb3NlTWFuaWZlc3REdG8pIHtcbiAgLy8gIHJldHVybiB0aGlzLmRvY3VtZW50c1NlcnZpY2UuY2xvc2VNYW5pZmVzdFN5bmMocGF5bG9hZCk7XG4gIC8vfVxuXG4gIEBQb3N0KFwiY2xvc2UtbWFuaWZlc3RcIilcbiAgQFJvbGVzKCdjb3VyaWVycycpXG4gIEBBcGlPcGVyYXRpb24oe1xuICAgIHN1bW1hcnk6IFwiQ2VycmFyIG1hbmlmaWVzdG8gZGUgZm9ybWEgYXPDrW5jcm9uYSAoY29sYSBTUVMpXCIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBcIkVudsOtYSBlbCBwcm9jZXNvIGRlIGNpZXJyZSBkZSBtYW5pZmllc3RvIGRpcmVjdGFtZW50ZSBhIGxhIGNvbGEgU1FTLiBFbCBwb2xsaW5nIHByb2Nlc3MgKG1hcmNvcy9taW5pbWlzX3B3ZWJfcG9sbGluZ19wcm9jZXNzKSBjb25zdW1pcsOhIGVsIG1lbnNhamUgeSBsbyBwcm9jZXNhcsOhLiBSZXRvcm5hIHVuIHJlcXVlc3RJZCBwYXJhIGNvbnN1bHRhciBlbCBlc3RhZG8gZW4gRHluYW1vREIuXCIsXG4gIH0pXG4gIEBBcGlSZXNwb25zZSh7XG4gICAgc3RhdHVzOiAyMDIsXG4gICAgZGVzY3JpcHRpb246XG4gICAgICBcIlByb2Nlc28gZGUgY2llcnJlIGVudmlhZG8gYSBsYSBjb2xhIFNRUy4gUmV0b3JuYSByZXF1ZXN0SWQgcGFyYSBjb25zdWx0YXIgZWwgZXN0YWRvIGVuIER5bmFtb0RCLlwiLFxuICB9KVxuICBhc3luYyBjbG9zZU1hbmlmZXN0U1FTKFxuICAgIEBCb2R5KCkgcGF5bG9hZDogQ2xvc2VNYW5pZmVzdER0byxcbiAgICBAUmVxKCkgcmVxOiBSZXF1ZXN0SW50ZXJmYWNlXG4gICkge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50c1NlcnZpY2UuY2xvc2VNYW5pZmVzdFNRUyhwYXlsb2FkLCByZXEpO1xuICB9XG5cbn1cbiJdfQ==