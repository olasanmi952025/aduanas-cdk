"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SQSConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSConsumerService = void 0;
const common_1 = require("@nestjs/common");
const excel_generation_service_1 = require("../excel/excel-generation.service");
const pdf_generation_service_1 = require("../pdf/pdf-generation.service");
const xml_generation_service_1 = require("../xml/xml-generation.service");
const client_sqs_1 = require("@aws-sdk/client-sqs");
let SQSConsumerService = SQSConsumerService_1 = class SQSConsumerService {
    constructor(configService, awsConfigService, moduleRef, exportStatusService, s3Service, closeManifestService) {
        this.configService = configService;
        this.awsConfigService = awsConfigService;
        this.moduleRef = moduleRef;
        this.exportStatusService = exportStatusService;
        this.s3Service = s3Service;
        this.closeManifestService = closeManifestService;
        this.logger = new common_1.Logger(SQSConsumerService_1.name);
        this.isListening = false;
        this.queueUrl = this.configService.get('SQS_QUEUE_URL') || '';
        this.sqs = this.awsConfigService.createSQSClient();
        if (!this.queueUrl) {
            this.logger.warn('SQS_QUEUE_URL not configured. Cannot consume messages.');
        }
        else {
            this.logger.log(`SQS Consumer Service initialized for queue: ${this.queueUrl}`);
        }
    }
    async processMessage(message) {
        if (!this.queueUrl) {
            throw new Error('SQS_QUEUE_URL is not configured');
        }
        const messageJson = JSON.stringify(message);
        const messageObject = JSON.parse(messageJson);
        console.log(messageObject.Body);
        try {
            // Validar body
            if (!messageObject.body && !messageObject.Body) {
                this.logger.warn('Message without Body received. Deleting...');
                await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
                return;
            }
            // Parse seguro del Body
            let messageBody;
            try {
                messageBody = JSON.parse(messageObject.body || messageObject.Body);
            }
            catch (parseError) {
                this.logger.error('Invalid JSON body. Deleting message.', parseError);
                await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
                return;
            }
            // Validación de tipo
            if (!messageBody.type && !messageBody.Type) {
                this.logger.warn(`Message without type. Deleting...`);
                await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
                return;
            }
            // Procesar tipos de mensaje
            if (messageBody.type === 'excel.export') {
                await this.processExcelExportMessage(messageBody);
            }
            else if (messageBody.type === 'pdf.export') {
                await this.processPdfExportMessage(messageBody);
            }
            else if (messageBody.type === 'close.manifest') {
                await this.processCloseManifestMessage(messageBody);
            }
            else if (messageBody.type === 'xml.export') {
                await this.processXmlExportMessage(messageBody);
            }
            else {
                this.logger.warn(`Unsupported message type: ${messageBody.type || messageBody.Type}`);
                await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
                return;
            }
            // Eliminar mensaje exitosamente procesado
            await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
            this.logger.log(`Message processed and deleted. MessageId: ${messageObject.messageId || messageObject.MessageId}`);
        }
        catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            throw error;
        }
    }
    async deleteMessage(receiptHandle) {
        if (!receiptHandle) {
            this.logger.error('Missing ReceiptHandle. Cannot delete message.');
            return;
        }
        const command = new client_sqs_1.DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
        });
        await this.sqs.send(command);
    }
    /**
     * Procesa un mensaje de exportación Excel
     * Actualiza el estado a processing, genera el Excel, crea URL firmada y actualiza a completed
     */
    async processExcelExportMessage(message) {
        const { payload } = message;
        const { filters, requestId, fileName, userId } = payload;
        const excelGenerationService = this.moduleRef.get(excel_generation_service_1.ExcelGenerationService, { strict: false });
        try {
            this.logger.log(`Procesando exportación Excel. RequestId: ${requestId}`);
            // Actualizar estado a processing
            await this.exportStatusService.updateToProcessing(requestId);
            // Generar archivo Excel
            const result = await excelGenerationService.generateExcel(filters, requestId, fileName, Number(userId));
            // Generar URL firmada con expiración de 1 hora (3600 segundos)
            const signedUrl = await this.s3Service.getSignedUrl({
                key: result.s3Key,
                expiresIn: 3600,
            });
            // Actualizar estado a completed con URL firmada
            await this.exportStatusService.updateToCompleted(requestId, signedUrl, result.filePath);
            this.logger.log(`Exportación Excel completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`);
        }
        catch (error) {
            this.logger.error(`Error procesando exportación Excel: ${error.message}`, error.stack);
            // Actualizar estado a failed en caso de error
            try {
                await this.exportStatusService.updateToFailed(requestId, error.message || 'Error desconocido');
            }
            catch (statusError) {
                this.logger.error(`Error actualizando estado a failed: ${statusError.message}`, statusError.stack);
            }
            throw error;
        }
    }
    /**
     * Procesa un mensaje de exportación PDF
     * Actualiza el estado a processing, genera el PDF(s), crea URL firmada y actualiza a completed
     */
    async processPdfExportMessage(message) {
        const { payload } = message;
        const { guideIds, requestId, fileName, userId } = payload;
        const pdfGenerationService = this.moduleRef.get(pdf_generation_service_1.PdfGenerationService, { strict: false });
        try {
            this.logger.log(`Procesando exportación PDF. RequestId: ${requestId}, Guías: ${guideIds.join(', ')}`);
            // Actualizar estado a processing
            await this.exportStatusService.updateToProcessing(requestId);
            // Generar archivo(s) PDF
            const result = await pdfGenerationService.generatePdfForGuides(guideIds, requestId, fileName, userId);
            // Generar URL firmada con expiración de 1 hora (3600 segundos)
            const signedUrl = await this.s3Service.getSignedUrl({
                key: result.s3Key,
                expiresIn: 3600,
            });
            // Actualizar estado a completed con URL firmada
            await this.exportStatusService.updateToCompleted(requestId, signedUrl, result.filePath);
            this.logger.log(`Exportación PDF completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`);
        }
        catch (error) {
            this.logger.error(`Error procesando exportación PDF: ${error.message}`, error.stack);
            // Actualizar estado a failed en caso de error
            try {
                await this.exportStatusService.updateToFailed(requestId, error.message || 'Error desconocido');
            }
            catch (statusError) {
                this.logger.error(`Error actualizando estado a failed: ${statusError.message}`, statusError.stack);
            }
            throw error;
        }
    }
    /**
     * Procesa un mensaje de cierre de manifiesto
     * Actualiza el estado a processing, ejecuta el proceso simulado y actualiza a completed/failed
     */
    async processCloseManifestMessage(message) {
        const { payload } = message;
        const { requestId, documentoId, userId, delaySeconds = 2 } = payload;
        try {
            this.logger.log(`Procesando cierre de manifiesto. RequestId: ${requestId}, DocumentoId: ${documentoId}`);
            // Actualizar estado a processing
            await this.exportStatusService.updateToProcessing(requestId);
            // Aplicar delay configurado
            if (delaySeconds > 0) {
                await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            }
            // Ejecutar lógica real de cierre de manifiesto
            await this.closeManifestService.closeManifest(documentoId);
            // Actualizar estado a completed
            // Nota: Para procesos que no generan archivos, usamos un mensaje como fileName
            await this.exportStatusService.updateToCompleted(requestId, 'N/A', // No hay URL para este tipo de proceso
            `Manifest closed successfully - DocumentoId: ${documentoId || 'N/A'}`);
            this.logger.log(`Cierre de manifiesto completado exitosamente. RequestId: ${requestId}`);
        }
        catch (error) {
            this.logger.error(`Error procesando cierre de manifiesto: ${error.message}`, error.stack);
            // Actualizar estado a failed en caso de error
            try {
                await this.exportStatusService.updateToFailed(requestId, error.message || 'Error desconocido');
            }
            catch (statusError) {
                this.logger.error(`Error actualizando estado a failed: ${statusError.message}`, statusError.stack);
            }
            throw error;
        }
    }
    /**
     * Procesa un mensaje de exportación XML
     * Actualiza el estado a processing, genera el XML, crea URL firmada y actualiza a completed
     */
    async processXmlExportMessage(message) {
        const { payload } = message;
        const { filters, requestId, fileName } = payload;
        const xmlGenerationService = this.moduleRef.get(xml_generation_service_1.XmlGenerationService, { strict: false });
        try {
            this.logger.log(`Procesando exportación XML. RequestId: ${requestId}`);
            // Actualizar estado a processing
            await this.exportStatusService.updateToProcessing(requestId);
            // Generar archivo XML
            const result = await xmlGenerationService.generateXml(filters, requestId, fileName);
            // Generar URL firmada con expiración de 1 hora (3600 segundos)
            const signedUrl = await this.s3Service.getSignedUrl({
                key: result.s3Key,
                expiresIn: 3600,
            });
            // Actualizar estado a completed con URL firmada
            await this.exportStatusService.updateToCompleted(requestId, signedUrl, result.filePath);
            this.logger.log(`Exportación XML completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`);
        }
        catch (error) {
            this.logger.error(`Error procesando exportación XML: ${error.message}`, error.stack);
            // Actualizar estado a failed en caso de error
            try {
                await this.exportStatusService.updateToFailed(requestId, error.message || 'Error desconocido');
            }
            catch (statusError) {
                this.logger.error(`Error actualizando estado a failed: ${statusError.message}`, statusError.stack);
            }
            throw error;
        }
    }
    /**
     * Consume y procesa un mensaje de la cola SQS
     * @param waitTimeSeconds Tiempo de espera para long polling (0 = no esperar)
     */
    async consumeAndProcessMessage(waitTimeSeconds = 0) {
        if (!this.queueUrl) {
            throw new Error('SQS_QUEUE_URL is not configured');
        }
        try {
            const receiveCommand = new client_sqs_1.ReceiveMessageCommand({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: waitTimeSeconds,
                MessageAttributeNames: ['All'],
            });
            const result = await this.sqs.send(receiveCommand);
            if (!result.Messages || result.Messages.length === 0) {
                this.logger.debug('No hay mensajes en la cola');
                return false;
            }
            const message = result.Messages[0];
            this.logger.log(`Mensaje recibido de SQS. MessageId: ${message.MessageId}`);
            try {
                await this.processMessage(message);
                return true;
            }
            catch (error) {
                this.logger.error(`Error processing message: ${error.message}`, error.stack);
                throw error;
            }
        }
        catch (error) {
            this.logger.error(`Error consuming message from SQS: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Inicia el listener continuo para consumir mensajes de SQS
     * Usa long polling con waitTimeSeconds de 10 segundos
     */
    async listen() {
        if (!this.queueUrl) {
            this.logger.warn('SQS_QUEUE_URL no configurado. No se puede iniciar el listener.');
            return;
        }
        if (this.isListening) {
            this.logger.warn('El listener ya está ejecutándose.');
            return;
        }
        this.isListening = true;
        this.logger.log('Escuchando mensajes de SQS...');
        while (this.isListening) {
            try {
                const hasMessage = await this.consumeAndProcessMessage(10);
                if (!hasMessage) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                this.logger.error(`Error in listener loop: ${error.message}`, error.stack);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        this.logger.log('Listener detenido.');
    }
    /**
     * Detiene el listener de SQS
     */
    stop() {
        this.isListening = false;
        this.logger.log('Deteniendo listener...');
    }
    getStatus() {
        return {
            queueUrl: this.queueUrl || 'Not configured',
            isListening: this.isListening,
        };
    }
};
exports.SQSConsumerService = SQSConsumerService;
exports.SQSConsumerService = SQSConsumerService = SQSConsumerService_1 = __decorate([
    (0, common_1.Injectable)()
], SQSConsumerService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLWNvbnN1bWVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMtY29uc3VtZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBR0EsMkNBQW9EO0FBQ3BELGdGQUEyRTtBQUMzRSwwRUFBcUU7QUFDckUsMEVBQXFFO0FBS3JFLG9EQUFzRztBQUcvRixJQUFNLGtCQUFrQiwwQkFBeEIsTUFBTSxrQkFBa0I7SUFNN0IsWUFDbUIsYUFBNEIsRUFDNUIsZ0JBQWtDLEVBQ2xDLFNBQW9CLEVBQ3BCLG1CQUF3QyxFQUN4QyxTQUFvQixFQUNwQixvQkFBMEM7UUFMMUMsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFDNUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQ3BCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7UUFDeEMsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNwQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1FBWDVDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxvQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUd0RCxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQVVuQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUVuRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdEQUF3RCxDQUFDLENBQUM7UUFDN0UsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQ0FBK0MsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFD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QkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNoQixNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO1lBQ0gsQ0FBQztZQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLDJCQUEyQixLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJO1FBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsU0FBUztRQUNQLE9BQU87WUFDTCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxnQkFBZ0I7WUFDM0MsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1NBQzlCLENBQUM7SUFDSixDQUFDO0NBQ0YsQ0FBQTtBQS9aWSxnREFBa0I7NkJBQWxCLGtCQUFrQjtJQUQ5QixJQUFBLG1CQUFVLEdBQUU7R0FDQSxrQkFBa0IsQ0ErWjlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlUmVmIH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcbmltcG9ydCB7IEFXU0NvbmZpZ1NlcnZpY2UgfSBmcm9tICcuLi9hd3MnO1xuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcbmltcG9ydCB7IEluamVjdGFibGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7IEV4Y2VsR2VuZXJhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9leGNlbC9leGNlbC1nZW5lcmF0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgUGRmR2VuZXJhdGlvblNlcnZpY2UgfSBmcm9tICcuLi9wZGYvcGRmLWdlbmVyYXRpb24uc2VydmljZSc7XG5pbXBvcnQgeyBYbWxHZW5lcmF0aW9uU2VydmljZSB9IGZyb20gJy4uL3htbC94bWwtZ2VuZXJhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IEV4Y2VsRXhwb3J0TWVzc2FnZSwgUGRmRXhwb3J0TWVzc2FnZSwgQ2xvc2VNYW5pZmVzdE1lc3NhZ2UsIFhtbEV4cG9ydE1lc3NhZ2UsIFNRU01lc3NhZ2UgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL3Nxcy1tZXNzYWdlLmludGVyZmFjZSc7XG5pbXBvcnQgeyBFeHBvcnRTdGF0dXNTZXJ2aWNlIH0gZnJvbSAnLi4vZXhwb3J0LXN0YXR1cyc7XG5pbXBvcnQgeyBTM1NlcnZpY2UgfSBmcm9tICcuLi9zMyc7XG5pbXBvcnQgeyBDbG9zZU1hbmlmZXN0U2VydmljZSB9IGZyb20gJy4uL21hbmlmaWVzdG8nO1xuaW1wb3J0IHsgU1FTQ2xpZW50LCBEZWxldGVNZXNzYWdlQ29tbWFuZCwgUmVjZWl2ZU1lc3NhZ2VDb21tYW5kLCBNZXNzYWdlIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNxcyc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBTUVNDb25zdW1lclNlcnZpY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoU1FTQ29uc3VtZXJTZXJ2aWNlLm5hbWUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHNxczogU1FTQ2xpZW50O1xuICBwcml2YXRlIHJlYWRvbmx5IHF1ZXVlVXJsOiBzdHJpbmc7XG4gIHByaXZhdGUgaXNMaXN0ZW5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBhd3NDb25maWdTZXJ2aWNlOiBBV1NDb25maWdTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbW9kdWxlUmVmOiBNb2R1bGVSZWYsXG4gICAgcHJpdmF0ZSByZWFkb25seSBleHBvcnRTdGF0dXNTZXJ2aWNlOiBFeHBvcnRTdGF0dXNTZXJ2aWNlLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgczNTZXJ2aWNlOiBTM1NlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSBjbG9zZU1hbmlmZXN0U2VydmljZTogQ2xvc2VNYW5pZmVzdFNlcnZpY2UsXG4gICkge1xuICAgIHRoaXMucXVldWVVcmwgPSB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ1NRU19RVUVVRV9VUkwnKSB8fCAnJztcbiAgICB0aGlzLnNxcyA9IHRoaXMuYXdzQ29uZmlnU2VydmljZS5jcmVhdGVTUVNDbGllbnQoKTtcblxuICAgIGlmICghdGhpcy5xdWV1ZVVybCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybignU1FTX1FVRVVFX1VSTCBub3QgY29uZmlndXJlZC4gQ2Fubm90IGNvbnN1bWUgbWVzc2FnZXMuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgU1FTIENvbnN1bWVyIFNlcnZpY2UgaW5pdGlhbGl6ZWQgZm9yIHF1ZXVlOiAke3RoaXMucXVldWVVcmx9YCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc01lc3NhZ2UobWVzc2FnZTogTWVzc2FnZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5xdWV1ZVVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTUVNfUVVFVUVfVVJMIGlzIG5vdCBjb25maWd1cmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWVzc2FnZUpzb24gPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgICBjb25zdCBtZXNzYWdlT2JqZWN0ID0gSlNPTi5wYXJzZShtZXNzYWdlSnNvbik7XG4gICAgY29uc29sZS5sb2cobWVzc2FnZU9iamVjdC5Cb2R5KTtcbiAgXG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXIgYm9keVxuICAgICAgaWYgKCFtZXNzYWdlT2JqZWN0LmJvZHkgJiYgIW1lc3NhZ2VPYmplY3QuQm9keSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdNZXNzYWdlIHdpdGhvdXQgQm9keSByZWNlaXZlZC4gRGVsZXRpbmcuLi4nKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVNZXNzYWdlKG1lc3NhZ2VPYmplY3QucmVjZWlwdEhhbmRsZSB8fCBtZXNzYWdlT2JqZWN0LlJlY2VpcHRIYW5kbGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gIFxuICAgICAgLy8gUGFyc2Ugc2VndXJvIGRlbCBCb2R5XG4gICAgICBsZXQgbWVzc2FnZUJvZHk6IFNRU01lc3NhZ2U7XG4gICAgICB0cnkge1xuICAgICAgICBtZXNzYWdlQm9keSA9IEpTT04ucGFyc2UobWVzc2FnZU9iamVjdC5ib2R5IHx8IG1lc3NhZ2VPYmplY3QuQm9keSk7XG4gICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdJbnZhbGlkIEpTT04gYm9keS4gRGVsZXRpbmcgbWVzc2FnZS4nLCBwYXJzZUVycm9yKTtcbiAgICAgICAgYXdhaXQgdGhpcy5kZWxldGVNZXNzYWdlKG1lc3NhZ2VPYmplY3QucmVjZWlwdEhhbmRsZSB8fCBtZXNzYWdlT2JqZWN0LlJlY2VpcHRIYW5kbGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gIFxuICAgICAgLy8gVmFsaWRhY2nDs24gZGUgdGlwb1xuICAgICAgaWYgKCFtZXNzYWdlQm9keS50eXBlICYmICFtZXNzYWdlQm9keS5UeXBlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYE1lc3NhZ2Ugd2l0aG91dCB0eXBlLiBEZWxldGluZy4uLmApO1xuICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZU1lc3NhZ2UobWVzc2FnZU9iamVjdC5yZWNlaXB0SGFuZGxlIHx8IG1lc3NhZ2VPYmplY3QuUmVjZWlwdEhhbmRsZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgXG4gICAgICAvLyBQcm9jZXNhciB0aXBvcyBkZSBtZW5zYWplXG4gICAgICBpZiAobWVzc2FnZUJvZHkudHlwZSA9PT0gJ2V4Y2VsLmV4cG9ydCcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzRXhjZWxFeHBvcnRNZXNzYWdlKG1lc3NhZ2VCb2R5IGFzIEV4Y2VsRXhwb3J0TWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKG1lc3NhZ2VCb2R5LnR5cGUgPT09ICdwZGYuZXhwb3J0Jykge1xuICAgICAgICBhd2FpdCB0aGlzLnByb2Nlc3NQZGZFeHBvcnRNZXNzYWdlKG1lc3NhZ2VCb2R5IGFzIFBkZkV4cG9ydE1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIGlmKG1lc3NhZ2VCb2R5LnR5cGUgPT09ICdjbG9zZS5tYW5pZmVzdCcpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzQ2xvc2VNYW5pZmVzdE1lc3NhZ2UobWVzc2FnZUJvZHkgYXMgQ2xvc2VNYW5pZmVzdE1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIGlmKG1lc3NhZ2VCb2R5LnR5cGUgPT09ICd4bWwuZXhwb3J0Jykge1xuICAgICAgICBhd2FpdCB0aGlzLnByb2Nlc3NYbWxFeHBvcnRNZXNzYWdlKG1lc3NhZ2VCb2R5IGFzIFhtbEV4cG9ydE1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihgVW5zdXBwb3J0ZWQgbWVzc2FnZSB0eXBlOiAke21lc3NhZ2VCb2R5LnR5cGUgfHwgbWVzc2FnZUJvZHkuVHlwZSB9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlTWVzc2FnZShtZXNzYWdlT2JqZWN0LnJlY2VpcHRIYW5kbGUgfHwgbWVzc2FnZU9iamVjdC5SZWNlaXB0SGFuZGxlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICBcbiAgICAgIC8vIEVsaW1pbmFyIG1lbnNhamUgZXhpdG9zYW1lbnRlIHByb2Nlc2Fkb1xuICAgICAgYXdhaXQgdGhpcy5kZWxldGVNZXNzYWdlKG1lc3NhZ2VPYmplY3QucmVjZWlwdEhhbmRsZSB8fCBtZXNzYWdlT2JqZWN0LlJlY2VpcHRIYW5kbGUpO1xuICAgICAgdGhpcy5sb2dnZXIubG9nKGBNZXNzYWdlIHByb2Nlc3NlZCBhbmQgZGVsZXRlZC4gTWVzc2FnZUlkOiAke21lc3NhZ2VPYmplY3QubWVzc2FnZUlkIHx8IG1lc3NhZ2VPYmplY3QuTWVzc2FnZUlkIH1gKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyBtZXNzYWdlOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9ICBcblxuICBwcml2YXRlIGFzeW5jIGRlbGV0ZU1lc3NhZ2UocmVjZWlwdEhhbmRsZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFyZWNlaXB0SGFuZGxlKSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcignTWlzc2luZyBSZWNlaXB0SGFuZGxlLiBDYW5ub3QgZGVsZXRlIG1lc3NhZ2UuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICBcbiAgICBjb25zdCBjb21tYW5kID0gbmV3IERlbGV0ZU1lc3NhZ2VDb21tYW5kKHtcbiAgICAgIFF1ZXVlVXJsOiB0aGlzLnF1ZXVlVXJsLFxuICAgICAgUmVjZWlwdEhhbmRsZTogcmVjZWlwdEhhbmRsZSxcbiAgICB9KTtcbiAgXG4gICAgYXdhaXQgdGhpcy5zcXMuc2VuZChjb21tYW5kKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNhIHVuIG1lbnNhamUgZGUgZXhwb3J0YWNpw7NuIEV4Y2VsXG4gICAqIEFjdHVhbGl6YSBlbCBlc3RhZG8gYSBwcm9jZXNzaW5nLCBnZW5lcmEgZWwgRXhjZWwsIGNyZWEgVVJMIGZpcm1hZGEgeSBhY3R1YWxpemEgYSBjb21wbGV0ZWRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0V4Y2VsRXhwb3J0TWVzc2FnZShtZXNzYWdlOiBFeGNlbEV4cG9ydE1lc3NhZ2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHBheWxvYWQgfSA9IG1lc3NhZ2U7XG4gICAgY29uc3QgeyBmaWx0ZXJzLCByZXF1ZXN0SWQsIGZpbGVOYW1lLCB1c2VySWQgfSA9IHBheWxvYWQ7XG5cbiAgICBjb25zdCBleGNlbEdlbmVyYXRpb25TZXJ2aWNlID0gdGhpcy5tb2R1bGVSZWYuZ2V0KEV4Y2VsR2VuZXJhdGlvblNlcnZpY2UsIHsgc3RyaWN0OiBmYWxzZSB9KTtcblxuICAgIHRyeSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFByb2Nlc2FuZG8gZXhwb3J0YWNpw7NuIEV4Y2VsLiBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWApO1xuICAgICAgXG4gICAgICAvLyBBY3R1YWxpemFyIGVzdGFkbyBhIHByb2Nlc3NpbmdcbiAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb1Byb2Nlc3NpbmcocmVxdWVzdElkKTtcblxuICAgICAgLy8gR2VuZXJhciBhcmNoaXZvIEV4Y2VsXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGNlbEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhjZWwoXG4gICAgICAgIGZpbHRlcnMsXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgIE51bWJlcih1c2VySWQpLFxuICAgICAgKTtcblxuICAgICAgLy8gR2VuZXJhciBVUkwgZmlybWFkYSBjb24gZXhwaXJhY2nDs24gZGUgMSBob3JhICgzNjAwIHNlZ3VuZG9zKVxuICAgICAgY29uc3Qgc2lnbmVkVXJsID0gYXdhaXQgdGhpcy5zM1NlcnZpY2UuZ2V0U2lnbmVkVXJsKHtcbiAgICAgICAga2V5OiByZXN1bHQuczNLZXksXG4gICAgICAgIGV4cGlyZXNJbjogMzYwMCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBY3R1YWxpemFyIGVzdGFkbyBhIGNvbXBsZXRlZCBjb24gVVJMIGZpcm1hZGFcbiAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb0NvbXBsZXRlZChcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICBzaWduZWRVcmwsXG4gICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhcbiAgICAgICAgYEV4cG9ydGFjacOzbiBFeGNlbCBjb21wbGV0YWRhIGV4aXRvc2FtZW50ZS4gUmVxdWVzdElkOiAke3JlcXVlc3RJZH0sIFMzVXJsOiAke3Jlc3VsdC5zM1VybH1gLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgcHJvY2VzYW5kbyBleHBvcnRhY2nDs24gRXhjZWw6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XG4gICAgICBcbiAgICAgIC8vIEFjdHVhbGl6YXIgZXN0YWRvIGEgZmFpbGVkIGVuIGNhc28gZGUgZXJyb3JcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb0ZhaWxlZChcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgZGVzY29ub2NpZG8nLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoc3RhdHVzRXJyb3I6IGFueSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRXJyb3IgYWN0dWFsaXphbmRvIGVzdGFkbyBhIGZhaWxlZDogJHtzdGF0dXNFcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgc3RhdHVzRXJyb3Iuc3RhY2ssXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNhIHVuIG1lbnNhamUgZGUgZXhwb3J0YWNpw7NuIFBERlxuICAgKiBBY3R1YWxpemEgZWwgZXN0YWRvIGEgcHJvY2Vzc2luZywgZ2VuZXJhIGVsIFBERihzKSwgY3JlYSBVUkwgZmlybWFkYSB5IGFjdHVhbGl6YSBhIGNvbXBsZXRlZFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzUGRmRXhwb3J0TWVzc2FnZShtZXNzYWdlOiBQZGZFeHBvcnRNZXNzYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwYXlsb2FkIH0gPSBtZXNzYWdlO1xuICAgIGNvbnN0IHsgZ3VpZGVJZHMsIHJlcXVlc3RJZCwgZmlsZU5hbWUsIHVzZXJJZCB9ID0gcGF5bG9hZDtcblxuICAgIGNvbnN0IHBkZkdlbmVyYXRpb25TZXJ2aWNlID0gdGhpcy5tb2R1bGVSZWYuZ2V0KFBkZkdlbmVyYXRpb25TZXJ2aWNlLCB7IHN0cmljdDogZmFsc2UgfSk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5sb2dnZXIubG9nKGBQcm9jZXNhbmRvIGV4cG9ydGFjacOzbiBQREYuIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBHdcOtYXM6ICR7Z3VpZGVJZHMuam9pbignLCAnKX1gKTtcbiAgICAgIFxuICAgICAgLy8gQWN0dWFsaXphciBlc3RhZG8gYSBwcm9jZXNzaW5nXG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydFN0YXR1c1NlcnZpY2UudXBkYXRlVG9Qcm9jZXNzaW5nKHJlcXVlc3RJZCk7XG5cbiAgICAgIC8vIEdlbmVyYXIgYXJjaGl2byhzKSBQREZcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBkZkdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlUGRmRm9yR3VpZGVzKFxuICAgICAgICBndWlkZUlkcyxcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgdXNlcklkLFxuICAgICAgKTtcblxuICAgICAgLy8gR2VuZXJhciBVUkwgZmlybWFkYSBjb24gZXhwaXJhY2nDs24gZGUgMSBob3JhICgzNjAwIHNlZ3VuZG9zKVxuICAgICAgY29uc3Qgc2lnbmVkVXJsID0gYXdhaXQgdGhpcy5zM1NlcnZpY2UuZ2V0U2lnbmVkVXJsKHtcbiAgICAgICAga2V5OiByZXN1bHQuczNLZXksXG4gICAgICAgIGV4cGlyZXNJbjogMzYwMCxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBY3R1YWxpemFyIGVzdGFkbyBhIGNvbXBsZXRlZCBjb24gVVJMIGZpcm1hZGFcbiAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb0NvbXBsZXRlZChcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICBzaWduZWRVcmwsXG4gICAgICAgIHJlc3VsdC5maWxlUGF0aCxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhcbiAgICAgICAgYEV4cG9ydGFjacOzbiBQREYgY29tcGxldGFkYSBleGl0b3NhbWVudGUuIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBTM1VybDogJHtyZXN1bHQuczNVcmx9YCxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc2FuZG8gZXhwb3J0YWNpw7NuIFBERjogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgIFxuICAgICAgLy8gQWN0dWFsaXphciBlc3RhZG8gYSBmYWlsZWQgZW4gY2FzbyBkZSBlcnJvclxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLnVwZGF0ZVRvRmFpbGVkKFxuICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICBlcnJvci5tZXNzYWdlIHx8ICdFcnJvciBkZXNjb25vY2lkbycsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChzdGF0dXNFcnJvcjogYW55KSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFxuICAgICAgICAgIGBFcnJvciBhY3R1YWxpemFuZG8gZXN0YWRvIGEgZmFpbGVkOiAke3N0YXR1c0Vycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAgICBzdGF0dXNFcnJvci5zdGFjayxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc2EgdW4gbWVuc2FqZSBkZSBjaWVycmUgZGUgbWFuaWZpZXN0b1xuICAgKiBBY3R1YWxpemEgZWwgZXN0YWRvIGEgcHJvY2Vzc2luZywgZWplY3V0YSBlbCBwcm9jZXNvIHNpbXVsYWRvIHkgYWN0dWFsaXphIGEgY29tcGxldGVkL2ZhaWxlZFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzQ2xvc2VNYW5pZmVzdE1lc3NhZ2UobWVzc2FnZTogQ2xvc2VNYW5pZmVzdE1lc3NhZ2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHBheWxvYWQgfSA9IG1lc3NhZ2U7XG4gICAgY29uc3QgeyByZXF1ZXN0SWQsIGRvY3VtZW50b0lkLCB1c2VySWQsIGRlbGF5U2Vjb25kcyA9IDIgfSA9IHBheWxvYWQ7XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5sb2dnZXIubG9nKGBQcm9jZXNhbmRvIGNpZXJyZSBkZSBtYW5pZmllc3RvLiBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfSwgRG9jdW1lbnRvSWQ6ICR7ZG9jdW1lbnRvSWR9YCk7XG4gICAgICBcbiAgICAgIC8vIEFjdHVhbGl6YXIgZXN0YWRvIGEgcHJvY2Vzc2luZ1xuICAgICAgYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLnVwZGF0ZVRvUHJvY2Vzc2luZyhyZXF1ZXN0SWQpO1xuXG4gICAgICAvLyBBcGxpY2FyIGRlbGF5IGNvbmZpZ3VyYWRvXG4gICAgICBpZiAoZGVsYXlTZWNvbmRzID4gMCkge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgZGVsYXlTZWNvbmRzICogMTAwMCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBFamVjdXRhciBsw7NnaWNhIHJlYWwgZGUgY2llcnJlIGRlIG1hbmlmaWVzdG9cbiAgICAgIGF3YWl0IHRoaXMuY2xvc2VNYW5pZmVzdFNlcnZpY2UuY2xvc2VNYW5pZmVzdChkb2N1bWVudG9JZCBhcyBudW1iZXIpO1xuXG4gICAgICAvLyBBY3R1YWxpemFyIGVzdGFkbyBhIGNvbXBsZXRlZFxuICAgICAgLy8gTm90YTogUGFyYSBwcm9jZXNvcyBxdWUgbm8gZ2VuZXJhbiBhcmNoaXZvcywgdXNhbW9zIHVuIG1lbnNhamUgY29tbyBmaWxlTmFtZVxuICAgICAgYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLnVwZGF0ZVRvQ29tcGxldGVkKFxuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICdOL0EnLCAvLyBObyBoYXkgVVJMIHBhcmEgZXN0ZSB0aXBvIGRlIHByb2Nlc29cbiAgICAgICAgYE1hbmlmZXN0IGNsb3NlZCBzdWNjZXNzZnVsbHkgLSBEb2N1bWVudG9JZDogJHtkb2N1bWVudG9JZCB8fCAnTi9BJ31gLFxuICAgICAgKTtcblxuICAgICAgdGhpcy5sb2dnZXIubG9nKFxuICAgICAgICBgQ2llcnJlIGRlIG1hbmlmaWVzdG8gY29tcGxldGFkbyBleGl0b3NhbWVudGUuIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9YCxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc2FuZG8gY2llcnJlIGRlIG1hbmlmaWVzdG86ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XG4gICAgICBcbiAgICAgIC8vIEFjdHVhbGl6YXIgZXN0YWRvIGEgZmFpbGVkIGVuIGNhc28gZGUgZXJyb3JcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb0ZhaWxlZChcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgZGVzY29ub2NpZG8nLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoc3RhdHVzRXJyb3I6IGFueSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRXJyb3IgYWN0dWFsaXphbmRvIGVzdGFkbyBhIGZhaWxlZDogJHtzdGF0dXNFcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgc3RhdHVzRXJyb3Iuc3RhY2ssXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNhIHVuIG1lbnNhamUgZGUgZXhwb3J0YWNpw7NuIFhNTFxuICAgKiBBY3R1YWxpemEgZWwgZXN0YWRvIGEgcHJvY2Vzc2luZywgZ2VuZXJhIGVsIFhNTCwgY3JlYSBVUkwgZmlybWFkYSB5IGFjdHVhbGl6YSBhIGNvbXBsZXRlZFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzWG1sRXhwb3J0TWVzc2FnZShtZXNzYWdlOiBYbWxFeHBvcnRNZXNzYWdlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwYXlsb2FkIH0gPSBtZXNzYWdlO1xuICAgIGNvbnN0IHsgZmlsdGVycywgcmVxdWVzdElkLCBmaWxlTmFtZSB9ID0gcGF5bG9hZDtcblxuICAgIGNvbnN0IHhtbEdlbmVyYXRpb25TZXJ2aWNlID0gdGhpcy5tb2R1bGVSZWYuZ2V0KFhtbEdlbmVyYXRpb25TZXJ2aWNlLCB7IHN0cmljdDogZmFsc2UgfSk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5sb2dnZXIubG9nKGBQcm9jZXNhbmRvIGV4cG9ydGFjacOzbiBYTUwuIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9YCk7XG4gICAgICBcbiAgICAgIC8vIEFjdHVhbGl6YXIgZXN0YWRvIGEgcHJvY2Vzc2luZ1xuICAgICAgYXdhaXQgdGhpcy5leHBvcnRTdGF0dXNTZXJ2aWNlLnVwZGF0ZVRvUHJvY2Vzc2luZyhyZXF1ZXN0SWQpO1xuXG4gICAgICAvLyBHZW5lcmFyIGFyY2hpdm8gWE1MXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB4bWxHZW5lcmF0aW9uU2VydmljZS5nZW5lcmF0ZVhtbChcbiAgICAgICAgZmlsdGVycyxcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICk7XG5cbiAgICAgIC8vIEdlbmVyYXIgVVJMIGZpcm1hZGEgY29uIGV4cGlyYWNpw7NuIGRlIDEgaG9yYSAoMzYwMCBzZWd1bmRvcylcbiAgICAgIGNvbnN0IHNpZ25lZFVybCA9IGF3YWl0IHRoaXMuczNTZXJ2aWNlLmdldFNpZ25lZFVybCh7XG4gICAgICAgIGtleTogcmVzdWx0LnMzS2V5LFxuICAgICAgICBleHBpcmVzSW46IDM2MDAsXG4gICAgICB9KTtcblxuICAgICAgLy8gQWN0dWFsaXphciBlc3RhZG8gYSBjb21wbGV0ZWQgY29uIFVSTCBmaXJtYWRhXG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydFN0YXR1c1NlcnZpY2UudXBkYXRlVG9Db21wbGV0ZWQoXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgc2lnbmVkVXJsLFxuICAgICAgICByZXN1bHQuZmlsZVBhdGgsXG4gICAgICApO1xuXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXG4gICAgICAgIGBFeHBvcnRhY2nDs24gWE1MIGNvbXBsZXRhZGEgZXhpdG9zYW1lbnRlLiBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfSwgUzNVcmw6ICR7cmVzdWx0LnMzVXJsfWAsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBwcm9jZXNhbmRvIGV4cG9ydGFjacOzbiBYTUw6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XG4gICAgICBcbiAgICAgIC8vIEFjdHVhbGl6YXIgZXN0YWRvIGEgZmFpbGVkIGVuIGNhc28gZGUgZXJyb3JcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhwb3J0U3RhdHVzU2VydmljZS51cGRhdGVUb0ZhaWxlZChcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgZGVzY29ub2NpZG8nLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoc3RhdHVzRXJyb3I6IGFueSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRXJyb3IgYWN0dWFsaXphbmRvIGVzdGFkbyBhIGZhaWxlZDogJHtzdGF0dXNFcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgc3RhdHVzRXJyb3Iuc3RhY2ssXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdW1lIHkgcHJvY2VzYSB1biBtZW5zYWplIGRlIGxhIGNvbGEgU1FTXG4gICAqIEBwYXJhbSB3YWl0VGltZVNlY29uZHMgVGllbXBvIGRlIGVzcGVyYSBwYXJhIGxvbmcgcG9sbGluZyAoMCA9IG5vIGVzcGVyYXIpXG4gICAqL1xuICBhc3luYyBjb25zdW1lQW5kUHJvY2Vzc01lc3NhZ2Uod2FpdFRpbWVTZWNvbmRzOiBudW1iZXIgPSAwKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCF0aGlzLnF1ZXVlVXJsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NRU19RVUVVRV9VUkwgaXMgbm90IGNvbmZpZ3VyZWQnKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVjZWl2ZUNvbW1hbmQgPSBuZXcgUmVjZWl2ZU1lc3NhZ2VDb21tYW5kKHtcbiAgICAgICAgUXVldWVVcmw6IHRoaXMucXVldWVVcmwsXG4gICAgICAgIE1heE51bWJlck9mTWVzc2FnZXM6IDEsXG4gICAgICAgIFdhaXRUaW1lU2Vjb25kczogd2FpdFRpbWVTZWNvbmRzLFxuICAgICAgICBNZXNzYWdlQXR0cmlidXRlTmFtZXM6IFsnQWxsJ10sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zcXMuc2VuZChyZWNlaXZlQ29tbWFuZCk7XG5cbiAgICAgIGlmICghcmVzdWx0Lk1lc3NhZ2VzIHx8IHJlc3VsdC5NZXNzYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ05vIGhheSBtZW5zYWplcyBlbiBsYSBjb2xhJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVzc2FnZSA9IHJlc3VsdC5NZXNzYWdlc1swXTtcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgTWVuc2FqZSByZWNpYmlkbyBkZSBTUVMuIE1lc3NhZ2VJZDogJHttZXNzYWdlLk1lc3NhZ2VJZH1gKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIG1lc3NhZ2U6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjb25zdW1pbmcgbWVzc2FnZSBmcm9tIFNRUzogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmljaWEgZWwgbGlzdGVuZXIgY29udGludW8gcGFyYSBjb25zdW1pciBtZW5zYWplcyBkZSBTUVNcbiAgICogVXNhIGxvbmcgcG9sbGluZyBjb24gd2FpdFRpbWVTZWNvbmRzIGRlIDEwIHNlZ3VuZG9zXG4gICAqL1xuICBhc3luYyBsaXN0ZW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLnF1ZXVlVXJsKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdTUVNfUVVFVUVfVVJMIG5vIGNvbmZpZ3VyYWRvLiBObyBzZSBwdWVkZSBpbmljaWFyIGVsIGxpc3RlbmVyLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzTGlzdGVuaW5nKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdFbCBsaXN0ZW5lciB5YSBlc3TDoSBlamVjdXTDoW5kb3NlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaXNMaXN0ZW5pbmcgPSB0cnVlO1xuICAgIHRoaXMubG9nZ2VyLmxvZygnRXNjdWNoYW5kbyBtZW5zYWplcyBkZSBTUVMuLi4nKTtcblxuICAgIHdoaWxlICh0aGlzLmlzTGlzdGVuaW5nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBoYXNNZXNzYWdlID0gYXdhaXQgdGhpcy5jb25zdW1lQW5kUHJvY2Vzc01lc3NhZ2UoMTApO1xuICAgICAgICBpZiAoIWhhc01lc3NhZ2UpIHtcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBpbiBsaXN0ZW5lciBsb29wOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmxvZygnTGlzdGVuZXIgZGV0ZW5pZG8uJyk7XG4gIH1cblxuICAvKipcbiAgICogRGV0aWVuZSBlbCBsaXN0ZW5lciBkZSBTUVNcbiAgICovXG4gIHN0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pc0xpc3RlbmluZyA9IGZhbHNlO1xuICAgIHRoaXMubG9nZ2VyLmxvZygnRGV0ZW5pZW5kbyBsaXN0ZW5lci4uLicpO1xuICB9XG5cbiAgZ2V0U3RhdHVzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBxdWV1ZVVybDogdGhpcy5xdWV1ZVVybCB8fCAnTm90IGNvbmZpZ3VyZWQnLFxuICAgICAgaXNMaXN0ZW5pbmc6IHRoaXMuaXNMaXN0ZW5pbmcsXG4gICAgfTtcbiAgfVxufVxuXG4iXX0=