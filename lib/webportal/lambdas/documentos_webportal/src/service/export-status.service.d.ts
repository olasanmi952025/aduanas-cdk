import { ConfigService } from '@nestjs/config';
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
    private readonly logger;
    private readonly dynamoDB;
    private readonly tableName;
    constructor(configService: ConfigService);
    /**
     * Obtiene el estado de un proceso por su requestId desde DynamoDB
     */
    getStatus(requestId: string): Promise<ExportStatusRecord | null>;
}
