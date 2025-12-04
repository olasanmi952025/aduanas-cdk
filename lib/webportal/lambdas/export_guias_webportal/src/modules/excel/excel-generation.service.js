"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ExcelGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelGenerationService = void 0;
const common_1 = require("@nestjs/common");
const guide_filters_dto_1 = require("../documentos/dto/guide-filters.dto");
const ExcelJS = __importStar(require("exceljs"));
let ExcelGenerationService = ExcelGenerationService_1 = class ExcelGenerationService {
    constructor(s3Service, configService, documentsQueryService) {
        this.s3Service = s3Service;
        this.configService = configService;
        this.documentsQueryService = documentsQueryService;
        this.logger = new common_1.Logger(ExcelGenerationService_1.name);
    }
    async generateExcel(filters, requestId, fileName, userId) {
        this.logger.log(`Generating Excel for requestId: ${requestId}`);
        try {
            const guideFilters = this.convertToGuideFiltersDto(filters);
            const guides = await this.documentsQueryService.listGuides(guideFilters, userId);
            this.logger.log(`Total guides to export: ${guides.length}`);
            const buffer = await this.createExcelBuffer(guides);
            const finalFileName = fileName || `guias_export_${requestId}_${Date.now()}.xlsx`;
            const s3Key = `exports/excels/${finalFileName}`;
            const s3Url = await this.s3Service.uploadFile({
                buffer,
                key: s3Key,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            this.logger.log(`Excel generated and uploaded to S3: ${s3Url}`);
            return {
                filePath: finalFileName,
                s3Key,
                s3Url,
            };
        }
        catch (error) {
            this.logger.error(`Error generating Excel: ${error.message}`, error.stack);
            throw error;
        }
    }
    convertToGuideFiltersDto(filters) {
        const dto = new guide_filters_dto_1.GuideFiltersDto();
        if (filters.page !== undefined)
            dto.page = Number(filters.page);
        if (filters.limit !== undefined)
            dto.limit = Number(filters.limit);
        if (filters.sort)
            dto.sort = String(filters.sort);
        if (filters.order)
            dto.order = String(filters.order);
        if (filters.from)
            dto.from = filters.from instanceof Date ? filters.from : new Date(filters.from);
        if (filters.to)
            dto.to = filters.to instanceof Date ? filters.to : new Date(filters.to);
        if (filters.dateType)
            dto.dateType = String(filters.dateType);
        if (filters.guideNumber)
            dto.guideNumber = String(filters.guideNumber);
        if (filters.manifestNumber)
            dto.manifestNumber = String(filters.manifestNumber);
        if (filters.status)
            dto.status = String(filters.status);
        if (filters.locationType)
            dto.locationType = String(filters.locationType);
        if (filters.location)
            dto.location = String(filters.location);
        if (filters.participantType)
            dto.participantType = String(filters.participantType);
        if (filters.participant)
            dto.participant = String(filters.participant);
        if (filters.isSimplified !== undefined)
            dto.isSimplified = Boolean(filters.isSimplified);
        if (filters.marcas)
            dto.marcas = String(filters.marcas);
        if (filters.faltanteSobrante)
            dto.faltanteSobrante = String(filters.faltanteSobrante);
        if (filters.operationType)
            dto.operationType = String(filters.operationType);
        return dto;
    }
    async createExcelBuffer(guides) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Guias');
        worksheet.columns = [
            { header: 'Número Guía', key: 'numeroExterno', width: 20 },
            { header: 'Número Aceptación', key: 'numeroAceptacion', width: 20 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Fecha Aceptación', key: 'fechaAceptacion', width: 15 },
            { header: 'Fecha Emisión', key: 'fechaEmision', width: 15 },
            { header: 'Fecha Arribo', key: 'fechaArribo', width: 15 },
            { header: 'Fecha Conformación', key: 'fechaConformacion', width: 15 },
            { header: 'Consignatario', key: 'nombreParticipante', width: 30 },
            { header: 'Total Peso', key: 'totalPeso', width: 15 },
            { header: 'Cant. Total', key: 'totalItem', width: 12 },
            { header: 'Motivo Marca', key: 'motivoSeleccion', width: 20 },
            { header: 'Resultado Selección', key: 'resultadoSeleccion', width: 20 },
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Falta', key: 'falta', width: 10 },
            { header: 'Sobra', key: 'sobra', width: 10 },
            { header: 'Nro DIPS', key: 'numeroDips', width: 15 },
            { header: 'Fecha DIPS', key: 'fechaDips', width: 15 },
            { header: 'Tiene DIN', key: 'esDin', width: 10 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        guides.forEach((guide) => {
            worksheet.addRow({
                numeroExterno: guide.NUMEROEXTERNO || guide.numeroExterno || '',
                numeroAceptacion: guide.NUMEROACEPTACION || guide.numeroAceptacion || '',
                estado: guide.ESTADO || guide.estado || '',
                fechaAceptacion: guide.FECHAACEPTACION || guide.fechaAceptacion || '',
                fechaEmision: guide.FECHAEMISION || guide.fechaEmision || '',
                fechaArribo: guide.FECHAARRIBO || guide.fechaArribo || '',
                fechaConformacion: guide.FECHACONFORMACION || guide.fechaConformacion || '',
                nombreParticipante: guide.NOMBREPARTICIPANTE || guide.nombreParticipante || '',
                totalPeso: guide.TOTALPESO || guide.totalPeso || '',
                totalItem: guide.TOTALITEM || guide.totalItem || 0,
                motivoSeleccion: guide.MOTIVOSELECCION || guide.motivoSeleccion || '',
                resultadoSeleccion: guide.RESULTADOSELECCION || guide.resultadoSeleccion || '',
                id: guide.ID || guide.id || '',
                falta: guide.FALTA || guide.falta || 'No',
                sobra: guide.SOBRA || guide.sobra || 'No',
                fechaDips: guide.FECHADIPS || guide.fechaDips || '',
                numeroDips: guide.NUMERODIPS || guide.numeroDips || '',
                esDin: guide.ESDIN || guide.esDin || 'No',
            });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExcelGenerationService = ExcelGenerationService;
exports.ExcelGenerationService = ExcelGenerationService = ExcelGenerationService_1 = __decorate([
    (0, common_1.Injectable)()
], ExcelGenerationService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjZWwtZ2VuZXJhdGlvbi5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhjZWwtZ2VuZXJhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFJcEQsMkVBQXNFO0FBQ3RFLGlEQUFtQztBQUc1QixJQUFNLHNCQUFzQiw4QkFBNUIsTUFBTSxzQkFBc0I7SUFHakMsWUFDbUIsU0FBb0IsRUFDcEIsYUFBNEIsRUFDNUIscUJBQTRDO1FBRjVDLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFDNUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtRQUw5QyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsd0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFNL0QsQ0FBQztJQUVKLEtBQUssQ0FBQyxhQUFhLENBQ2pCLE9BQTRCLEVBQzVCLFNBQWlCLEVBQ2pCLFFBQWlCLEVBQ2pCLE1BQWU7UUFFZixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUVoRSxJQUFJLENBQUM7WUFDSCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVqRixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFNUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFcEQsTUFBTSxhQUFhLEdBQUcsUUFBUSxJQUFJLGdC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QUM7Q0FDRixDQUFBO0FBbElZLHdEQUFzQjtpQ0FBdEIsc0JBQXNCO0lBRGxDLElBQUEsbUJBQVUsR0FBRTtHQUNBLHNCQUFzQixDQWtJbEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IFMzU2VydmljZSB9IGZyb20gJy4uL3MzJztcclxuaW1wb3J0IHsgRG9jdW1lbnRzUXVlcnlTZXJ2aWNlIH0gZnJvbSAnLi4vZG9jdW1lbnRvcy9kb2N1bWVudHMtcXVlcnkuc2VydmljZSc7XHJcbmltcG9ydCB7IEd1aWRlRmlsdGVyc0R0byB9IGZyb20gJy4uL2RvY3VtZW50b3MvZHRvL2d1aWRlLWZpbHRlcnMuZHRvJztcclxuaW1wb3J0ICogYXMgRXhjZWxKUyBmcm9tICdleGNlbGpzJztcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIEV4Y2VsR2VuZXJhdGlvblNlcnZpY2Uge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihFeGNlbEdlbmVyYXRpb25TZXJ2aWNlLm5hbWUpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgczNTZXJ2aWNlOiBTM1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRvY3VtZW50c1F1ZXJ5U2VydmljZTogRG9jdW1lbnRzUXVlcnlTZXJ2aWNlLFxyXG4gICkge31cclxuXHJcbiAgYXN5bmMgZ2VuZXJhdGVFeGNlbChcclxuICAgIGZpbHRlcnM6IFJlY29yZDxzdHJpbmcsIGFueT4sXHJcbiAgICByZXF1ZXN0SWQ6IHN0cmluZyxcclxuICAgIGZpbGVOYW1lPzogc3RyaW5nLFxyXG4gICAgdXNlcklkPzogbnVtYmVyLFxyXG4gICk6IFByb21pc2U8eyBmaWxlUGF0aDogc3RyaW5nOyBzM0tleTogc3RyaW5nOyBzM1VybDogc3RyaW5nIH0+IHtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgR2VuZXJhdGluZyBFeGNlbCBmb3IgcmVxdWVzdElkOiAke3JlcXVlc3RJZH1gKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBndWlkZUZpbHRlcnMgPSB0aGlzLmNvbnZlcnRUb0d1aWRlRmlsdGVyc0R0byhmaWx0ZXJzKTtcclxuICAgICAgY29uc3QgZ3VpZGVzID0gYXdhaXQgdGhpcy5kb2N1bWVudHNRdWVyeVNlcnZpY2UubGlzdEd1aWRlcyhndWlkZUZpbHRlcnMsIHVzZXJJZCk7XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFRvdGFsIGd1aWRlcyB0byBleHBvcnQ6ICR7Z3VpZGVzLmxlbmd0aH1gKTtcclxuXHJcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuY3JlYXRlRXhjZWxCdWZmZXIoZ3VpZGVzKTtcclxuXHJcbiAgICAgIGNvbnN0IGZpbmFsRmlsZU5hbWUgPSBmaWxlTmFtZSB8fCBgZ3VpYXNfZXhwb3J0XyR7cmVxdWVzdElkfV8ke0RhdGUubm93KCl9Lnhsc3hgO1xyXG4gICAgICBjb25zdCBzM0tleSA9IGBleHBvcnRzL2V4Y2Vscy8ke2ZpbmFsRmlsZU5hbWV9YDtcclxuXHJcbiAgICAgIGNvbnN0IHMzVXJsID0gYXdhaXQgdGhpcy5zM1NlcnZpY2UudXBsb2FkRmlsZSh7XHJcbiAgICAgICAgYnVmZmVyLFxyXG4gICAgICAgIGtleTogczNLZXksXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCcsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBFeGNlbCBnZW5lcmF0ZWQgYW5kIHVwbG9hZGVkIHRvIFMzOiAke3MzVXJsfWApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBmaWxlUGF0aDogZmluYWxGaWxlTmFtZSxcclxuICAgICAgICBzM0tleSxcclxuICAgICAgICBzM1VybCxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIGdlbmVyYXRpbmcgRXhjZWw6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjb252ZXJ0VG9HdWlkZUZpbHRlcnNEdG8oZmlsdGVyczogUmVjb3JkPHN0cmluZywgYW55Pik6IEd1aWRlRmlsdGVyc0R0byB7XHJcbiAgICBjb25zdCBkdG8gPSBuZXcgR3VpZGVGaWx0ZXJzRHRvKCk7XHJcbiAgICBcclxuICAgIGlmIChmaWx0ZXJzLnBhZ2UgIT09IHVuZGVmaW5lZCkgZHRvLnBhZ2UgPSBOdW1iZXIoZmlsdGVycy5wYWdlKTtcclxuICAgIGlmIChmaWx0ZXJzLmxpbWl0ICE9PSB1bmRlZmluZWQpIGR0by5saW1pdCA9IE51bWJlcihmaWx0ZXJzLmxpbWl0KTtcclxuICAgIGlmIChmaWx0ZXJzLnNvcnQpIGR0by5zb3J0ID0gU3RyaW5nKGZpbHRlcnMuc29ydCk7XHJcbiAgICBpZiAoZmlsdGVycy5vcmRlcikgZHRvLm9yZGVyID0gU3RyaW5nKGZpbHRlcnMub3JkZXIpO1xyXG4gICAgaWYgKGZpbHRlcnMuZnJvbSkgZHRvLmZyb20gPSBmaWx0ZXJzLmZyb20gaW5zdGFuY2VvZiBEYXRlID8gZmlsdGVycy5mcm9tIDogbmV3IERhdGUoZmlsdGVycy5mcm9tKTtcclxuICAgIGlmIChmaWx0ZXJzLnRvKSBkdG8udG8gPSBmaWx0ZXJzLnRvIGluc3RhbmNlb2YgRGF0ZSA/IGZpbHRlcnMudG8gOiBuZXcgRGF0ZShmaWx0ZXJzLnRvKTtcclxuICAgIGlmIChmaWx0ZXJzLmRhdGVUeXBlKSBkdG8uZGF0ZVR5cGUgPSBTdHJpbmcoZmlsdGVycy5kYXRlVHlwZSk7XHJcbiAgICBpZiAoZmlsdGVycy5ndWlkZU51bWJlcikgZHRvLmd1aWRlTnVtYmVyID0gU3RyaW5nKGZpbHRlcnMuZ3VpZGVOdW1iZXIpO1xyXG4gICAgaWYgKGZpbHRlcnMubWFuaWZlc3ROdW1iZXIpIGR0by5tYW5pZmVzdE51bWJlciA9IFN0cmluZyhmaWx0ZXJzLm1hbmlmZXN0TnVtYmVyKTtcclxuICAgIGlmIChmaWx0ZXJzLnN0YXR1cykgZHRvLnN0YXR1cyA9IFN0cmluZyhmaWx0ZXJzLnN0YXR1cyk7XHJcbiAgICBpZiAoZmlsdGVycy5sb2NhdGlvblR5cGUpIGR0by5sb2NhdGlvblR5cGUgPSBTdHJpbmcoZmlsdGVycy5sb2NhdGlvblR5cGUpO1xyXG4gICAgaWYgKGZpbHRlcnMubG9jYXRpb24pIGR0by5sb2NhdGlvbiA9IFN0cmluZyhmaWx0ZXJzLmxvY2F0aW9uKTtcclxuICAgIGlmIChmaWx0ZXJzLnBhcnRpY2lwYW50VHlwZSkgZHRvLnBhcnRpY2lwYW50VHlwZSA9IFN0cmluZyhmaWx0ZXJzLnBhcnRpY2lwYW50VHlwZSk7XHJcbiAgICBpZiAoZmlsdGVycy5wYXJ0aWNpcGFudCkgZHRvLnBhcnRpY2lwYW50ID0gU3RyaW5nKGZpbHRlcnMucGFydGljaXBhbnQpO1xyXG4gICAgaWYgKGZpbHRlcnMuaXNTaW1wbGlmaWVkICE9PSB1bmRlZmluZWQpIGR0by5pc1NpbXBsaWZpZWQgPSBCb29sZWFuKGZpbHRlcnMuaXNTaW1wbGlmaWVkKTtcclxuICAgIGlmIChmaWx0ZXJzLm1hcmNhcykgZHRvLm1hcmNhcyA9IFN0cmluZyhmaWx0ZXJzLm1hcmNhcyk7XHJcbiAgICBpZiAoZmlsdGVycy5mYWx0YW50ZVNvYnJhbnRlKSBkdG8uZmFsdGFudGVTb2JyYW50ZSA9IFN0cmluZyhmaWx0ZXJzLmZhbHRhbnRlU29icmFudGUpO1xyXG4gICAgaWYgKGZpbHRlcnMub3BlcmF0aW9uVHlwZSkgZHRvLm9wZXJhdGlvblR5cGUgPSBTdHJpbmcoZmlsdGVycy5vcGVyYXRpb25UeXBlKTtcclxuXHJcbiAgICByZXR1cm4gZHRvO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVFeGNlbEJ1ZmZlcihndWlkZXM6IGFueVtdKTogUHJvbWlzZTxCdWZmZXI+IHtcclxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKTtcclxuICAgIGNvbnN0IHdvcmtzaGVldCA9IHdvcmtib29rLmFkZFdvcmtzaGVldCgnR3VpYXMnKTtcclxuXHJcbiAgICB3b3Jrc2hlZXQuY29sdW1ucyA9IFtcclxuICAgICAgeyBoZWFkZXI6ICdOw7ptZXJvIEd1w61hJywga2V5OiAnbnVtZXJvRXh0ZXJubycsIHdpZHRoOiAyMCB9LFxyXG4gICAgICB7IGhlYWRlcjogJ07Dum1lcm8gQWNlcHRhY2nDs24nLCBrZXk6ICdudW1lcm9BY2VwdGFjaW9uJywgd2lkdGg6IDIwIH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnRXN0YWRvJywga2V5OiAnZXN0YWRvJywgd2lkdGg6IDE1IH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnRmVjaGEgQWNlcHRhY2nDs24nLCBrZXk6ICdmZWNoYUFjZXB0YWNpb24nLCB3aWR0aDogMTUgfSxcclxuICAgICAgeyBoZWFkZXI6ICdGZWNoYSBFbWlzacOzbicsIGtleTogJ2ZlY2hhRW1pc2lvbicsIHdpZHRoOiAxNSB9LFxyXG4gICAgICB7IGhlYWRlcjogJ0ZlY2hhIEFycmlibycsIGtleTogJ2ZlY2hhQXJyaWJvJywgd2lkdGg6IDE1IH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnRmVjaGEgQ29uZm9ybWFjacOzbicsIGtleTogJ2ZlY2hhQ29uZm9ybWFjaW9uJywgd2lkdGg6IDE1IH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnQ29uc2lnbmF0YXJpbycsIGtleTogJ25vbWJyZVBhcnRpY2lwYW50ZScsIHdpZHRoOiAzMCB9LFxyXG4gICAgICB7IGhlYWRlcjogJ1RvdGFsIFBlc28nLCBrZXk6ICd0b3RhbFBlc28nLCB3aWR0aDogMTUgfSxcclxuICAgICAgeyBoZWFkZXI6ICdDYW50LiBUb3RhbCcsIGtleTogJ3RvdGFsSXRlbScsIHdpZHRoOiAxMiB9LFxyXG4gICAgICB7IGhlYWRlcjogJ01vdGl2byBNYXJjYScsIGtleTogJ21vdGl2b1NlbGVjY2lvbicsIHdpZHRoOiAyMCB9LFxyXG4gICAgICB7IGhlYWRlcjogJ1Jlc3VsdGFkbyBTZWxlY2Npw7NuJywga2V5OiAncmVzdWx0YWRvU2VsZWNjaW9uJywgd2lkdGg6IDIwIH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnSUQnLCBrZXk6ICdpZCcsIHdpZHRoOiAxNSB9LFxyXG4gICAgICB7IGhlYWRlcjogJ0ZhbHRhJywga2V5OiAnZmFsdGEnLCB3aWR0aDogMTAgfSxcclxuICAgICAgeyBoZWFkZXI6ICdTb2JyYScsIGtleTogJ3NvYnJhJywgd2lkdGg6IDEwIH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnTnJvIERJUFMnLCBrZXk6ICdudW1lcm9EaXBzJywgd2lkdGg6IDE1IH0sXHJcbiAgICAgIHsgaGVhZGVyOiAnRmVjaGEgRElQUycsIGtleTogJ2ZlY2hhRGlwcycsIHdpZHRoOiAxNSB9LFxyXG4gICAgICB7IGhlYWRlcjogJ1RpZW5lIERJTicsIGtleTogJ2VzRGluJywgd2lkdGg6IDEwIH0sXHJcbiAgICBdO1xyXG5cclxuICAgIHdvcmtzaGVldC5nZXRSb3coMSkuZm9udCA9IHsgYm9sZDogdHJ1ZSB9O1xyXG4gICAgd29ya3NoZWV0LmdldFJvdygxKS5maWxsID0ge1xyXG4gICAgICB0eXBlOiAncGF0dGVybicsXHJcbiAgICAgIHBhdHRlcm46ICdzb2xpZCcsXHJcbiAgICAgIGZnQ29sb3I6IHsgYXJnYjogJ0ZGRTBFMEUwJyB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBndWlkZXMuZm9yRWFjaCgoZ3VpZGUpID0+IHtcclxuICAgICAgd29ya3NoZWV0LmFkZFJvdyh7XHJcbiAgICAgICAgbnVtZXJvRXh0ZXJubzogZ3VpZGUuTlVNRVJPRVhURVJOTyB8fCBndWlkZS5udW1lcm9FeHRlcm5vIHx8ICcnLFxyXG4gICAgICAgIG51bWVyb0FjZXB0YWNpb246IGd1aWRlLk5VTUVST0FDRVBUQUNJT04gfHwgZ3VpZGUubnVtZXJvQWNlcHRhY2lvbiB8fCAnJyxcclxuICAgICAgICBlc3RhZG86IGd1aWRlLkVTVEFETyB8fCBndWlkZS5lc3RhZG8gfHwgJycsXHJcbiAgICAgICAgZmVjaGFBY2VwdGFjaW9uOiBndWlkZS5GRUNIQUFDRVBUQUNJT04gfHwgZ3VpZGUuZmVjaGFBY2VwdGFjaW9uIHx8ICcnLFxyXG4gICAgICAgIGZlY2hhRW1pc2lvbjogZ3VpZGUuRkVDSEFFTUlTSU9OIHx8IGd1aWRlLmZlY2hhRW1pc2lvbiB8fCAnJyxcclxuICAgICAgICBmZWNoYUFycmlibzogZ3VpZGUuRkVDSEFBUlJJQk8gfHwgZ3VpZGUuZmVjaGFBcnJpYm8gfHwgJycsXHJcbiAgICAgICAgZmVjaGFDb25mb3JtYWNpb246IGd1aWRlLkZFQ0hBQ09ORk9STUFDSU9OIHx8IGd1aWRlLmZlY2hhQ29uZm9ybWFjaW9uIHx8ICcnLFxyXG4gICAgICAgIG5vbWJyZVBhcnRpY2lwYW50ZTogZ3VpZGUuTk9NQlJFUEFSVElDSVBBTlRFIHx8IGd1aWRlLm5vbWJyZVBhcnRpY2lwYW50ZSB8fCAnJyxcclxuICAgICAgICB0b3RhbFBlc286IGd1aWRlLlRPVEFMUEVTTyB8fCBndWlkZS50b3RhbFBlc28gfHwgJycsXHJcbiAgICAgICAgdG90YWxJdGVtOiBndWlkZS5UT1RBTElURU0gfHwgZ3VpZGUudG90YWxJdGVtIHx8IDAsXHJcbiAgICAgICAgbW90aXZvU2VsZWNjaW9uOiBndWlkZS5NT1RJVk9TRUxFQ0NJT04gfHwgZ3VpZGUubW90aXZvU2VsZWNjaW9uIHx8ICcnLFxyXG4gICAgICAgIHJlc3VsdGFkb1NlbGVjY2lvbjogZ3VpZGUuUkVTVUxUQURPU0VMRUNDSU9OIHx8IGd1aWRlLnJlc3VsdGFkb1NlbGVjY2lvbiB8fCAnJyxcclxuICAgICAgICBpZDogZ3VpZGUuSUQgfHwgZ3VpZGUuaWQgfHwgJycsXHJcbiAgICAgICAgZmFsdGE6IGd1aWRlLkZBTFRBIHx8IGd1aWRlLmZhbHRhIHx8ICdObycsXHJcbiAgICAgICAgc29icmE6IGd1aWRlLlNPQlJBIHx8IGd1aWRlLnNvYnJhIHx8ICdObycsXHJcbiAgICAgICAgZmVjaGFEaXBzOiBndWlkZS5GRUNIQURJUFMgfHwgZ3VpZGUuZmVjaGFEaXBzIHx8ICcnLFxyXG4gICAgICAgIG51bWVyb0RpcHM6IGd1aWRlLk5VTUVST0RJUFMgfHwgZ3VpZGUubnVtZXJvRGlwcyB8fCAnJyxcclxuICAgICAgICBlc0RpbjogZ3VpZGUuRVNESU4gfHwgZ3VpZGUuZXNEaW4gfHwgJ05vJyxcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCB3b3JrYm9vay54bHN4LndyaXRlQnVmZmVyKCk7XHJcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oYnVmZmVyKTtcclxuICB9XHJcbn1cclxuIl19