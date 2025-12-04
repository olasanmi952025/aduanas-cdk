export interface SQSMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: string;
    source?: string;
    retryCount?: number;
    correlationId?: string;
    metadata?: Record<string, any>;
    MessageId?: string;
    Body?: string;
    Type?: string;
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
export interface ExcelExportPayload {
    filters: Record<string, any>;
    requestId: string;
    userId?: string;
    fileName?: string;
}
export interface ExcelExportMessage extends SQSMessage {
    type: 'excel.export';
    payload: ExcelExportPayload;
}
export interface PdfExportPayload {
    guideIds: number[];
    requestId: string;
    userId?: number;
    fileName?: string;
}
export interface PdfExportMessage extends SQSMessage {
    type: 'pdf.export';
    payload: PdfExportPayload;
}
export interface CloseManifestPayload {
    requestId: string;
    documentoId?: number;
    userId?: string;
    delaySeconds?: number;
    [key: string]: any;
}
export interface CloseManifestMessage extends SQSMessage {
    type: 'close.manifest';
    payload: CloseManifestPayload;
}
export interface XmlExportPayload {
    filters: Record<string, any>;
    requestId: string;
    fileName?: string;
}
export interface XmlExportMessage extends SQSMessage {
    type: 'xml.export';
    payload: XmlExportPayload;
}
export type TypedSQSMessage = ExcelExportMessage | PdfExportMessage | CloseManifestMessage | XmlExportMessage;
