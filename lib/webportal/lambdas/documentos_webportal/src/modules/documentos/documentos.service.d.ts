import { DocDocumentoBase } from "./entities";
import { DocLocacionDocumento, DocParticipacion } from "../dictionaries/entities";
import { BuscarDocumentosDto, CloseManifestDto } from "./dto/documentos.dto";
import { Repository, DataSource } from "typeorm";
import { ManifestSQSService } from '../../service/manifest-sqs.service';
import { ExportStatusService } from '../../service/export-status.service';
import { ConfigService } from '@nestjs/config';
import { RequestInterface } from '../../interfaces/request.interface';
export declare class DocumentsService {
    private readonly documentoBaseRepository;
    private readonly participacionRepository;
    private readonly locacionDocumentoRepository;
    private readonly dataSource;
    private readonly manifestSQSService;
    private readonly exportStatusService;
    private readonly configService;
    private readonly logger;
    constructor(documentoBaseRepository: Repository<DocDocumentoBase>, participacionRepository: Repository<DocParticipacion>, locacionDocumentoRepository: Repository<DocLocacionDocumento>, dataSource: DataSource, manifestSQSService: ManifestSQSService, exportStatusService: ExportStatusService, configService: ConfigService);
    /**
     * Build ORDER BY clause safely based on sortBy and sortOrder
     * @param sortBy - Field name from frontend
     * @param sortOrder - Direction (asc or desc)
     * @returns Safe SQL ORDER BY clause
     */
    private buildOrderBy;
    /**
     * Search documents in the database based on filters
     * @param filters
     * @returns
     */
    searchDocuments(filters: BuscarDocumentosDto): Promise<import("../../shared").ApiResponseDto<{
        documentos: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    exportDocuments(filters: BuscarDocumentosDto): Promise<string>;
    /**
     * Envía un proceso de exportación XML a la cola SQS para procesamiento asíncrono
     * El polling process (marcos/minimis_pweb_polling_process) consumirá el mensaje y lo procesará.
     * El polling process actualizará el estado en DynamoDB usando el requestId.
     */
    exportDocumentsSQS(filters: BuscarDocumentosDto, fileName?: string): Promise<import("../../shared").ApiResponseDto<{
        requestId: string | undefined;
        messageId: string | undefined;
        status: string;
        message: string;
        note: string;
    }>>;
    /**
     * Consulta el estado del proceso de exportación XML por requestId
     *
     * Consulta el estado desde DynamoDB donde el polling process lo actualiza.
     */
    getXmlExportStatus(requestId: string): Promise<import("../../shared").ApiResponseDto<{
        requestId: string;
        status: import("../../service/export-status.service").ExportStatus;
        createdAt: string;
        updatedAt: string;
        signedUrl: string | undefined;
        fileName: string | undefined;
        error: string | undefined;
    }>>;
    closeManifestSync(payload: CloseManifestDto): Promise<import("../../shared").ApiResponseDto<{
        documentoId: number;
        valido: boolean;
        message: string;
    }> | import("../../shared").ApiResponseDto<{
        documentoId: number;
        estaAnulado: boolean;
        message: string;
    }>>;
    closeManifestSQS(payload: CloseManifestDto, request?: RequestInterface): Promise<import("../../shared").ApiResponseDto<{
        documentoId: number;
        requestId: string | undefined;
        messageId: string | undefined;
        status: string;
        message: string;
        note: string;
    }>>;
    /**
     * Consulta el estado del proceso de cierre de manifiesto por requestId
     *
     * Consulta el estado desde DynamoDB donde el polling process lo actualiza.
     * Si no encuentra en DynamoDB, intenta consultar API Gateway como fallback
     * (para compatibilidad con procesos antiguos).
     *
     * @param requestId - Identificador único del proceso (UUID)
     */
    getManifestCloseStatus(requestId: string): Promise<any>;
}
