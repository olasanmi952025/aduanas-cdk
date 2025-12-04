import { ConfigService } from '@nestjs/config';
import { AWSConfigService } from '../aws';
export declare enum ExportStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export interface ExportStatusRecord {
    requestId: string;
    status: ExportStatus;
    createdAt: string;
    updatedAt: string;
    ttl?: number;
    signedUrl?: string;
    fileName?: string;
    error?: string;
}
export declare class ExportStatusService {
    private readonly configService;
    private readonly awsConfigService;
    private readonly logger;
    private readonly dynamoDB;
    private readonly tableName;
    constructor(configService: ConfigService, awsConfigService: AWSConfigService);
    /**
     * Crea un registro con estado pendiente en DynamoDB
     * El TTL se establece a 15 minutos desde la creación
     */
    createPendingStatus(requestId: string, fileName?: string): Promise<void>;
    /**
     * Actualiza el estado a "processing" cuando el consumidor inicia el procesamiento
     */
    updateToProcessing(requestId: string): Promise<void>;
    /**
     * Actualiza el estado a "completed" con la URL firmada y el nombre del archivo
     * La URL firmada tiene una expiración de 1 hora
     */
    updateToCompleted(requestId: string, signedUrl: string, fileName: string): Promise<void>;
    /**
     * Actualiza el estado a "failed" con el mensaje de error
     */
    updateToFailed(requestId: string, error: string): Promise<void>;
    /**
     * Obtiene el estado de una exportación por su requestId
     */
    getStatus(requestId: string): Promise<ExportStatusRecord | null>;
}
