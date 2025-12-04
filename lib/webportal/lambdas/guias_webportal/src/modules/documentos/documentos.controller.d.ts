import { SQSProducerService } from "../sqs";
import { DocumentsService } from "./documentos.service";
import { ExportExcelDto } from "./dto/export-excel.dto";
import { ExportPdfDto } from "./dto/export-pdf.dto";
import { GuideFiltersDto } from "./dto/guide-filters.dto";
import { RequestInterface } from "./interfaces/request.interface";
import { ExportStatusService } from "../export-status";
export declare class DocumentsController {
    private readonly documentsService;
    private readonly sqsProducerService;
    private readonly exportStatusService;
    private readonly defaultUserId;
    constructor(documentsService: DocumentsService, sqsProducerService: SQSProducerService, exportStatusService: ExportStatusService);
    listGuides(filters: GuideFiltersDto, request: RequestInterface): Promise<import("../../shared").ApiResponseDto<{
        guides: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    exportToExcel(exportDto: ExportExcelDto, request: RequestInterface): Promise<{
        success: boolean;
        message: string;
        requestId: string;
        messageId: string;
    }>;
    exportToPdf(exportDto: ExportPdfDto, request: RequestInterface): Promise<{
        success: boolean;
        message: string;
        requestId: string;
        messageId: string;
    }>;
    getExportStatus(requestId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        data: import("../export-status/interfaces/export.status").ExportStatusRecord;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        data?: undefined;
    }>;
}
