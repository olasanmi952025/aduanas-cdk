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
