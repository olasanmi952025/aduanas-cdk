import { BuscarDocumentosDto, CloseManifestDto } from "./dto/documentos.dto";
import { DocumentsService } from "./documentos.service";
import { RequestInterface } from "../../interfaces/request.interface";
export declare class DocumentsController {
    private readonly documentsService;
    private readonly defaultUserId;
    constructor(documentsService: DocumentsService);
    searchDocuments(filtros: BuscarDocumentosDto, req: RequestInterface): Promise<import("../../shared").ApiResponseDto<{
        documentos: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    getManifestCloseStatus(requestId: string): Promise<any>;
    exportDocuments(filters: BuscarDocumentosDto, fileName?: string): Promise<import("../../shared").ApiResponseDto<{
        requestId: string | undefined;
        messageId: string | undefined;
        status: string;
        message: string;
        note: string;
    }>>;
    getXmlExportStatus(requestId: string): Promise<import("../../shared").ApiResponseDto<{
        requestId: string;
        status: import("../../service/export-status.service").ExportStatus;
        createdAt: string;
        updatedAt: string;
        signedUrl: string | undefined;
        fileName: string | undefined;
        error: string | undefined;
    }>>;
    closeManifestSQS(payload: CloseManifestDto, req: RequestInterface): Promise<import("../../shared").ApiResponseDto<{
        documentoId: number;
        requestId: string | undefined;
        messageId: string | undefined;
        status: string;
        message: string;
        note: string;
    }>>;
}
