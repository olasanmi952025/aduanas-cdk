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
    constructor(documentsService, sqsProducerService, exportStatusService) {
        this.documentsService = documentsService;
        this.sqsProducerService = sqsProducerService;
        this.exportStatusService = exportStatusService;
        this.defaultUserId = 142;
    }
    async listGuides(filters, request) {
        const { sub } = request.user;
        const userId = sub.split('_').pop() || this.defaultUserId;
        filters.userId = Number(userId);
        return this.documentsService.listGuides(filters, Number(userId));
    }
    async exportToExcel(exportDto, request) {
        const { ...filters } = exportDto;
        const { sub } = request.user;
        const userId = sub.split('_').pop() || this.defaultUserId;
        const result = await this.sqsProducerService.sendExcelExportMessage(filters, Number(userId));
        return {
            success: true,
            message: "Solicitud de exportación excel recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
            requestId: result.requestId,
            messageId: result.messageId,
        };
    }
    async exportToPdf(exportDto, request) {
        const { sub } = request.user;
        const userId = sub.split('_').pop() || this.defaultUserId;
        const result = await this.sqsProducerService.sendPdfExportMessage(exportDto.guideIds, Number(userId));
        return {
            success: true,
            message: "Solicitud de exportación PDF recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
            requestId: result.requestId,
            messageId: result.messageId,
        };
    }
    async getExportStatus(requestId) {
        try {
            const status = await this.exportStatusService.getStatus(requestId);
            if (!status) {
                return {
                    success: false,
                    message: "Export status not found",
                };
            }
            return {
                success: true,
                data: status,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(""),
    (0, roles_decorator_1.Roles)("couriers"),
    (0, swagger_1.ApiOperation)({ summary: "Buscar guias con filtros" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Lista de guias encontrados" }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)())
], DocumentsController.prototype, "listGuides", null);
__decorate([
    (0, common_1.Post)("export/excel"),
    (0, roles_decorator_1.Roles)("couriers"),
    (0, swagger_1.ApiOperation)({ summary: "Exportar guías a Excel (proceso asíncrono)" }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: "Solicitud de exportación excel recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)())
], DocumentsController.prototype, "exportToExcel", null);
__decorate([
    (0, common_1.Post)("export/pdf"),
    (0, roles_decorator_1.Roles)("couriers"),
    (0, swagger_1.ApiOperation)({ summary: "Exportar guías a PDF (proceso asíncrono)" }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: "Solicitud de exportación PDF recibida. Le notificaremos cuando el archivo esté listo para su descarga.",
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: "Debe proporcionar entre 1 y 20 IDs de guías.",
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)())
], DocumentsController.prototype, "exportToPdf", null);
__decorate([
    (0, common_1.Get)("export-status/:requestId"),
    (0, roles_decorator_1.Roles)("couriers"),
    (0, swagger_1.ApiOperation)({
        summary: "Obtiene el estado de una exportación por requestId",
    }),
    (0, swagger_1.ApiParam)({ name: "requestId", description: "ID de la solicitud de exportación" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Estado de la exportación" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Estado de exportación no encontrado" }),
    __param(0, (0, common_1.Param)("requestId"))
], DocumentsController.prototype, "getExportStatus", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)("Guides"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("guides")
], DocumentsController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRvcy5jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jdW1lbnRvcy5jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQVN3QjtBQUN4Qiw2Q0FNeUI7QUFFekIsZ0VBQW1EO0FBVzVDLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO0lBRzlCLFlBQ21CLGdCQUFrQyxFQUNsQyxrQkFBc0MsRUFDdEMsbUJBQXdDO1FBRnhDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtRQUN0Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1FBTDFDLGtCQUFhLEdBQUcsR0FBRyxDQUFDO0lBTWxDLENBQUM7SUFNRSxBQUFOLEtBQUssQ0FBQyxVQUFVLENBQVUsT0FBd0IsRUFBYSxPQUF5QjtRQUN0RixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUM3QixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDMUQsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBVUssQUFBTixLQUFLLENBQUMsYUFBYSxDQUNULFNBQXlCLEVBQ3RCLE9BQXlCO1FBRXBDLE1BQU0sRUFBRSxHQUFHLE9BQU8sRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUVqQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUM3QixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMs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QUUsT0FBTyxFQUFFLDBDQUEwQyxFQUFFLENBQUM7SUFDckUsSUFBQSxxQkFBVyxFQUFDO1FBQ1gsTUFBTSxFQUFFLEdBQUc7UUFDWCxXQUFXLEVBQ1Qsd0dBQXdHO0tBQzNHLENBQUM7SUFDRCxJQUFBLHFCQUFXLEVBQUM7UUFDWCxNQUFNLEVBQUUsR0FBRztRQUNYLFdBQVcsRUFBRSw4Q0FBOEM7S0FDNUQsQ0FBQztJQUVDLFdBQUEsSUFBQSxhQUFJLEdBQUUsQ0FBQTtJQUNOLFdBQUEsSUFBQSxnQkFBTyxHQUFFLENBQUE7c0RBaUJYO0FBVUs7SUFSTCxJQUFBLFlBQUcsRUFBQywwQkFBMEIsQ0FBQztJQUMvQixJQUFBLHVCQUFLLEVBQUMsVUFBVSxDQUFDO0lBQ2pCLElBQUEsc0JBQVksRUFBQztRQUNaLE9BQU8sRUFBRSxvREFBb0Q7S0FDOUQsQ0FBQztJQUNELElBQUEsa0JBQVEsRUFBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLG1DQUFtQyxFQUFFLENBQUM7SUFDakYsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQztJQUNyRSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxxQ0FBcUMsRUFBRSxDQUFDO0lBQzFELFdBQUEsSUFBQSxjQUFLLEVBQUMsV0FBVyxDQUFDLENBQUE7MERBcUJ4Qzs4QkFqSFUsbUJBQW1CO0lBSC9CLElBQUEsaUJBQU8sRUFBQyxRQUFRLENBQUM7SUFDakIsSUFBQSx1QkFBYSxHQUFFO0lBQ2YsSUFBQSxtQkFBVSxFQUFDLFFBQVEsQ0FBQztHQUNSLG1CQUFtQixDQWtIL0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIENvbnRyb2xsZXIsXHJcbiAgR2V0LFxyXG4gIFBvc3QsXHJcbiAgQm9keSxcclxuICBQYXJhbSxcclxuICBRdWVyeSxcclxuICBSZXF1ZXN0LFxyXG4gIEhlYWRlcixcclxufSBmcm9tIFwiQG5lc3Rqcy9jb21tb25cIjtcclxuaW1wb3J0IHtcclxuICBBcGlUYWdzLFxyXG4gIEFwaU9wZXJhdGlvbixcclxuICBBcGlSZXNwb25zZSxcclxuICBBcGlCZWFyZXJBdXRoLFxyXG4gIEFwaVBhcmFtLFxyXG59IGZyb20gXCJAbmVzdGpzL3N3YWdnZXJcIjtcclxuaW1wb3J0IHsgU1FTUHJvZHVjZXJTZXJ2aWNlIH0gZnJvbSBcIi4uL3Nxc1wiO1xyXG5pbXBvcnQgeyBSb2xlcyB9IGZyb20gXCIuLi8uLi9hdXRoL3JvbGVzLmRlY29yYXRvclwiO1xyXG5pbXBvcnQgeyBEb2N1bWVudHNTZXJ2aWNlIH0gZnJvbSBcIi4vZG9jdW1lbnRvcy5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IEV4cG9ydEV4Y2VsRHRvIH0gZnJvbSBcIi4vZHRvL2V4cG9ydC1leGNlbC5kdG9cIjtcclxuaW1wb3J0IHsgRXhwb3J0UGRmRHRvIH0gZnJvbSBcIi4vZHRvL2V4cG9ydC1wZGYuZHRvXCI7XHJcbmltcG9ydCB7IEd1aWRlRmlsdGVyc0R0byB9IGZyb20gXCIuL2R0by9ndWlkZS1maWx0ZXJzLmR0b1wiO1xyXG5pbXBvcnQgeyBSZXF1ZXN0SW50ZXJmYWNlIH0gZnJvbSBcIi4vaW50ZXJmYWNlcy9yZXF1ZXN0LmludGVyZmFjZVwiO1xyXG5pbXBvcnQgeyBFeHBvcnRTdGF0dXNTZXJ2aWNlIH0gZnJvbSBcIi4uL2V4cG9ydC1zdGF0dXNcIjtcclxuXHJcbkBBcGlUYWdzKFwiR3VpZGVzXCIpXHJcbkBBcGlCZWFyZXJBdXRoKClcclxuQENvbnRyb2xsZXIoXCJndWlkZXNcIilcclxuZXhwb3J0IGNsYXNzIERvY3VtZW50c0NvbnRyb2xsZXIge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdFVzZXJJZCA9IDE0MjtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50c1NlcnZpY2U6IERvY3VtZW50c1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNxc1Byb2R1Y2VyU2VydmljZTogU1FTUHJvZHVjZXJTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTdGF0dXNTZXJ2aWNlOiBFeHBvcnRTdGF0dXNTZXJ2aWNlLFxyXG4gICkge31cclxuXHJcbiAgQEdldChcIlwiKVxyXG4gIEBSb2xlcyhcImNvdXJpZXJzXCIpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6IFwiQnVzY2FyIGd1aWFzIGNvbiBmaWx0cm9zXCIgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246IFwiTGlzdGEgZGUgZ3VpYXMgZW5jb250cmFkb3NcIiB9KVxyXG4gIGFzeW5jIGxpc3RHdWlkZXMoQFF1ZXJ5KCkgZmlsdGVyczogR3VpZGVGaWx0ZXJzRHRvLCBAUmVxdWVzdCgpIHJlcXVlc3Q6IFJlcXVlc3RJbnRlcmZhY2UpIHtcclxuICAgIGNvbnN0IHsgc3ViIH0gPSByZXF1ZXN0LnVzZXI7XHJcbiAgICBjb25zdCB1c2VySWQgPSBzdWIuc3BsaXQoJ18nKS5wb3AoKSB8fCB0aGlzLmRlZmF1bHRVc2VySWQ7XHJcbiAgICBmaWx0ZXJzLnVzZXJJZCA9IE51bWJlcih1c2VySWQpO1xyXG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzU2VydmljZS5saXN0R3VpZGVzKGZpbHRlcnMsIE51bWJlcih1c2VySWQpKTtcclxuICB9XHJcblxyXG4gIEBQb3N0KFwiZXhwb3J0L2V4Y2VsXCIpXHJcbiAgQFJvbGVzKFwiY291cmllcnNcIilcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogXCJFeHBvcnRhciBndcOtYXMgYSBFeGNlbCAocHJvY2VzbyBhc8OtbmNyb25vKVwiIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHtcclxuICAgIHN0YXR1czogMjAyLFxyXG4gICAgZGVzY3JpcHRpb246XHJcbiAgICAgIFwiU29saWNpdHVkIGRlIGV4cG9ydGFjacOzbiBleGNlbCByZWNpYmlkYS4gTGUgbm90aWZpY2FyZW1vcyBjdWFuZG8gZWwgYXJjaGl2byBlc3TDqSBsaXN0byBwYXJhIHN1IGRlc2NhcmdhLlwiLFxyXG4gIH0pXHJcbiAgYXN5bmMgZXhwb3J0VG9FeGNlbChcclxuICAgIEBCb2R5KCkgZXhwb3J0RHRvOiBFeHBvcnRFeGNlbER0byxcclxuICAgIEBSZXF1ZXN0KCkgcmVxdWVzdDogUmVxdWVzdEludGVyZmFjZVxyXG4gICkge1xyXG4gICAgY29uc3QgeyAuLi5maWx0ZXJzIH0gPSBleHBvcnREdG87XHJcblxyXG4gICAgY29uc3QgeyBzdWIgfSA9IHJlcXVlc3QudXNlcjtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHN1Yi5zcGxpdCgnXycpLnBvcCgpIHx8IHRoaXMuZGVmYXVsdFVzZXJJZDtcclxuXHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNxc1Byb2R1Y2VyU2VydmljZS5zZW5kRXhjZWxFeHBvcnRNZXNzYWdlKFxyXG4gICAgICBmaWx0ZXJzLFxyXG4gICAgICBOdW1iZXIodXNlcklkKVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOlxyXG4gICAgICAgIFwiU29saWNpdHVkIGRlIGV4cG9ydGFjacOzbiBleGNlbCByZWNpYmlkYS4gTGUgbm90aWZpY2FyZW1vcyBjdWFuZG8gZWwgYXJjaGl2byBlc3TDqSBsaXN0byBwYXJhIHN1IGRlc2NhcmdhLlwiLFxyXG4gICAgICByZXF1ZXN0SWQ6IHJlc3VsdC5yZXF1ZXN0SWQsXHJcbiAgICAgIG1lc3NhZ2VJZDogcmVzdWx0Lm1lc3NhZ2VJZCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBAUG9zdChcImV4cG9ydC9wZGZcIilcclxuICBAUm9sZXMoXCJjb3VyaWVyc1wiKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiBcIkV4cG9ydGFyIGd1w61hcyBhIFBERiAocHJvY2VzbyBhc8OtbmNyb25vKVwiIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHtcclxuICAgIHN0YXR1czogMjAyLFxyXG4gICAgZGVzY3JpcHRpb246XHJcbiAgICAgIFwiU29saWNpdHVkIGRlIGV4cG9ydGFjacOzbiBQREYgcmVjaWJpZGEuIExlIG5vdGlmaWNhcmVtb3MgY3VhbmRvIGVsIGFyY2hpdm8gZXN0w6kgbGlzdG8gcGFyYSBzdSBkZXNjYXJnYS5cIixcclxuICB9KVxyXG4gIEBBcGlSZXNwb25zZSh7XHJcbiAgICBzdGF0dXM6IDQwMCxcclxuICAgIGRlc2NyaXB0aW9uOiBcIkRlYmUgcHJvcG9yY2lvbmFyIGVudHJlIDEgeSAyMCBJRHMgZGUgZ3XDrWFzLlwiLFxyXG4gIH0pXHJcbiAgYXN5bmMgZXhwb3J0VG9QZGYoXHJcbiAgICBAQm9keSgpIGV4cG9ydER0bzogRXhwb3J0UGRmRHRvLFxyXG4gICAgQFJlcXVlc3QoKSByZXF1ZXN0OiBSZXF1ZXN0SW50ZXJmYWNlXHJcbiAgKSB7XHJcbiAgICBjb25zdCB7IHN1YiB9ID0gcmVxdWVzdC51c2VyO1xyXG4gICAgY29uc3QgdXNlcklkID0gc3ViLnNwbGl0KCdfJykucG9wKCkgfHwgdGhpcy5kZWZhdWx0VXNlcklkO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3FzUHJvZHVjZXJTZXJ2aWNlLnNlbmRQZGZFeHBvcnRNZXNzYWdlKFxyXG4gICAgICBleHBvcnREdG8uZ3VpZGVJZHMsXHJcbiAgICAgIE51bWJlcih1c2VySWQpXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgXCJTb2xpY2l0dWQgZGUgZXhwb3J0YWNpw7NuIFBERiByZWNpYmlkYS4gTGUgbm90aWZpY2FyZW1vcyBjdWFuZG8gZWwgYXJjaGl2byBlc3TDqSBsaXN0byBwYXJhIHN1IGRlc2NhcmdhLlwiLFxyXG4gICAgICByZXF1ZXN0SWQ6IHJlc3VsdC5yZXF1ZXN0SWQsXHJcbiAgICAgIG1lc3NhZ2VJZDogcmVzdWx0Lm1lc3NhZ2VJZCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBAR2V0KFwiZXhwb3J0LXN0YXR1cy86cmVxdWVzdElkXCIpXHJcbiAgQFJvbGVzKFwiY291cmllcnNcIilcclxuICBAQXBpT3BlcmF0aW9uKHtcclxuICAgIHN1bW1hcnk6IFwiT2J0aWVuZSBlbCBlc3RhZG8gZGUgdW5hIGV4cG9ydGFjacOzbiBwb3IgcmVxdWVzdElkXCIsXHJcbiAgfSlcclxuICBAQXBpUGFyYW0oeyBuYW1lOiBcInJlcXVlc3RJZFwiLCBkZXNjcmlwdGlvbjogXCJJRCBkZSBsYSBzb2xpY2l0dWQgZGUgZXhwb3J0YWNpw7NuXCIgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246IFwiRXN0YWRvIGRlIGxhIGV4cG9ydGFjacOzblwiIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiA0MDQsIGRlc2NyaXB0aW9uOiBcIkVzdGFkbyBkZSBleHBvcnRhY2nDs24gbm8gZW5jb250cmFkb1wiIH0pXHJcbiAgYXN5bmMgZ2V0RXhwb3J0U3RhdHVzKEBQYXJhbShcInJlcXVlc3RJZFwiKSByZXF1ZXN0SWQ6IHN0cmluZykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLmdldFN0YXR1cyhyZXF1ZXN0SWQpO1xyXG5cclxuICAgICAgaWYgKCFzdGF0dXMpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIkV4cG9ydCBzdGF0dXMgbm90IGZvdW5kXCIsXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIGRhdGE6IHN0YXR1cyxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19