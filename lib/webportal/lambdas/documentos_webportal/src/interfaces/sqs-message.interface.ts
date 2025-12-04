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

// 4. Close Manifest Domain
export interface CloseManifestPayload {
  requestId: string;
  documentoId: number;
  userId?: string;
  delaySeconds?: number;
  [key: string]: any; // Para permitir payload adicional
}

export interface CloseManifestMessage extends SQSMessage {
  type: 'close.manifest';
  payload: CloseManifestPayload;
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

// 1. Sample Domain
export interface SampleCreatePayload {
  name: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface SampleUpdatePayload {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface SampleDeletePayload {
  id: string;
  reason?: string;
  deletedBy?: string;
}

// 2. Notification Domain
export interface NotificationSendPayload {
  recipient: string;
  subject: string;
  message: string;
  type: 'email' | 'sms' | 'push';
  priority?: 'low' | 'medium' | 'high';
  templateId?: string;
  variables?: Record<string, any>;
}

// 3. Audit Domain
export interface AuditLogPayload {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ===== INTERFACES TIPADAS POR TIPO DE MENSAJE =====

export interface SampleCreateMessage extends SQSMessage {
  type: 'sample.create';
  payload: SampleCreatePayload;
}

export interface SampleUpdateMessage extends SQSMessage {
  type: 'sample.update';
  payload: SampleUpdatePayload;
}

export interface SampleDeleteMessage extends SQSMessage {
  type: 'sample.delete';
  payload: SampleDeletePayload;
}

export interface NotificationSendMessage extends SQSMessage {
  type: 'notification.send';
  payload: NotificationSendPayload;
}

export interface AuditLogMessage extends SQSMessage {
  type: 'audit.log';
  payload: AuditLogPayload;
}

// ===== UNION TYPE PARA TODOS LOS TIPOS DE MENSAJE =====
export type TypedSQSMessage = 
  | SampleCreateMessage
  | SampleUpdateMessage
  | SampleDeleteMessage
  | NotificationSendMessage
  | AuditLogMessage;

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