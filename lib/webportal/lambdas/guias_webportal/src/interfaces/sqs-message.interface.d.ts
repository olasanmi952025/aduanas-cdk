export interface SQSMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: string;
    source?: string;
    retryCount?: number;
    correlationId?: string;
    metadata?: Record<string, any>;
}
export interface SQSProcessingResult {
    success: boolean;
    messageId: string;
    processedAt: string;
    error?: string;
    retryable?: boolean;
    processingTime?: number;
    correlationId?: string;
}
export interface SQSHandler {
    processMessage(message: SQSMessage): Promise<SQSProcessingResult>;
}
export interface ExcelExportPayload {
    filters: Record<string, any>;
    email?: string;
    fileName?: string;
    userId?: number;
    requestId: string;
}
export interface ExcelExportMessage extends SQSMessage {
    type: 'excel.export';
    payload: ExcelExportPayload;
}
export interface PdfExportPayload {
    guideIds: number[];
    fileName?: string;
    userId?: number;
    requestId: string;
}
export interface PdfExportMessage extends SQSMessage {
    type: 'pdf.export';
    payload: PdfExportPayload;
}
export type TypedSQSMessage = ExcelExportMessage | PdfExportMessage;
export interface SQSConfig {
    queueUrl: string;
    maxRetries: number;
    retryDelay: number;
    deadLetterQueueUrl?: string;
    visibilityTimeout: number;
    batchSize: number;
}
export interface SQSHandlerConfig {
    enabled: boolean;
    handlers: Record<string, boolean>;
    retryPolicy: {
        maxRetries: number;
        backoffMultiplier: number;
        maxBackoffTime: number;
    };
    deadLetterQueue: {
        enabled: boolean;
        maxRetries: number;
    };
}
export interface SQSMetrics {
    messagesProcessed: number;
    messagesFailed: number;
    averageProcessingTime: number;
    lastProcessedAt: string;
    errorsByType: Record<string, number>;
}
export interface SQSHealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    queueStatus: 'available' | 'unavailable';
    lastMessageProcessed: string;
    pendingMessages: number;
    deadLetterMessages: number;
}
