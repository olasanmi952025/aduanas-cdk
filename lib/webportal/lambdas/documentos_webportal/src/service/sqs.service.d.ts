import { ConfigService } from '@nestjs/config';
import { SQSProcessingResult, TypedSQSMessage, SQSMetrics, SQSHealthCheck } from '../interfaces/sqs-message.interface';
import { ServiceService } from './service.service';
export declare class SQSService {
    private readonly configService;
    private readonly serviceService;
    private readonly logger;
    private metrics;
    constructor(configService: ConfigService, serviceService: ServiceService);
    /**
     * Procesa un mensaje SQS tipado
     */
    processTypedMessage(message: TypedSQSMessage): Promise<SQSProcessingResult>;
    /**
     * Maneja la creación de samples
     */
    private handleSampleCreate;
    /**
     * Maneja la actualización de samples
     */
    private handleSampleUpdate;
    /**
     * Maneja la eliminación de samples
     */
    private handleSampleDelete;
    /**
     * Maneja el envío de notificaciones
     */
    private handleNotificationSend;
    /**
     * Maneja el logging de auditoría
     */
    private handleAuditLog;
    private validateSampleCreatePayload;
    private validateSampleUpdatePayload;
    private validateSampleDeletePayload;
    private validateNotificationPayload;
    private validateAuditPayload;
    private sendNotification;
    private logAuditEvent;
    private isRetryableError;
    private updateMetrics;
    getMetrics(): SQSMetrics;
    getHealthCheck(): Promise<SQSHealthCheck>;
    resetMetrics(): void;
}
