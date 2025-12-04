import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { DocumentsQueryService } from '../documentos/documents-query.service';
import { GuideFiltersDto } from '../documentos/dto/guide-filters.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelGenerationService {
  private readonly logger = new Logger(ExcelGenerationService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly documentsQueryService: DocumentsQueryService,
  ) {}

  async generateExcel(
    filters: Record<string, any>,
    requestId: string,
    fileName?: string,
    userId?: number,
  ): Promise<{ filePath: string; s3Key: string; s3Url: string }> {
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
    } catch (error: any) {
      this.logger.error(`Error generating Excel: ${error.message}`, error.stack);
      throw error;
    }
  }

  private convertToGuideFiltersDto(filters: Record<string, any>): GuideFiltersDto {
    const dto = new GuideFiltersDto();
    
    if (filters.page !== undefined) dto.page = Number(filters.page);
    if (filters.limit !== undefined) dto.limit = Number(filters.limit);
    if (filters.sort) dto.sort = String(filters.sort);
    if (filters.order) dto.order = String(filters.order);
    if (filters.from) dto.from = filters.from instanceof Date ? filters.from : new Date(filters.from);
    if (filters.to) dto.to = filters.to instanceof Date ? filters.to : new Date(filters.to);
    if (filters.dateType) dto.dateType = String(filters.dateType);
    if (filters.guideNumber) dto.guideNumber = String(filters.guideNumber);
    if (filters.manifestNumber) dto.manifestNumber = String(filters.manifestNumber);
    if (filters.status) dto.status = String(filters.status);
    if (filters.locationType) dto.locationType = String(filters.locationType);
    if (filters.location) dto.location = String(filters.location);
    if (filters.participantType) dto.participantType = String(filters.participantType);
    if (filters.participant) dto.participant = String(filters.participant);
    if (filters.isSimplified !== undefined) dto.isSimplified = Boolean(filters.isSimplified);
    if (filters.marcas) dto.marcas = String(filters.marcas);
    if (filters.faltanteSobrante) dto.faltanteSobrante = String(filters.faltanteSobrante);
    if (filters.operationType) dto.operationType = String(filters.operationType);

    return dto;
  }

  private async createExcelBuffer(guides: any[]): Promise<Buffer> {
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
}
