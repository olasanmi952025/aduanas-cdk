import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  SQSMessage, 
  SQSProcessingResult, 
  TypedSQSMessage,
  SampleCreateMessage,
  SampleUpdateMessage,
  SampleDeleteMessage,
  NotificationSendMessage,
  AuditLogMessage,
  SQSConfig,
  SQSHandlerConfig,
  SQSMetrics,
  SQSHealthCheck
} from '../interfaces/sqs-message.interface';
import { ServiceService } from './service.service';

@Injectable()
export class SQSService {
  private readonly logger = new Logger(SQSService.name);
  private metrics: SQSMetrics = {
    messagesProcessed: 0,
    messagesFailed: 0,
    averageProcessingTime: 0,
    lastProcessedAt: '',
    errorsByType: {}
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceService: ServiceService,
  ) {}

  /**
   * Procesa un mensaje SQS tipado
   */
  async processTypedMessage(message: TypedSQSMessage): Promise<SQSProcessingResult> {
    const startTime = Date.now();
    const messageId = message.id;
    
    try {
      this.logger.log(`Processing ${message.type} message: ${messageId}`);
      
      let result: Partial<SQSProcessingResult>;
      
      // Type-safe routing usando discriminated unions
      switch (message.type) {
        case 'sample.create':
          result = await this.handleSampleCreate(message as SampleCreateMessage);
          break;
        case 'sample.update':
          result = await this.handleSampleUpdate(message as SampleUpdateMessage);
          break;
        case 'sample.delete':
          result = await this.handleSampleDelete(message as SampleDeleteMessage);
          break;
        case 'notification.send':
          result = await this.handleNotificationSend(message as NotificationSendMessage);
          break;
        case 'audit.log':
          result = await this.handleAuditLog(message as AuditLogMessage);
          break;
        default:
          throw new Error(`Unknown message type: ${(message as any).type}`);
      }

      const processingTime = Date.now() - startTime;
      this.updateMetrics(true, processingTime);
      
      return {
        success: true,
        messageId,
        processedAt: new Date().toISOString(),
        processingTime,
        correlationId: message.correlationId,
        ...result
      };

    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime, normalizedError);
      
      this.logger.error(`Failed to process message ${messageId}:`, normalizedError);
      
      return {
        success: false,
        messageId,
        processedAt: new Date().toISOString(),
        processingTime,
        error: normalizedError.message,
        retryable: this.isRetryableError(normalizedError),
        correlationId: message.correlationId
      };
    }
  }

  /**
   * Maneja la creación de samples
   */
  private async handleSampleCreate(message: SampleCreateMessage): Promise<Partial<SQSProcessingResult>> {
    this.logger.log(`Creating sample: ${JSON.stringify(message.payload)}`);
    
    // Validar payload
    this.validateSampleCreatePayload(message.payload);
    
    // Crear el sample usando el servicio
    const sample = await this.serviceService.create(message.payload.name);
    
    this.logger.log(`Sample created with ID: ${sample.id}`);
    
    return { success: true };
  }

  /**
   * Maneja la actualización de samples
   */
  private async handleSampleUpdate(message: SampleUpdateMessage): Promise<Partial<SQSProcessingResult>> {
    this.logger.log(`Updating sample: ${JSON.stringify(message.payload)}`);
    
    // Validar payload
    this.validateSampleUpdatePayload(message.payload);
    
    // Actualizar el sample
    if (message.payload.name) {
      await this.serviceService.update(message.payload.id, message.payload.name);
    }
    
    this.logger.log(`Sample ${message.payload.id} updated successfully`);
    
    return { success: true };
  }

  /**
   * Maneja la eliminación de samples
   */
  private async handleSampleDelete(message: SampleDeleteMessage): Promise<Partial<SQSProcessingResult>> {
    this.logger.log(`Deleting sample: ${JSON.stringify(message.payload)}`);
    
    // Validar payload
    this.validateSampleDeletePayload(message.payload);
    
    // Eliminar el sample
    await this.serviceService.remove(message.payload.id);
    
    this.logger.log(`Sample ${message.payload.id} deleted successfully`);
    
    return { success: true };
  }

  /**
   * Maneja el envío de notificaciones
   */
  private async handleNotificationSend(message: NotificationSendMessage): Promise<Partial<SQSProcessingResult>> {
    this.logger.log(`Sending notification: ${JSON.stringify(message.payload)}`);
    
    // Validar payload
    this.validateNotificationPayload(message.payload);
    
    // Aquí implementarías la lógica de envío de notificaciones
    // Por ejemplo, integrar con SES, SNS, etc.
    await this.sendNotification(message.payload);
    
    this.logger.log(`Notification sent to ${message.payload.recipient}`);
    
    return { success: true };
  }

  /**
   * Maneja el logging de auditoría
   */
  private async handleAuditLog(message: AuditLogMessage): Promise<Partial<SQSProcessingResult>> {
    this.logger.log(`Logging audit: ${JSON.stringify(message.payload)}`);
    
    // Validar payload
    this.validateAuditPayload(message.payload);
    
    // Aquí implementarías la lógica de auditoría
    // Por ejemplo, guardar en una tabla de auditoría
    await this.logAuditEvent(message.payload);
    
    return { success: true };
  }

  // ===== VALIDACIONES =====
  
  private validateSampleCreatePayload(payload: any): void {
    if (!payload.name || typeof payload.name !== 'string') {
      throw new Error('Invalid sample create payload: name is required and must be a string');
    }
  }

  private validateSampleUpdatePayload(payload: any): void {
    if (!payload.id || typeof payload.id !== 'string') {
      throw new Error('Invalid sample update payload: id is required and must be a string');
    }
  }

  private validateSampleDeletePayload(payload: any): void {
    if (!payload.id || typeof payload.id !== 'string') {
      throw new Error('Invalid sample delete payload: id is required and must be a string');
    }
  }

  private validateNotificationPayload(payload: any): void {
    if (!payload.recipient || !payload.subject || !payload.message) {
      throw new Error('Invalid notification payload: recipient, subject, and message are required');
    }
    if (!['email', 'sms', 'push'].includes(payload.type)) {
      throw new Error('Invalid notification type: must be email, sms, or push');
    }
  }

  private validateAuditPayload(payload: any): void {
    if (!payload.action || !payload.entityType || !payload.entityId) {
      throw new Error('Invalid audit payload: action, entityType, and entityId are required');
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private async sendNotification(payload: any): Promise<void> {
    // Implementar lógica de envío de notificaciones
    // Por ejemplo, integrar con AWS SES, SNS, etc.
    this.logger.log(`Sending ${payload.type} notification to ${payload.recipient}`);
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async logAuditEvent(payload: any): Promise<void> {
    // Implementar lógica de auditoría
    // Por ejemplo, guardar en base de datos de auditoría
    this.logger.log(`Audit event: ${payload.action} on ${payload.entityType}:${payload.entityId}`);
    
    // Simular logging
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'Database connection failed',
      'Service temporarily unavailable',
      'Rate limit exceeded'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private updateMetrics(success: boolean, processingTime: number, error?: any): void {
    if (success) {
      this.metrics.messagesProcessed++;
    } else {
      this.metrics.messagesFailed++;
      if (error?.message) {
        const errorType = error.constructor.name;
        this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
      }
    }

    // Actualizar tiempo promedio de procesamiento
    const totalMessages = this.metrics.messagesProcessed + this.metrics.messagesFailed;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (totalMessages - 1) + processingTime) / totalMessages;
    
    this.metrics.lastProcessedAt = new Date().toISOString();
  }

  // ===== MÉTODOS PÚBLICOS PARA MONITOREO =====

  getMetrics(): SQSMetrics {
    return { ...this.metrics };
  }

  async getHealthCheck(): Promise<SQSHealthCheck> {
    // Implementar health check real
    return {
      status: 'healthy',
      queueStatus: 'available',
      lastMessageProcessed: this.metrics.lastProcessedAt,
      pendingMessages: 0, // Implementar consulta real a SQS
      deadLetterMessages: 0 // Implementar consulta real a DLQ
    };
  }

  resetMetrics(): void {
    this.metrics = {
      messagesProcessed: 0,
      messagesFailed: 0,
      averageProcessingTime: 0,
      lastProcessedAt: '',
      errorsByType: {}
    };
  }
}

