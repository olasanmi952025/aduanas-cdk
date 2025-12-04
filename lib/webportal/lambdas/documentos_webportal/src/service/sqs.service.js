"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SQSService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSService = void 0;
const common_1 = require("@nestjs/common");
let SQSService = SQSService_1 = class SQSService {
    constructor(configService, serviceService) {
        this.configService = configService;
        this.serviceService = serviceService;
        this.logger = new common_1.Logger(SQSService_1.name);
        this.metrics = {
            messagesProcessed: 0,
            messagesFailed: 0,
            averageProcessingTime: 0,
            lastProcessedAt: '',
            errorsByType: {}
        };
    }
    /**
     * Procesa un mensaje SQS tipado
     */
    async processTypedMessage(message) {
        const startTime = Date.now();
        const messageId = message.id;
        try {
            this.logger.log(`Processing ${message.type} message: ${messageId}`);
            let result;
            // Type-safe routing usando discriminated unions
            switch (message.type) {
                case 'sample.create':
                    result = await this.handleSampleCreate(message);
                    break;
                case 'sample.update':
                    result = await this.handleSampleUpdate(message);
                    break;
                case 'sample.delete':
                    result = await this.handleSampleDelete(message);
                    break;
                case 'notification.send':
                    result = await this.handleNotificationSend(message);
                    break;
                case 'audit.log':
                    result = await this.handleAuditLog(message);
                    break;
                default:
                    throw new Error(`Unknown message type: ${message.type}`);
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
        }
        catch (error) {
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
    async handleSampleCreate(message) {
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
    async handleSampleUpdate(message) {
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
    async handleSampleDelete(message) {
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
    async handleNotificationSend(message) {
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
    async handleAuditLog(message) {
        this.logger.log(`Logging audit: ${JSON.stringify(message.payload)}`);
        // Validar payload
        this.validateAuditPayload(message.payload);
        // Aquí implementarías la lógica de auditoría
        // Por ejemplo, guardar en una tabla de auditoría
        await this.logAuditEvent(message.payload);
        return { success: true };
    }
    // ===== VALIDACIONES =====
    validateSampleCreatePayload(payload) {
        if (!payload.name || typeof payload.name !== 'string') {
            throw new Error('Invalid sample create payload: name is required and must be a string');
        }
    }
    validateSampleUpdatePayload(payload) {
        if (!payload.id || typeof payload.id !== 'string') {
            throw new Error('Invalid sample update payload: id is required and must be a string');
        }
    }
    validateSampleDeletePayload(payload) {
        if (!payload.id || typeof payload.id !== 'string') {
            throw new Error('Invalid sample delete payload: id is required and must be a string');
        }
    }
    validateNotificationPayload(payload) {
        if (!payload.recipient || !payload.subject || !payload.message) {
            throw new Error('Invalid notification payload: recipient, subject, and message are required');
        }
        if (!['email', 'sms', 'push'].includes(payload.type)) {
            throw new Error('Invalid notification type: must be email, sms, or push');
        }
    }
    validateAuditPayload(payload) {
        if (!payload.action || !payload.entityType || !payload.entityId) {
            throw new Error('Invalid audit payload: action, entityType, and entityId are required');
        }
    }
    // ===== MÉTODOS AUXILIARES =====
    async sendNotification(payload) {
        // Implementar lógica de envío de notificaciones
        // Por ejemplo, integrar con AWS SES, SNS, etc.
        this.logger.log(`Sending ${payload.type} notification to ${payload.recipient}`);
        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    async logAuditEvent(payload) {
        // Implementar lógica de auditoría
        // Por ejemplo, guardar en base de datos de auditoría
        this.logger.log(`Audit event: ${payload.action} on ${payload.entityType}:${payload.entityId}`);
        // Simular logging
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    isRetryableError(error) {
        const retryableErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'Database connection failed',
            'Service temporarily unavailable',
            'Rate limit exceeded'
        ];
        const errorMessage = error.message?.toLowerCase() || '';
        return retryableErrors.some(retryableError => errorMessage.includes(retryableError.toLowerCase()));
    }
    updateMetrics(success, processingTime, error) {
        if (success) {
            this.metrics.messagesProcessed++;
        }
        else {
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
    getMetrics() {
        return { ...this.metrics };
    }
    async getHealthCheck() {
        // Implementar health check real
        return {
            status: 'healthy',
            queueStatus: 'available',
            lastMessageProcessed: this.metrics.lastProcessedAt,
            pendingMessages: 0, // Implementar consulta real a SQS
            deadLetterMessages: 0 // Implementar consulta real a DLQ
        };
    }
    resetMetrics() {
        this.metrics = {
            messagesProcessed: 0,
            messagesFailed: 0,
            averageProcessingTime: 0,
            lastProcessedAt: '',
            errorsByType: {}
        };
    }
};
exports.SQSService = SQSService;
exports.SQSService = SQSService = SQSService_1 = __decorate([
    (0, common_1.Injectable)()
], SQSService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMkNBQW9EO0FBbUI3QyxJQUFNLFVBQVUsa0JBQWhCLE1BQU0sVUFBVTtJQVVyQixZQUNtQixhQUE0QixFQUM1QixjQUE4QjtRQUQ5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFYaEMsV0FBTSxHQUFHLElBQUksZUFBTSxDQUFDLFlBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxZQUFPLEdBQWU7WUFDNUIsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixjQUFjLEVBQUUsQ0FBQztZQUNqQixxQkFBcUIsRUFBRSxDQUFDO1lBQ3hCLGVBQWUsRUFBRSxFQUFFO1lBQ25CLFlBQVksRUFBRSxFQUFFO1NBQ2pCLENBQUM7SUFLQyxDQUFDO0lBRUo7O09BRUc7SUFDSCxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBd0I7UUFDaEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFFN0IsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxPQUFPLENBQUMsSUFBSSxhQUFhLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFcEUsSUFBSSxNQUFvQyxDQUFDO1lBRXpDLGdEQUFnRDtZQUNoRCxRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckIsS0FBSyxlQUFlO29CQUNsQixNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBOEIsQ0FBQyxDQUFDO29CQUN2RSxNQUFNO2dCQUNSLEtBQUssZUFBZTtvQkFDbEIsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQThC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Q3BCLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsWUFBWSxFQUFFLEVBQUU7U0FDakIsQ0FBQztJQUNKLENBQUM7Q0FDRixDQUFBO0FBMVJZLGdDQUFVO3FCQUFWLFVBQVU7SUFEdEIsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsVUFBVSxDQTBSdEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xuaW1wb3J0IHsgXG4gIFNRU01lc3NhZ2UsIFxuICBTUVNQcm9jZXNzaW5nUmVzdWx0LCBcbiAgVHlwZWRTUVNNZXNzYWdlLFxuICBTYW1wbGVDcmVhdGVNZXNzYWdlLFxuICBTYW1wbGVVcGRhdGVNZXNzYWdlLFxuICBTYW1wbGVEZWxldGVNZXNzYWdlLFxuICBOb3RpZmljYXRpb25TZW5kTWVzc2FnZSxcbiAgQXVkaXRMb2dNZXNzYWdlLFxuICBTUVNDb25maWcsXG4gIFNRU0hhbmRsZXJDb25maWcsXG4gIFNRU01ldHJpY3MsXG4gIFNRU0hlYWx0aENoZWNrXG59IGZyb20gJy4uL2ludGVyZmFjZXMvc3FzLW1lc3NhZ2UuaW50ZXJmYWNlJztcbmltcG9ydCB7IFNlcnZpY2VTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlLnNlcnZpY2UnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgU1FTU2VydmljZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihTUVNTZXJ2aWNlLm5hbWUpO1xuICBwcml2YXRlIG1ldHJpY3M6IFNRU01ldHJpY3MgPSB7XG4gICAgbWVzc2FnZXNQcm9jZXNzZWQ6IDAsXG4gICAgbWVzc2FnZXNGYWlsZWQ6IDAsXG4gICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAwLFxuICAgIGxhc3RQcm9jZXNzZWRBdDogJycsXG4gICAgZXJyb3JzQnlUeXBlOiB7fVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnU2VydmljZTogQ29uZmlnU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VTZXJ2aWNlOiBTZXJ2aWNlU2VydmljZSxcbiAgKSB7fVxuXG4gIC8qKlxuICAgKiBQcm9jZXNhIHVuIG1lbnNhamUgU1FTIHRpcGFkb1xuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc1R5cGVkTWVzc2FnZShtZXNzYWdlOiBUeXBlZFNRU01lc3NhZ2UpOiBQcm9taXNlPFNRU1Byb2Nlc3NpbmdSZXN1bHQ+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IG1lc3NhZ2UuaWQ7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgUHJvY2Vzc2luZyAke21lc3NhZ2UudHlwZX0gbWVzc2FnZTogJHttZXNzYWdlSWR9YCk7XG4gICAgICBcbiAgICAgIGxldCByZXN1bHQ6IFBhcnRpYWw8U1FTUHJvY2Vzc2luZ1Jlc3VsdD47XG4gICAgICBcbiAgICAgIC8vIFR5cGUtc2FmZSByb3V0aW5nIHVzYW5kbyBkaXNjcmltaW5hdGVkIHVuaW9uc1xuICAgICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnc2FtcGxlLmNyZWF0ZSc6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5oYW5kbGVTYW1wbGVDcmVhdGUobWVzc2FnZSBhcyBTYW1wbGVDcmVhdGVNZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2FtcGxlLnVwZGF0ZSc6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5oYW5kbGVTYW1wbGVVcGRhdGUobWVzc2FnZSBhcyBTYW1wbGVVcGRhdGVNZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2FtcGxlLmRlbGV0ZSc6XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5oYW5kbGVTYW1wbGVEZWxldGUobWVzc2FnZSBhcyBTYW1wbGVEZWxldGVNZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbm90aWZpY2F0aW9uLnNlbmQnOlxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuaGFuZGxlTm90aWZpY2F0aW9uU2VuZChtZXNzYWdlIGFzIE5vdGlmaWNhdGlvblNlbmRNZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYXVkaXQubG9nJzpcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmhhbmRsZUF1ZGl0TG9nKG1lc3NhZ2UgYXMgQXVkaXRMb2dNZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gbWVzc2FnZSB0eXBlOiAkeyhtZXNzYWdlIGFzIGFueSkudHlwZX1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvY2Vzc2luZ1RpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgdGhpcy51cGRhdGVNZXRyaWNzKHRydWUsIHByb2Nlc3NpbmdUaW1lKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZUlkLFxuICAgICAgICBwcm9jZXNzZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBwcm9jZXNzaW5nVGltZSxcbiAgICAgICAgY29ycmVsYXRpb25JZDogbWVzc2FnZS5jb3JyZWxhdGlvbklkLFxuICAgICAgICAuLi5yZXN1bHRcbiAgICAgIH07XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZEVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpO1xuICAgICAgY29uc3QgcHJvY2Vzc2luZ1RpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgdGhpcy51cGRhdGVNZXRyaWNzKGZhbHNlLCBwcm9jZXNzaW5nVGltZSwgbm9ybWFsaXplZEVycm9yKTtcbiAgICAgIFxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEZhaWxlZCB0byBwcm9jZXNzIG1lc3NhZ2UgJHttZXNzYWdlSWR9OmAsIG5vcm1hbGl6ZWRFcnJvcik7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgICAgIHByb2Nlc3NlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHByb2Nlc3NpbmdUaW1lLFxuICAgICAgICBlcnJvcjogbm9ybWFsaXplZEVycm9yLm1lc3NhZ2UsXG4gICAgICAgIHJldHJ5YWJsZTogdGhpcy5pc1JldHJ5YWJsZUVycm9yKG5vcm1hbGl6ZWRFcnJvciksXG4gICAgICAgIGNvcnJlbGF0aW9uSWQ6IG1lc3NhZ2UuY29ycmVsYXRpb25JZFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFuZWphIGxhIGNyZWFjacOzbiBkZSBzYW1wbGVzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGhhbmRsZVNhbXBsZUNyZWF0ZShtZXNzYWdlOiBTYW1wbGVDcmVhdGVNZXNzYWdlKTogUHJvbWlzZTxQYXJ0aWFsPFNRU1Byb2Nlc3NpbmdSZXN1bHQ+PiB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGBDcmVhdGluZyBzYW1wbGU6ICR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZS5wYXlsb2FkKX1gKTtcbiAgICBcbiAgICAvLyBWYWxpZGFyIHBheWxvYWRcbiAgICB0aGlzLnZhbGlkYXRlU2FtcGxlQ3JlYXRlUGF5bG9hZChtZXNzYWdlLnBheWxvYWQpO1xuICAgIFxuICAgIC8vIENyZWFyIGVsIHNhbXBsZSB1c2FuZG8gZWwgc2VydmljaW9cbiAgICBjb25zdCBzYW1wbGUgPSBhd2FpdCB0aGlzLnNlcnZpY2VTZXJ2aWNlLmNyZWF0ZShtZXNzYWdlLnBheWxvYWQubmFtZSk7XG4gICAgXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTYW1wbGUgY3JlYXRlZCB3aXRoIElEOiAke3NhbXBsZS5pZH1gKTtcbiAgICBcbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gIH1cblxuICAvKipcbiAgICogTWFuZWphIGxhIGFjdHVhbGl6YWNpw7NuIGRlIHNhbXBsZXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlU2FtcGxlVXBkYXRlKG1lc3NhZ2U6IFNhbXBsZVVwZGF0ZU1lc3NhZ2UpOiBQcm9taXNlPFBhcnRpYWw8U1FTUHJvY2Vzc2luZ1Jlc3VsdD4+IHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYFVwZGF0aW5nIHNhbXBsZTogJHtKU09OLnN0cmluZ2lmeShtZXNzYWdlLnBheWxvYWQpfWApO1xuICAgIFxuICAgIC8vIFZhbGlkYXIgcGF5bG9hZFxuICAgIHRoaXMudmFsaWRhdGVTYW1wbGVVcGRhdGVQYXlsb2FkKG1lc3NhZ2UucGF5bG9hZCk7XG4gICAgXG4gICAgLy8gQWN0dWFsaXphciBlbCBzYW1wbGVcbiAgICBpZiAobWVzc2FnZS5wYXlsb2FkLm5hbWUpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2VydmljZVNlcnZpY2UudXBkYXRlKG1lc3NhZ2UucGF5bG9hZC5pZCwgbWVzc2FnZS5wYXlsb2FkLm5hbWUpO1xuICAgIH1cbiAgICBcbiAgICB0aGlzLmxvZ2dlci5sb2coYFNhbXBsZSAke21lc3NhZ2UucGF5bG9hZC5pZH0gdXBkYXRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICBcbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gIH1cblxuICAvKipcbiAgICogTWFuZWphIGxhIGVsaW1pbmFjacOzbiBkZSBzYW1wbGVzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGhhbmRsZVNhbXBsZURlbGV0ZShtZXNzYWdlOiBTYW1wbGVEZWxldGVNZXNzYWdlKTogUHJvbWlzZTxQYXJ0aWFsPFNRU1Byb2Nlc3NpbmdSZXN1bHQ+PiB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGBEZWxldGluZyBzYW1wbGU6ICR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZS5wYXlsb2FkKX1gKTtcbiAgICBcbiAgICAvLyBWYWxpZGFyIHBheWxvYWRcbiAgICB0aGlzLnZhbGlkYXRlU2FtcGxlRGVsZXRlUGF5bG9hZChtZXNzYWdlLnBheWxvYWQpO1xuICAgIFxuICAgIC8vIEVsaW1pbmFyIGVsIHNhbXBsZVxuICAgIGF3YWl0IHRoaXMuc2VydmljZVNlcnZpY2UucmVtb3ZlKG1lc3NhZ2UucGF5bG9hZC5pZCk7XG4gICAgXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTYW1wbGUgJHttZXNzYWdlLnBheWxvYWQuaWR9IGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgXG4gICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbmVqYSBlbCBlbnbDrW8gZGUgbm90aWZpY2FjaW9uZXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlTm90aWZpY2F0aW9uU2VuZChtZXNzYWdlOiBOb3RpZmljYXRpb25TZW5kTWVzc2FnZSk6IFByb21pc2U8UGFydGlhbDxTUVNQcm9jZXNzaW5nUmVzdWx0Pj4ge1xuICAgIHRoaXMubG9nZ2VyLmxvZyhgU2VuZGluZyBub3RpZmljYXRpb246ICR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZS5wYXlsb2FkKX1gKTtcbiAgICBcbiAgICAvLyBWYWxpZGFyIHBheWxvYWRcbiAgICB0aGlzLnZhbGlkYXRlTm90aWZpY2F0aW9uUGF5bG9hZChtZXNzYWdlLnBheWxvYWQpO1xuICAgIFxuICAgIC8vIEFxdcOtIGltcGxlbWVudGFyw61hcyBsYSBsw7NnaWNhIGRlIGVudsOtbyBkZSBub3RpZmljYWNpb25lc1xuICAgIC8vIFBvciBlamVtcGxvLCBpbnRlZ3JhciBjb24gU0VTLCBTTlMsIGV0Yy5cbiAgICBhd2FpdCB0aGlzLnNlbmROb3RpZmljYXRpb24obWVzc2FnZS5wYXlsb2FkKTtcbiAgICBcbiAgICB0aGlzLmxvZ2dlci5sb2coYE5vdGlmaWNhdGlvbiBzZW50IHRvICR7bWVzc2FnZS5wYXlsb2FkLnJlY2lwaWVudH1gKTtcbiAgICBcbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gIH1cblxuICAvKipcbiAgICogTWFuZWphIGVsIGxvZ2dpbmcgZGUgYXVkaXRvcsOtYVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBdWRpdExvZyhtZXNzYWdlOiBBdWRpdExvZ01lc3NhZ2UpOiBQcm9taXNlPFBhcnRpYWw8U1FTUHJvY2Vzc2luZ1Jlc3VsdD4+IHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYExvZ2dpbmcgYXVkaXQ6ICR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZS5wYXlsb2FkKX1gKTtcbiAgICBcbiAgICAvLyBWYWxpZGFyIHBheWxvYWRcbiAgICB0aGlzLnZhbGlkYXRlQXVkaXRQYXlsb2FkKG1lc3NhZ2UucGF5bG9hZCk7XG4gICAgXG4gICAgLy8gQXF1w60gaW1wbGVtZW50YXLDrWFzIGxhIGzDs2dpY2EgZGUgYXVkaXRvcsOtYVxuICAgIC8vIFBvciBlamVtcGxvLCBndWFyZGFyIGVuIHVuYSB0YWJsYSBkZSBhdWRpdG9yw61hXG4gICAgYXdhaXQgdGhpcy5sb2dBdWRpdEV2ZW50KG1lc3NhZ2UucGF5bG9hZCk7XG4gICAgXG4gICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICB9XG5cbiAgLy8gPT09PT0gVkFMSURBQ0lPTkVTID09PT09XG4gIFxuICBwcml2YXRlIHZhbGlkYXRlU2FtcGxlQ3JlYXRlUGF5bG9hZChwYXlsb2FkOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIXBheWxvYWQubmFtZSB8fCB0eXBlb2YgcGF5bG9hZC5uYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNhbXBsZSBjcmVhdGUgcGF5bG9hZDogbmFtZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVTYW1wbGVVcGRhdGVQYXlsb2FkKHBheWxvYWQ6IGFueSk6IHZvaWQge1xuICAgIGlmICghcGF5bG9hZC5pZCB8fCB0eXBlb2YgcGF5bG9hZC5pZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzYW1wbGUgdXBkYXRlIHBheWxvYWQ6IGlkIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZVNhbXBsZURlbGV0ZVBheWxvYWQocGF5bG9hZDogYW55KTogdm9pZCB7XG4gICAgaWYgKCFwYXlsb2FkLmlkIHx8IHR5cGVvZiBwYXlsb2FkLmlkICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNhbXBsZSBkZWxldGUgcGF5bG9hZDogaWQgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlTm90aWZpY2F0aW9uUGF5bG9hZChwYXlsb2FkOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIXBheWxvYWQucmVjaXBpZW50IHx8ICFwYXlsb2FkLnN1YmplY3QgfHwgIXBheWxvYWQubWVzc2FnZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vdGlmaWNhdGlvbiBwYXlsb2FkOiByZWNpcGllbnQsIHN1YmplY3QsIGFuZCBtZXNzYWdlIGFyZSByZXF1aXJlZCcpO1xuICAgIH1cbiAgICBpZiAoIVsnZW1haWwnLCAnc21zJywgJ3B1c2gnXS5pbmNsdWRlcyhwYXlsb2FkLnR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm90aWZpY2F0aW9uIHR5cGU6IG11c3QgYmUgZW1haWwsIHNtcywgb3IgcHVzaCcpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVBdWRpdFBheWxvYWQocGF5bG9hZDogYW55KTogdm9pZCB7XG4gICAgaWYgKCFwYXlsb2FkLmFjdGlvbiB8fCAhcGF5bG9hZC5lbnRpdHlUeXBlIHx8ICFwYXlsb2FkLmVudGl0eUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXVkaXQgcGF5bG9hZDogYWN0aW9uLCBlbnRpdHlUeXBlLCBhbmQgZW50aXR5SWQgYXJlIHJlcXVpcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gPT09PT0gTcOJVE9ET1MgQVVYSUxJQVJFUyA9PT09PVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE5vdGlmaWNhdGlvbihwYXlsb2FkOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJbXBsZW1lbnRhciBsw7NnaWNhIGRlIGVudsOtbyBkZSBub3RpZmljYWNpb25lc1xuICAgIC8vIFBvciBlamVtcGxvLCBpbnRlZ3JhciBjb24gQVdTIFNFUywgU05TLCBldGMuXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTZW5kaW5nICR7cGF5bG9hZC50eXBlfSBub3RpZmljYXRpb24gdG8gJHtwYXlsb2FkLnJlY2lwaWVudH1gKTtcbiAgICBcbiAgICAvLyBTaW11bGFyIGVudsOtb1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9nQXVkaXRFdmVudChwYXlsb2FkOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBJbXBsZW1lbnRhciBsw7NnaWNhIGRlIGF1ZGl0b3LDrWFcbiAgICAvLyBQb3IgZWplbXBsbywgZ3VhcmRhciBlbiBiYXNlIGRlIGRhdG9zIGRlIGF1ZGl0b3LDrWFcbiAgICB0aGlzLmxvZ2dlci5sb2coYEF1ZGl0IGV2ZW50OiAke3BheWxvYWQuYWN0aW9ufSBvbiAke3BheWxvYWQuZW50aXR5VHlwZX06JHtwYXlsb2FkLmVudGl0eUlkfWApO1xuICAgIFxuICAgIC8vIFNpbXVsYXIgbG9nZ2luZ1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBpc1JldHJ5YWJsZUVycm9yKGVycm9yOiBhbnkpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXRyeWFibGVFcnJvcnMgPSBbXG4gICAgICAnRUNPTk5SRUZVU0VEJyxcbiAgICAgICdFVElNRURPVVQnLFxuICAgICAgJ0VOT1RGT1VORCcsXG4gICAgICAnRGF0YWJhc2UgY29ubmVjdGlvbiBmYWlsZWQnLFxuICAgICAgJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnLFxuICAgICAgJ1JhdGUgbGltaXQgZXhjZWVkZWQnXG4gICAgXTtcblxuICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U/LnRvTG93ZXJDYXNlKCkgfHwgJyc7XG4gICAgcmV0dXJuIHJldHJ5YWJsZUVycm9ycy5zb21lKHJldHJ5YWJsZUVycm9yID0+IFxuICAgICAgZXJyb3JNZXNzYWdlLmluY2x1ZGVzKHJldHJ5YWJsZUVycm9yLnRvTG93ZXJDYXNlKCkpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlTWV0cmljcyhzdWNjZXNzOiBib29sZWFuLCBwcm9jZXNzaW5nVGltZTogbnVtYmVyLCBlcnJvcj86IGFueSk6IHZvaWQge1xuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICB0aGlzLm1ldHJpY3MubWVzc2FnZXNQcm9jZXNzZWQrKztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tZXRyaWNzLm1lc3NhZ2VzRmFpbGVkKys7XG4gICAgICBpZiAoZXJyb3I/Lm1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3QgZXJyb3JUeXBlID0gZXJyb3IuY29uc3RydWN0b3IubmFtZTtcbiAgICAgICAgdGhpcy5tZXRyaWNzLmVycm9yc0J5VHlwZVtlcnJvclR5cGVdID0gKHRoaXMubWV0cmljcy5lcnJvcnNCeVR5cGVbZXJyb3JUeXBlXSB8fCAwKSArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWN0dWFsaXphciB0aWVtcG8gcHJvbWVkaW8gZGUgcHJvY2VzYW1pZW50b1xuICAgIGNvbnN0IHRvdGFsTWVzc2FnZXMgPSB0aGlzLm1ldHJpY3MubWVzc2FnZXNQcm9jZXNzZWQgKyB0aGlzLm1ldHJpY3MubWVzc2FnZXNGYWlsZWQ7XG4gICAgdGhpcy5tZXRyaWNzLmF2ZXJhZ2VQcm9jZXNzaW5nVGltZSA9IFxuICAgICAgKHRoaXMubWV0cmljcy5hdmVyYWdlUHJvY2Vzc2luZ1RpbWUgKiAodG90YWxNZXNzYWdlcyAtIDEpICsgcHJvY2Vzc2luZ1RpbWUpIC8gdG90YWxNZXNzYWdlcztcbiAgICBcbiAgICB0aGlzLm1ldHJpY3MubGFzdFByb2Nlc3NlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgLy8gPT09PT0gTcOJVE9ET1MgUMOaQkxJQ09TIFBBUkEgTU9OSVRPUkVPID09PT09XG5cbiAgZ2V0TWV0cmljcygpOiBTUVNNZXRyaWNzIHtcbiAgICByZXR1cm4geyAuLi50aGlzLm1ldHJpY3MgfTtcbiAgfVxuXG4gIGFzeW5jIGdldEhlYWx0aENoZWNrKCk6IFByb21pc2U8U1FTSGVhbHRoQ2hlY2s+IHtcbiAgICAvLyBJbXBsZW1lbnRhciBoZWFsdGggY2hlY2sgcmVhbFxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICAgIHF1ZXVlU3RhdHVzOiAnYXZhaWxhYmxlJyxcbiAgICAgIGxhc3RNZXNzYWdlUHJvY2Vzc2VkOiB0aGlzLm1ldHJpY3MubGFzdFByb2Nlc3NlZEF0LFxuICAgICAgcGVuZGluZ01lc3NhZ2VzOiAwLCAvLyBJbXBsZW1lbnRhciBjb25zdWx0YSByZWFsIGEgU1FTXG4gICAgICBkZWFkTGV0dGVyTWVzc2FnZXM6IDAgLy8gSW1wbGVtZW50YXIgY29uc3VsdGEgcmVhbCBhIERMUVxuICAgIH07XG4gIH1cblxuICByZXNldE1ldHJpY3MoKTogdm9pZCB7XG4gICAgdGhpcy5tZXRyaWNzID0ge1xuICAgICAgbWVzc2FnZXNQcm9jZXNzZWQ6IDAsXG4gICAgICBtZXNzYWdlc0ZhaWxlZDogMCxcbiAgICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogMCxcbiAgICAgIGxhc3RQcm9jZXNzZWRBdDogJycsXG4gICAgICBlcnJvcnNCeVR5cGU6IHt9XG4gICAgfTtcbiAgfVxufVxuXG4iXX0=