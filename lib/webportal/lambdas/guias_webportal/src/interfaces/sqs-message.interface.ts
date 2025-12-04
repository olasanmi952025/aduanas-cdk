// Interfaces base para SQS
export interface SQSMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  source?: string;
  retryCount?: number;
  correlationId?: string; // Para tracking de requests
  metadata?: Record<string, any>; // Metadatos adicionales
}

export interface SQSProcessingResult {
  success: boolean;
  messageId: string;
  processedAt: string;
  error?: string;
  retryable?: boolean;
  processingTime?: number; // Tiempo de procesamiento en ms
  correlationId?: string;
}

export interface SQSHandler {
  processMessage(message: SQSMessage): Promise<SQSProcessingResult>;
}

// ===== INTERFACES ESPECÍFICAS POR DOMINIO =====

// Excel Export Domain
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

// PDF Export Domain
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

// ===== UNION TYPE PARA TODOS LOS TIPOS DE MENSAJE =====
export type TypedSQSMessage = ExcelExportMessage | PdfExportMessage;

// ===== INTERFACES PARA CONFIGURACIÓN =====
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

// ===== INTERFACES PARA MÉTRICAS Y MONITOREO =====
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