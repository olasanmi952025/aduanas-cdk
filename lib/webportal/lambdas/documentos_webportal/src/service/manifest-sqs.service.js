"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ManifestSQSService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestSQSService = void 0;
const common_1 = require("@nestjs/common");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const uuid_1 = require("uuid");
let ManifestSQSService = ManifestSQSService_1 = class ManifestSQSService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ManifestSQSService_1.name);
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        const resolvedEndpoint = this.configService.get("SQS_ENDPOINT_URL");
        // Configurar SQS Client con credenciales si están disponibles (solo para desarrollo local)
        const sqsConfig = {
            endpoint: resolvedEndpoint,
            region,
        };
        // Solo agregar credenciales explícitas si NO estamos en Lambda y están configuradas
        if (!isLambda && accessKeyId && secretAccessKey) {
            sqsConfig.credentials = {
                accessKeyId,
                secretAccessKey,
            };
            this.logger.log('SQS: usando credenciales explícitas (desarrollo local)');
        }
        else if (isLambda) {
            this.logger.log('SQS: usando IAM Role en Lambda');
        }
        else {
            this.logger.log('SQS: usando credenciales por defecto del sistema (~/.aws/credentials o variables de entorno)');
        }
        this.sqsClient = new client_sqs_1.SQSClient(sqsConfig);
        // Usar SQS_QUEUE_URL que es la misma cola que usa el polling process
        this.queueUrl = this.configService.get('SQS_QUEUE_URL') ||
            this.configService.get('MANIFEST_CLOSE_QUEUE_URL') || '';
        if (!this.queueUrl) {
            this.logger.warn('SQS_QUEUE_URL or MANIFEST_CLOSE_QUEUE_URL not configured. SQS messages will not be sent.');
        }
        else {
            this.logger.log(`ManifestSQSService initialized for queue: ${this.queueUrl}`);
        }
    }
    /**
     * Envía un mensaje de cierre de manifiesto directamente a SQS
     * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
     */
    async sendManifestCloseMessage(documentoId, userId, delaySeconds) {
        if (!this.queueUrl) {
            return {
                success: false,
                error: 'SQS_QUEUE_URL not configured',
            };
        }
        try {
            const requestId = (0, uuid_1.v4)();
            const messageId = (0, uuid_1.v4)();
            // Formato compatible con el polling process
            const message = {
                id: messageId,
                type: 'close.manifest',
                payload: {
                    requestId,
                    documentoId,
                    userId,
                    delaySeconds: delaySeconds || 2,
                },
                timestamp: new Date().toISOString(),
                source: 'pweb_ms_documentos',
                correlationId: requestId,
            };
            const command = new client_sqs_1.SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: JSON.stringify(message),
                MessageAttributes: {
                    MessageType: {
                        DataType: 'String',
                        StringValue: 'close.manifest',
                    },
                    RequestId: {
                        DataType: 'String',
                        StringValue: requestId,
                    },
                    DocumentoId: {
                        DataType: 'Number',
                        StringValue: documentoId.toString(),
                    },
                },
            });
            const result = await this.sqsClient.send(command);
            this.logger.log(`Manifest close message sent to SQS. MessageId: ${result.MessageId}, RequestId: ${requestId}, DocumentoId: ${documentoId}`);
            return {
                success: true,
                requestId,
                messageId: result.MessageId || messageId,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send manifest close message. DocumentoId: ${documentoId}, Error: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message || 'Unknown error',
            };
        }
    }
    /**
     * Envía un mensaje de exportación XML directamente a SQS
     * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
     */
    async sendXmlExportMessage(filters, fileName) {
        if (!this.queueUrl) {
            return {
                success: false,
                error: 'SQS_QUEUE_URL not configured',
            };
        }
        try {
            const requestId = (0, uuid_1.v4)();
            const messageId = (0, uuid_1.v4)();
            // Formato compatible con el polling process
            const message = {
                id: messageId,
                type: 'xml.export',
                payload: {
                    requestId,
                    filters,
                    fileName,
                },
                timestamp: new Date().toISOString(),
                source: 'pweb_ms_documentos',
                correlationId: requestId,
            };
            const command = new client_sqs_1.SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: JSON.stringify(message),
                MessageAttributes: {
                    MessageType: {
                        DataType: 'String',
                        StringValue: 'xml.export',
                    },
                    RequestId: {
                        DataType: 'String',
                        StringValue: requestId,
                    },
                },
            });
            const result = await this.sqsClient.send(command);
            this.logger.log(`XML export message sent to SQS. MessageId: ${result.MessageId}, RequestId: ${requestId}`);
            return {
                success: true,
                requestId,
                messageId: result.MessageId || messageId,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send XML export message. Error: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message || 'Unknown error',
            };
        }
    }
};
exports.ManifestSQSService = ManifestSQSService;
exports.ManifestSQSService = ManifestSQSService = ManifestSQSService_1 = __decorate([
    (0, common_1.Injectable)()
], ManifestSQSService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuaWZlc3Qtc3FzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYW5pZmVzdC1zcXMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMkNBQW9EO0FBRXBELG9EQUFvRTtBQUNwRSwrQkFBb0M7QUFpQjdCLElBQU0sa0JBQWtCLDBCQUF4QixNQUFNLGtCQUFrQjtJQUs3QixZQUE2QixhQUE0QjtRQUE1QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUp4QyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsb0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFLNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsWUFBWSxDQUFDLElBQUksV0FBVyxDQUFDO1FBQzNFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLG1CQUFtQixDQUFDLENBQUM7UUFDeEUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsdUJBQXVCLENBQUMsQ0FBQztRQUNoRixNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQztRQUN4RCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLGtCQUFrQixDQUFDLENBQUM7UUFFNUUsMkZBQTJGO1FBQzNGLE1BQU0sU0FBUyxHQUFRO1lBQ3JCLFFBQVEsRUFBRSxnQkFBZ0I7WUFDMUIsTUFBTTtTQUNQLENBQUM7UUFFRixvRkFBb0Y7UUFDcEYsSUFBSSxDQUFDLFFBQVEsSUFBSSxXQUFXLElBQUksZUFBZSxFQUFFLENBQUM7WUFDaEQsU0FBUyxDQUFDLFdBQVcsR0FBRztnQkFDdEIsV0FBVztnQkFDWCxlQUFlO2FBQ2hCLENBQUM7WUFDRixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx3REFBd0Qs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LFdBQVcsRUFBRSxZQUFZO3FCQUMxQjtvQkFDRCxTQUFTLEVBQUU7d0JBQ1QsUUFBUSxFQUFFLFFBQVE7d0JBQ2xCLFdBQVcsRUFBRSxTQUFTO3FCQUN2QjtpQkFDRjthQUNGLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQ2IsOENBQThDLE1BQU0sQ0FBQyxTQUFTLGdCQUFnQixTQUFTLEVBQUUsQ0FDMUYsQ0FBQztZQUVGLE9BQU87Z0JBQ0wsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsU0FBUztnQkFDVCxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxTQUFTO2FBQ3pDLENBQUM7UUFDSixDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZiw2Q0FBNkMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUM1RCxLQUFLLENBQUMsS0FBSyxDQUNaLENBQUM7WUFFRixPQUFPO2dCQUNMLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGVBQWU7YUFDeEMsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQWpNWSxnREFBa0I7NkJBQWxCLGtCQUFrQjtJQUQ5QixJQUFBLG1CQUFVLEdBQUU7R0FDQSxrQkFBa0IsQ0FpTTlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgeyBTUVNDbGllbnQsIFNlbmRNZXNzYWdlQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zcXMnO1xyXG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VuZE1hbmlmZXN0Q2xvc2VSZXN1bHQge1xyXG4gIHN1Y2Nlc3M6IGJvb2xlYW47XHJcbiAgcmVxdWVzdElkPzogc3RyaW5nO1xyXG4gIG1lc3NhZ2VJZD86IHN0cmluZztcclxuICBlcnJvcj86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZW5kWG1sRXhwb3J0UmVzdWx0IHtcclxuICBzdWNjZXNzOiBib29sZWFuO1xyXG4gIHJlcXVlc3RJZD86IHN0cmluZztcclxuICBtZXNzYWdlSWQ/OiBzdHJpbmc7XHJcbiAgZXJyb3I/OiBzdHJpbmc7XHJcbn1cclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE1hbmlmZXN0U1FTU2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKE1hbmlmZXN0U1FTU2VydmljZS5uYW1lKTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHNxc0NsaWVudDogU1FTQ2xpZW50O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgcXVldWVVcmw6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlKSB7XHJcbiAgICBjb25zdCByZWdpb24gPSB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ0FXU19SRUdJT04nKSB8fCAndXMtZWFzdC0xJztcclxuICAgIGNvbnN0IGFjY2Vzc0tleUlkID0gdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdBV1NfQUNDRVNTX0tFWV9JRCcpO1xyXG4gICAgY29uc3Qgc2VjcmV0QWNjZXNzS2V5ID0gdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdBV1NfU0VDUkVUX0FDQ0VTU19LRVknKTtcclxuICAgIGNvbnN0IGlzTGFtYmRhID0gISFwcm9jZXNzLmVudi5BV1NfTEFNQkRBX0ZVTkNUSU9OX05BTUU7XHJcbiAgICBjb25zdCByZXNvbHZlZEVuZHBvaW50ID0gdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KFwiU1FTX0VORFBPSU5UX1VSTFwiKTtcclxuXHJcbiAgICAvLyBDb25maWd1cmFyIFNRUyBDbGllbnQgY29uIGNyZWRlbmNpYWxlcyBzaSBlc3TDoW4gZGlzcG9uaWJsZXMgKHNvbG8gcGFyYSBkZXNhcnJvbGxvIGxvY2FsKVxyXG4gICAgY29uc3Qgc3FzQ29uZmlnOiBhbnkgPSB7XHJcbiAgICAgIGVuZHBvaW50OiByZXNvbHZlZEVuZHBvaW50LFxyXG4gICAgICByZWdpb24sXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFNvbG8gYWdyZWdhciBjcmVkZW5jaWFsZXMgZXhwbMOtY2l0YXMgc2kgTk8gZXN0YW1vcyBlbiBMYW1iZGEgeSBlc3TDoW4gY29uZmlndXJhZGFzXHJcbiAgICBpZiAoIWlzTGFtYmRhICYmIGFjY2Vzc0tleUlkICYmIHNlY3JldEFjY2Vzc0tleSkge1xyXG4gICAgICBzcXNDb25maWcuY3JlZGVudGlhbHMgPSB7XHJcbiAgICAgICAgYWNjZXNzS2V5SWQsXHJcbiAgICAgICAgc2VjcmV0QWNjZXNzS2V5LFxyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coJ1NRUzogdXNhbmRvIGNyZWRlbmNpYWxlcyBleHBsw61jaXRhcyAoZGVzYXJyb2xsbyBsb2NhbCknKTtcclxuICAgIH0gZWxzZSBpZiAoaXNMYW1iZGEpIHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKCdTUVM6IHVzYW5kbyBJQU0gUm9sZSBlbiBMYW1iZGEnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZygnU1FTOiB1c2FuZG8gY3JlZGVuY2lhbGVzIHBvciBkZWZlY3RvIGRlbCBzaXN0ZW1hICh+Ly5hd3MvY3JlZGVudGlhbHMgbyB2YXJpYWJsZXMgZGUgZW50b3JubyknKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNxc0NsaWVudCA9IG5ldyBTUVNDbGllbnQoc3FzQ29uZmlnKTtcclxuICAgIFxyXG4gICAgLy8gVXNhciBTUVNfUVVFVUVfVVJMIHF1ZSBlcyBsYSBtaXNtYSBjb2xhIHF1ZSB1c2EgZWwgcG9sbGluZyBwcm9jZXNzXHJcbiAgICB0aGlzLnF1ZXVlVXJsID0gdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdTUVNfUVVFVUVfVVJMJykgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdNQU5JRkVTVF9DTE9TRV9RVUVVRV9VUkwnKSB8fCAnJztcclxuICAgIFxyXG4gICAgaWYgKCF0aGlzLnF1ZXVlVXJsKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ1NRU19RVUVVRV9VUkwgb3IgTUFOSUZFU1RfQ0xPU0VfUVVFVUVfVVJMIG5vdCBjb25maWd1cmVkLiBTUVMgbWVzc2FnZXMgd2lsbCBub3QgYmUgc2VudC4nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgTWFuaWZlc3RTUVNTZXJ2aWNlIGluaXRpYWxpemVkIGZvciBxdWV1ZTogJHt0aGlzLnF1ZXVlVXJsfWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW52w61hIHVuIG1lbnNhamUgZGUgY2llcnJlIGRlIG1hbmlmaWVzdG8gZGlyZWN0YW1lbnRlIGEgU1FTXHJcbiAgICogRm9ybWF0byBjb21wYXRpYmxlIGNvbiBlbCBwb2xsaW5nIHByb2Nlc3MgKG1hcmNvcy9taW5pbWlzX3B3ZWJfcG9sbGluZ19wcm9jZXNzKVxyXG4gICAqL1xyXG4gIGFzeW5jIHNlbmRNYW5pZmVzdENsb3NlTWVzc2FnZShcclxuICAgIGRvY3VtZW50b0lkOiBudW1iZXIsXHJcbiAgICB1c2VySWQ/OiBzdHJpbmcsXHJcbiAgICBkZWxheVNlY29uZHM/OiBudW1iZXJcclxuICApOiBQcm9taXNlPFNlbmRNYW5pZmVzdENsb3NlUmVzdWx0PiB7XHJcbiAgICBpZiAoIXRoaXMucXVldWVVcmwpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogJ1NRU19RVUVVRV9VUkwgbm90IGNvbmZpZ3VyZWQnLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlcXVlc3RJZCA9IHV1aWR2NCgpO1xyXG4gICAgICBjb25zdCBtZXNzYWdlSWQgPSB1dWlkdjQoKTtcclxuXHJcbiAgICAgIC8vIEZvcm1hdG8gY29tcGF0aWJsZSBjb24gZWwgcG9sbGluZyBwcm9jZXNzXHJcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XHJcbiAgICAgICAgaWQ6IG1lc3NhZ2VJZCxcclxuICAgICAgICB0eXBlOiAnY2xvc2UubWFuaWZlc3QnLFxyXG4gICAgICAgIHBheWxvYWQ6IHtcclxuICAgICAgICAgIHJlcXVlc3RJZCxcclxuICAgICAgICAgIGRvY3VtZW50b0lkLFxyXG4gICAgICAgICAgdXNlcklkLFxyXG4gICAgICAgICAgZGVsYXlTZWNvbmRzOiBkZWxheVNlY29uZHMgfHwgMixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIHNvdXJjZTogJ3B3ZWJfbXNfZG9jdW1lbnRvcycsXHJcbiAgICAgICAgY29ycmVsYXRpb25JZDogcmVxdWVzdElkLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBTZW5kTWVzc2FnZUNvbW1hbmQoe1xyXG4gICAgICAgIFF1ZXVlVXJsOiB0aGlzLnF1ZXVlVXJsLFxyXG4gICAgICAgIE1lc3NhZ2VCb2R5OiBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSxcclxuICAgICAgICBNZXNzYWdlQXR0cmlidXRlczoge1xyXG4gICAgICAgICAgTWVzc2FnZVR5cGU6IHtcclxuICAgICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogJ2Nsb3NlLm1hbmlmZXN0JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBSZXF1ZXN0SWQ6IHtcclxuICAgICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogcmVxdWVzdElkLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIERvY3VtZW50b0lkOiB7XHJcbiAgICAgICAgICAgIERhdGFUeXBlOiAnTnVtYmVyJyxcclxuICAgICAgICAgICAgU3RyaW5nVmFsdWU6IGRvY3VtZW50b0lkLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zcXNDbGllbnQuc2VuZChjb21tYW5kKTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhcclxuICAgICAgICBgTWFuaWZlc3QgY2xvc2UgbWVzc2FnZSBzZW50IHRvIFNRUy4gTWVzc2FnZUlkOiAke3Jlc3VsdC5NZXNzYWdlSWR9LCBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfSwgRG9jdW1lbnRvSWQ6ICR7ZG9jdW1lbnRvSWR9YFxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgIHJlcXVlc3RJZCxcclxuICAgICAgICBtZXNzYWdlSWQ6IHJlc3VsdC5NZXNzYWdlSWQgfHwgbWVzc2FnZUlkLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICBgRmFpbGVkIHRvIHNlbmQgbWFuaWZlc3QgY2xvc2UgbWVzc2FnZS4gRG9jdW1lbnRvSWQ6ICR7ZG9jdW1lbnRvSWR9LCBFcnJvcjogJHtlcnJvci5tZXNzYWdlfWAsXHJcbiAgICAgICAgZXJyb3Iuc3RhY2tcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW52w61hIHVuIG1lbnNhamUgZGUgZXhwb3J0YWNpw7NuIFhNTCBkaXJlY3RhbWVudGUgYSBTUVNcclxuICAgKiBGb3JtYXRvIGNvbXBhdGlibGUgY29uIGVsIHBvbGxpbmcgcHJvY2VzcyAobWFyY29zL21pbmltaXNfcHdlYl9wb2xsaW5nX3Byb2Nlc3MpXHJcbiAgICovXHJcbiAgYXN5bmMgc2VuZFhtbEV4cG9ydE1lc3NhZ2UoXHJcbiAgICBmaWx0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxyXG4gICAgZmlsZU5hbWU/OiBzdHJpbmdcclxuICApOiBQcm9taXNlPFNlbmRYbWxFeHBvcnRSZXN1bHQ+IHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVVybCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiAnU1FTX1FVRVVFX1VSTCBub3QgY29uZmlndXJlZCcsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVxdWVzdElkID0gdXVpZHY0KCk7XHJcbiAgICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHV1aWR2NCgpO1xyXG5cclxuICAgICAgLy8gRm9ybWF0byBjb21wYXRpYmxlIGNvbiBlbCBwb2xsaW5nIHByb2Nlc3NcclxuICAgICAgY29uc3QgbWVzc2FnZSA9IHtcclxuICAgICAgICBpZDogbWVzc2FnZUlkLFxyXG4gICAgICAgIHR5cGU6ICd4bWwuZXhwb3J0JyxcclxuICAgICAgICBwYXlsb2FkOiB7XHJcbiAgICAgICAgICByZXF1ZXN0SWQsXHJcbiAgICAgICAgICBmaWx0ZXJzLFxyXG4gICAgICAgICAgZmlsZU5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBzb3VyY2U6ICdwd2ViX21zX2RvY3VtZW50b3MnLFxyXG4gICAgICAgIGNvcnJlbGF0aW9uSWQ6IHJlcXVlc3RJZCxcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgU2VuZE1lc3NhZ2VDb21tYW5kKHtcclxuICAgICAgICBRdWV1ZVVybDogdGhpcy5xdWV1ZVVybCxcclxuICAgICAgICBNZXNzYWdlQm9keTogSlNPTi5zdHJpbmdpZnkobWVzc2FnZSksXHJcbiAgICAgICAgTWVzc2FnZUF0dHJpYnV0ZXM6IHtcclxuICAgICAgICAgIE1lc3NhZ2VUeXBlOiB7XHJcbiAgICAgICAgICAgIERhdGFUeXBlOiAnU3RyaW5nJyxcclxuICAgICAgICAgICAgU3RyaW5nVmFsdWU6ICd4bWwuZXhwb3J0JyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBSZXF1ZXN0SWQ6IHtcclxuICAgICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgICBTdHJpbmdWYWx1ZTogcmVxdWVzdElkLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3FzQ2xpZW50LnNlbmQoY29tbWFuZCk7XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYFhNTCBleHBvcnQgbWVzc2FnZSBzZW50IHRvIFNRUy4gTWVzc2FnZUlkOiAke3Jlc3VsdC5NZXNzYWdlSWR9LCBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWBcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICByZXF1ZXN0SWQsXHJcbiAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQuTWVzc2FnZUlkIHx8IG1lc3NhZ2VJZCxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgYEZhaWxlZCB0byBzZW5kIFhNTCBleHBvcnQgbWVzc2FnZS4gRXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gLFxyXG4gICAgICAgIGVycm9yLnN0YWNrXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyxcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcbn0iXX0=