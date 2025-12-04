"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SQSProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSProducerService = void 0;
const uuid_1 = require("uuid");
const common_1 = require("@nestjs/common");
const client_sqs_1 = require("@aws-sdk/client-sqs");
let SQSProducerService = SQSProducerService_1 = class SQSProducerService {
    constructor(configService, awsConfigService) {
        this.configService = configService;
        this.awsConfigService = awsConfigService;
        this.logger = new common_1.Logger(SQSProducerService_1.name);
        this.queueUrl = this.configService.get('SQS_QUEUE_URL') || '';
        this.sqs = this.awsConfigService.createSQSClient();
        if (!this.queueUrl) {
            this.logger.warn('SQS_QUEUE_URL no configurado. Los mensajes no se enviarán.');
        }
        this.logger.log(`SQS Producer inicializado - QueueUrl: ${this.queueUrl}`);
    }
    /**
     * Envía un mensaje a la cola SQS para exportar Excel
     */
    async sendExcelExportMessage(filters, userId) {
        if (!this.queueUrl) {
            throw new Error('SQS_QUEUE_URL no está configurado');
        }
        const requestId = (0, uuid_1.v4)();
        const messageId = (0, uuid_1.v4)();
        const payload = {
            filters,
            userId,
            requestId,
        };
        const message = {
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify({
                id: messageId,
                type: 'excel.export',
                payload,
                timestamp: new Date().toISOString(),
                source: 'pweb_ms_guias',
                correlationId: requestId,
            }),
            MessageAttributes: {
                MessageType: {
                    DataType: 'String',
                    StringValue: 'excel.export',
                },
                RequestId: {
                    DataType: 'String',
                    StringValue: requestId,
                },
            },
        };
        try {
            this.logger.log(`Intentando enviar mensaje a SQS. QueueUrl: ${this.queueUrl}, RequestId: ${requestId}`);
            const startTime = Date.now();
            const result = await this.sqs?.send(new client_sqs_1.SendMessageCommand(message));
            this.logger.log(`Resultado: ${JSON.stringify(result)}`);
            if (!result) {
                throw new Error('No se pudo enviar el mensaje a SQS');
            }
            const duration = Date.now() - startTime;
            const finalMessageId = result.MessageId || messageId;
            this.logger.log(`Mensaje enviado a SQS exitosamente. MessageId: ${finalMessageId}, RequestId: ${requestId}, Duración: ${duration}ms`);
            return {
                messageId: finalMessageId,
                requestId,
            };
        }
        catch (error) {
            const errorMessage = error.message || 'Error desconocido';
            const errorCode = error.code || 'UNKNOWN';
            const isTimeout = errorMessage.includes('timeout') || errorCode === 'TimeoutError' || errorCode === 'ETIMEDOUT';
            this.logger.error(`Error al enviar mensaje a SQS. QueueUrl: ${message.QueueUrl}, RequestId: ${requestId}, Error: ${errorMessage}, Code: ${errorCode}`, error.stack);
            if (isTimeout) {
                this.logger.error(`Timeout al enviar mensaje a SQS. Verificar: 1) Permisos IAM de la Lambda, 2) Configuración de VPC, 3) Conectividad de red`);
            }
            this.logger.error(`Error completo: ${JSON.stringify(error, null, 2)}`);
            throw new Error(`Error al enviar mensaje a SQS: ${errorMessage}`);
        }
    }
    /**
     * Envía un mensaje a la cola SQS para exportar PDF
     */
    async sendPdfExportMessage(guideIds, userId) {
        if (!this.queueUrl) {
            throw new Error('SQS_QUEUE_URL no está configurado');
        }
        const requestId = (0, uuid_1.v4)();
        const messageId = (0, uuid_1.v4)();
        const payload = {
            guideIds,
            userId,
            requestId,
        };
        const message = {
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify({
                id: messageId,
                type: 'pdf.export',
                payload,
                timestamp: new Date().toISOString(),
                source: 'pweb_ms_guias',
                correlationId: requestId,
            }),
            MessageAttributes: {
                MessageType: {
                    DataType: 'String',
                    StringValue: 'pdf.export',
                },
                RequestId: {
                    DataType: 'String',
                    StringValue: requestId,
                },
            },
        };
        try {
            this.logger.log(`Intentando enviar mensaje PDF a SQS. QueueUrl: ${this.queueUrl}, RequestId: ${requestId}, GuideIds: ${guideIds.join(', ')}`);
            const startTime = Date.now();
            const result = await this.sqs?.send(new client_sqs_1.SendMessageCommand(message));
            this.logger.log(`Resultado: ${JSON.stringify(result)}`);
            if (!result) {
                throw new Error('No se pudo enviar el mensaje a SQS');
            }
            const duration = Date.now() - startTime;
            const finalMessageId = result.MessageId || messageId;
            this.logger.log(`Mensaje PDF enviado a SQS exitosamente. MessageId: ${finalMessageId}, RequestId: ${requestId}, Duración: ${duration}ms`);
            return {
                messageId: finalMessageId,
                requestId,
            };
        }
        catch (error) {
            const errorMessage = error.message || 'Error desconocido';
            const errorCode = error.code || 'UNKNOWN';
            const isTimeout = errorMessage.includes('timeout') || errorCode === 'TimeoutError' || errorCode === 'ETIMEDOUT';
            this.logger.error(`Error al enviar mensaje PDF a SQS. QueueUrl: ${message.QueueUrl}, RequestId: ${requestId}, Error: ${errorMessage}, Code: ${errorCode}`, error.stack);
            if (isTimeout) {
                this.logger.error(`Timeout al enviar mensaje a SQS. Verificar: 1) Permisos IAM de la Lambda, 2) Configuración de VPC, 3) Conectividad de red`);
            }
            this.logger.error(`Error completo: ${JSON.stringify(error, null, 2)}`);
            throw new Error(`Error al enviar mensaje PDF a SQS: ${errorMessage}`);
        }
    }
};
exports.SQSProducerService = SQSProducerService;
exports.SQSProducerService = SQSProducerService = SQSProducerService_1 = __decorate([
    (0, common_1.Injectable)()
], SQSProducerService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLXByb2R1Y2VyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMtcHJvZHVjZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsK0JBQW9DO0FBR3BDLDJDQUFvRDtBQUVwRCxvREFBNkY7QUFRdEYsSUFBTSxrQkFBa0IsMEJBQXhCLE1BQU0sa0JBQWtCO0lBSzdCLFlBQ21CLGFBQTRCLEVBQzVCLGdCQUFrQztRQURsQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUM1QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBTnBDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxvQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQVE1RCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUVuRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDREQUE0RCxDQUFDLENBQUM7UUFDakYsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsc0JBQXNCLENBQzFCLE9BQTRCLEVBQzVCLE1BQWU7UUFFZixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxTQUFNLEdBQUUsQ0FBQztRQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFBLFNBQU0sR0FBRSxDQUFDO1FBRTNCLE1BQU0sT0FBTyxHQUF1QjtZQUNsQyxPQUFPO1lBQ1AsTUFBTTtZQUNOLFNBQVM7U0FDVixDQUFDO1FBRUYsTUFBTSxPQUFPLEdBQTRCO1lBQ3ZDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDMUIsRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLE9BQU87Z0JBQ1AsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNuQyxNQUFNLEVBQUUsZUFBZTtnQkFDdkIsYUFBYSxFQUFFLFNBQVM7YUFDekIsQ0FBQztZQUNGLGlCQUFpQixFQUFFO2dCQUNqQixXQUFXLEVBQUU7b0JBQ1gsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFdBQVcsRUFBRSxjQUFjO2lCQUM1QjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFdBQVcsRUFBRSxTQUFTO2lCQUN2QjthQUNGO1NBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNiLDhDQUE4QyxJQUFJLENBQUMsUUFBUSxnQkFBZ0IsU0FBUyxFQUFFLENBQ3ZGLENBQUM7WUFFRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FDakMsSUFBSSwrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FDaEMsQ0FBQztZQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFeEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUV4QyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQztZQUVyRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FDYixrREFBa0QsY0FBYyxnQkFBZ0IsU0FBUyxlQUFlLFFBQVEsSUFBSSxDQUNySCxDQUFDO1lBRUYsT0FBTztnQkFDTCxTQUFTLEVBQUUsY0FBYztnQkFDekIsU0FBUzthQUNWLENBQUM7UUFDSixDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxJQUFJLG1CQUFtQixDQUFDO1lBQzFELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDO1lBQzFDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxLQUFLLGNBQWMsSUFBSSxTQUFTLEtBQUssV0FBVyxDQUFDO1lBRWhILElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLDRDQUE0QyxPQUFPLENBQUMsUUFBUSxnQkFBZ0IsU0FBUyxZQUFZLFlBQVksV0FBVyxTQUFTLEVBQUUsRUFDbkksS0FBSyxDQUFDLEtBQUssQ0FDWixDQUFDO1lBRUYsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZiwySEFBMkgsQ0FDNUgsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2RSxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQ3hCLFFBQWtCLEVBQ2xCLE1BQWU7UUFFZixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxTQUFNLEdBQUUsQ0FBQztRQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFBLFNBQU0sR0FBRSxDQUFDO1FBRTNCLE1BQU0sT0FBTyxHQUFxQjtZQUNoQyxRQUFRO1lBQ1IsTUFBTTtZQUNOLFNBQVM7U0FDVixDQUFDO1FBRUYsTUFBTSxPQUFPLEdBQTRCO1lBQ3ZDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDMUIsRUFBRSxFQUFFLFNBQVM7Z0JBQ2IsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLE9BQU87Z0JBQ1AsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNuQyxNQUFNLEVBQUUsZUFBZTtnQkFDdkIsYUFBYSxFQUFFLFNBQVM7YUFDekIsQ0FBQztZQUNGLGlCQUFpQixFQUFFO2dCQUNqQixXQUFXLEVBQUU7b0JBQ1gsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFdBQVcsRUFBRSxZQUFZO2lCQUMxQjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFdBQVcsRUFBRSxTQUFTO2lCQUN2QjthQUNGO1NBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNiLGtEQUFrRCxJQUFJLENBQUMsUUFBUSxnQkFBZ0IsU0FBUyxlQUFlLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDN0gsQ0FBQztZQUVGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM3QixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUNqQyxJQUFJLCtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUNoQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV4RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBRXhDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDO1lBRXJELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNiLHNEQUFzRCxjQUFjLGdCQUFnQixTQUFTLGVBQWUsUUFBUSxJQUFJLENBQ3pILENBQUM7WUFFRixPQUFPO2dCQUNMLFNBQVMsRUFBRSxjQUFjO2dCQUN6QixTQUFTO2FBQ1YsQ0FBQztRQUNKLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLElBQUksbUJBQW1CLENBQUM7WUFDMUQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUM7WUFDMUMsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLEtBQUssY0FBYyxJQUFJLFNBQVMsS0FBSyxXQUFXLENBQUM7WUFFaEgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2YsZ0RBQWdELE9BQU8sQ0FBQyxRQUFRLGdCQUFnQixTQUFTLFlBQVksWUFBWSxXQUFXLFNBQVMsRUFBRSxFQUN2SSxLQUFLLENBQUMsS0FBSyxDQUNaLENBQUM7WUFFRixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLDJIQUEySCxDQUM1SCxDQUFDO1lBQ0osQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDeEUsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFBO0FBcE1ZLGdEQUFrQjs2QkFBbEIsa0JBQWtCO0lBRDlCLElBQUEsbUJBQVUsR0FBRTtHQUNBLGtCQUFrQixDQW9NOUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcclxuaW1wb3J0IHsgQVdTQ29uZmlnU2VydmljZSB9IGZyb20gJy4uL2F3cyc7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IEluamVjdGFibGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgRXhjZWxFeHBvcnRQYXlsb2FkLCBQZGZFeHBvcnRQYXlsb2FkIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9zcXMtbWVzc2FnZS5pbnRlcmZhY2UnO1xyXG5pbXBvcnQgeyBTZW5kTWVzc2FnZUNvbW1hbmQsIFNRU0NsaWVudCwgU2VuZE1lc3NhZ2VDb21tYW5kSW5wdXQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtc3FzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VuZE1lc3NhZ2VSZXN1bHQge1xyXG4gIG1lc3NhZ2VJZDogc3RyaW5nO1xyXG4gIHJlcXVlc3RJZDogc3RyaW5nO1xyXG59XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBTUVNQcm9kdWNlclNlcnZpY2Uge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihTUVNQcm9kdWNlclNlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBzcXM6IFNRU0NsaWVudDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHF1ZXVlVXJsOiBzdHJpbmc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhd3NDb25maWdTZXJ2aWNlOiBBV1NDb25maWdTZXJ2aWNlLFxyXG4gICkge1xyXG4gICAgdGhpcy5xdWV1ZVVybCA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignU1FTX1FVRVVFX1VSTCcpIHx8ICcnO1xyXG4gICAgdGhpcy5zcXMgPSB0aGlzLmF3c0NvbmZpZ1NlcnZpY2UuY3JlYXRlU1FTQ2xpZW50KCk7XHJcblxyXG4gICAgaWYgKCF0aGlzLnF1ZXVlVXJsKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ1NRU19RVUVVRV9VUkwgbm8gY29uZmlndXJhZG8uIExvcyBtZW5zYWplcyBubyBzZSBlbnZpYXLDoW4uJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgU1FTIFByb2R1Y2VyIGluaWNpYWxpemFkbyAtIFF1ZXVlVXJsOiAke3RoaXMucXVldWVVcmx9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbnbDrWEgdW4gbWVuc2FqZSBhIGxhIGNvbGEgU1FTIHBhcmEgZXhwb3J0YXIgRXhjZWxcclxuICAgKi9cclxuICBhc3luYyBzZW5kRXhjZWxFeHBvcnRNZXNzYWdlKFxyXG4gICAgZmlsdGVyczogUmVjb3JkPHN0cmluZywgYW55PixcclxuICAgIHVzZXJJZD86IG51bWJlcixcclxuICApOiBQcm9taXNlPFNlbmRNZXNzYWdlUmVzdWx0PiB7XHJcbiAgICBpZiAoIXRoaXMucXVldWVVcmwpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTUVNfUVVFVUVfVVJMIG5vIGVzdMOhIGNvbmZpZ3VyYWRvJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdElkID0gdXVpZHY0KCk7XHJcbiAgICBjb25zdCBtZXNzYWdlSWQgPSB1dWlkdjQoKTtcclxuXHJcbiAgICBjb25zdCBwYXlsb2FkOiBFeGNlbEV4cG9ydFBheWxvYWQgPSB7XHJcbiAgICAgIGZpbHRlcnMsXHJcbiAgICAgIHVzZXJJZCxcclxuICAgICAgcmVxdWVzdElkLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBtZXNzYWdlOiBTZW5kTWVzc2FnZUNvbW1hbmRJbnB1dCA9IHtcclxuICAgICAgUXVldWVVcmw6IHRoaXMucXVldWVVcmwsXHJcbiAgICAgIE1lc3NhZ2VCb2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgaWQ6IG1lc3NhZ2VJZCxcclxuICAgICAgICB0eXBlOiAnZXhjZWwuZXhwb3J0JyxcclxuICAgICAgICBwYXlsb2FkLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIHNvdXJjZTogJ3B3ZWJfbXNfZ3VpYXMnLFxyXG4gICAgICAgIGNvcnJlbGF0aW9uSWQ6IHJlcXVlc3RJZCxcclxuICAgICAgfSksXHJcbiAgICAgIE1lc3NhZ2VBdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgTWVzc2FnZVR5cGU6IHtcclxuICAgICAgICAgIERhdGFUeXBlOiAnU3RyaW5nJyxcclxuICAgICAgICAgIFN0cmluZ1ZhbHVlOiAnZXhjZWwuZXhwb3J0JyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlcXVlc3RJZDoge1xyXG4gICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgU3RyaW5nVmFsdWU6IHJlcXVlc3RJZCxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYEludGVudGFuZG8gZW52aWFyIG1lbnNhamUgYSBTUVMuIFF1ZXVlVXJsOiAke3RoaXMucXVldWVVcmx9LCBSZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWAsXHJcbiAgICAgICk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnNxcz8uc2VuZChcclxuICAgICAgICBuZXcgU2VuZE1lc3NhZ2VDb21tYW5kKG1lc3NhZ2UpXHJcbiAgICAgICk7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgUmVzdWx0YWRvOiAke0pTT04uc3RyaW5naWZ5KHJlc3VsdCl9YCk7XHJcblxyXG4gICAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc2UgcHVkbyBlbnZpYXIgZWwgbWVuc2FqZSBhIFNRUycpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGZpbmFsTWVzc2FnZUlkID0gcmVzdWx0Lk1lc3NhZ2VJZCB8fCBtZXNzYWdlSWQ7XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYE1lbnNhamUgZW52aWFkbyBhIFNRUyBleGl0b3NhbWVudGUuIE1lc3NhZ2VJZDogJHtmaW5hbE1lc3NhZ2VJZH0sIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBEdXJhY2nDs246ICR7ZHVyYXRpb259bXNgLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtZXNzYWdlSWQ6IGZpbmFsTWVzc2FnZUlkLFxyXG4gICAgICAgIHJlcXVlc3RJZCxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgZGVzY29ub2NpZG8nO1xyXG4gICAgICBjb25zdCBlcnJvckNvZGUgPSBlcnJvci5jb2RlIHx8ICdVTktOT1dOJztcclxuICAgICAgY29uc3QgaXNUaW1lb3V0ID0gZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCd0aW1lb3V0JykgfHwgZXJyb3JDb2RlID09PSAnVGltZW91dEVycm9yJyB8fCBlcnJvckNvZGUgPT09ICdFVElNRURPVVQnO1xyXG4gICAgICBcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgYEVycm9yIGFsIGVudmlhciBtZW5zYWplIGEgU1FTLiBRdWV1ZVVybDogJHttZXNzYWdlLlF1ZXVlVXJsfSwgUmVxdWVzdElkOiAke3JlcXVlc3RJZH0sIEVycm9yOiAke2Vycm9yTWVzc2FnZX0sIENvZGU6ICR7ZXJyb3JDb2RlfWAsXHJcbiAgICAgICAgZXJyb3Iuc3RhY2ssXHJcbiAgICAgICk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoaXNUaW1lb3V0KSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgICBgVGltZW91dCBhbCBlbnZpYXIgbWVuc2FqZSBhIFNRUy4gVmVyaWZpY2FyOiAxKSBQZXJtaXNvcyBJQU0gZGUgbGEgTGFtYmRhLCAyKSBDb25maWd1cmFjacOzbiBkZSBWUEMsIDMpIENvbmVjdGl2aWRhZCBkZSByZWRgLFxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjb21wbGV0bzogJHtKU09OLnN0cmluZ2lmeShlcnJvciwgbnVsbCwgMil9YCk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgYWwgZW52aWFyIG1lbnNhamUgYSBTUVM6ICR7ZXJyb3JNZXNzYWdlfWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW52w61hIHVuIG1lbnNhamUgYSBsYSBjb2xhIFNRUyBwYXJhIGV4cG9ydGFyIFBERlxyXG4gICAqL1xyXG4gIGFzeW5jIHNlbmRQZGZFeHBvcnRNZXNzYWdlKFxyXG4gICAgZ3VpZGVJZHM6IG51bWJlcltdLFxyXG4gICAgdXNlcklkPzogbnVtYmVyLFxyXG4gICk6IFByb21pc2U8U2VuZE1lc3NhZ2VSZXN1bHQ+IHtcclxuICAgIGlmICghdGhpcy5xdWV1ZVVybCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NRU19RVUVVRV9VUkwgbm8gZXN0w6EgY29uZmlndXJhZG8nKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXF1ZXN0SWQgPSB1dWlkdjQoKTtcclxuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHV1aWR2NCgpO1xyXG5cclxuICAgIGNvbnN0IHBheWxvYWQ6IFBkZkV4cG9ydFBheWxvYWQgPSB7XHJcbiAgICAgIGd1aWRlSWRzLFxyXG4gICAgICB1c2VySWQsXHJcbiAgICAgIHJlcXVlc3RJZCxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgbWVzc2FnZTogU2VuZE1lc3NhZ2VDb21tYW5kSW5wdXQgPSB7XHJcbiAgICAgIFF1ZXVlVXJsOiB0aGlzLnF1ZXVlVXJsLFxyXG4gICAgICBNZXNzYWdlQm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIGlkOiBtZXNzYWdlSWQsXHJcbiAgICAgICAgdHlwZTogJ3BkZi5leHBvcnQnLFxyXG4gICAgICAgIHBheWxvYWQsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgc291cmNlOiAncHdlYl9tc19ndWlhcycsXHJcbiAgICAgICAgY29ycmVsYXRpb25JZDogcmVxdWVzdElkLFxyXG4gICAgICB9KSxcclxuICAgICAgTWVzc2FnZUF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBNZXNzYWdlVHlwZToge1xyXG4gICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgU3RyaW5nVmFsdWU6ICdwZGYuZXhwb3J0JyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlcXVlc3RJZDoge1xyXG4gICAgICAgICAgRGF0YVR5cGU6ICdTdHJpbmcnLFxyXG4gICAgICAgICAgU3RyaW5nVmFsdWU6IHJlcXVlc3RJZCxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYEludGVudGFuZG8gZW52aWFyIG1lbnNhamUgUERGIGEgU1FTLiBRdWV1ZVVybDogJHt0aGlzLnF1ZXVlVXJsfSwgUmVxdWVzdElkOiAke3JlcXVlc3RJZH0sIEd1aWRlSWRzOiAke2d1aWRlSWRzLmpvaW4oJywgJyl9YCxcclxuICAgICAgKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc3FzPy5zZW5kKFxyXG4gICAgICAgIG5ldyBTZW5kTWVzc2FnZUNvbW1hbmQobWVzc2FnZSlcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBSZXN1bHRhZG86ICR7SlNPTi5zdHJpbmdpZnkocmVzdWx0KX1gKTtcclxuXHJcbiAgICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzZSBwdWRvIGVudmlhciBlbCBtZW5zYWplIGEgU1FTJyk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgZmluYWxNZXNzYWdlSWQgPSByZXN1bHQuTWVzc2FnZUlkIHx8IG1lc3NhZ2VJZDtcclxuICAgICAgXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhcclxuICAgICAgICBgTWVuc2FqZSBQREYgZW52aWFkbyBhIFNRUyBleGl0b3NhbWVudGUuIE1lc3NhZ2VJZDogJHtmaW5hbE1lc3NhZ2VJZH0sIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBEdXJhY2nDs246ICR7ZHVyYXRpb259bXNgLFxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBtZXNzYWdlSWQ6IGZpbmFsTWVzc2FnZUlkLFxyXG4gICAgICAgIHJlcXVlc3RJZCxcclxuICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgZGVzY29ub2NpZG8nO1xyXG4gICAgICBjb25zdCBlcnJvckNvZGUgPSBlcnJvci5jb2RlIHx8ICdVTktOT1dOJztcclxuICAgICAgY29uc3QgaXNUaW1lb3V0ID0gZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCd0aW1lb3V0JykgfHwgZXJyb3JDb2RlID09PSAnVGltZW91dEVycm9yJyB8fCBlcnJvckNvZGUgPT09ICdFVElNRURPVVQnO1xyXG4gICAgICBcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgYEVycm9yIGFsIGVudmlhciBtZW5zYWplIFBERiBhIFNRUy4gUXVldWVVcmw6ICR7bWVzc2FnZS5RdWV1ZVVybH0sIFJlcXVlc3RJZDogJHtyZXF1ZXN0SWR9LCBFcnJvcjogJHtlcnJvck1lc3NhZ2V9LCBDb2RlOiAke2Vycm9yQ29kZX1gLFxyXG4gICAgICAgIGVycm9yLnN0YWNrLFxyXG4gICAgICApO1xyXG4gICAgICBcclxuICAgICAgaWYgKGlzVGltZW91dCkge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFxyXG4gICAgICAgICAgYFRpbWVvdXQgYWwgZW52aWFyIG1lbnNhamUgYSBTUVMuIFZlcmlmaWNhcjogMSkgUGVybWlzb3MgSUFNIGRlIGxhIExhbWJkYSwgMikgQ29uZmlndXJhY2nDs24gZGUgVlBDLCAzKSBDb25lY3RpdmlkYWQgZGUgcmVkYCxcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgY29tcGxldG86ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpfWApO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGFsIGVudmlhciBtZW5zYWplIFBERiBhIFNRUzogJHtlcnJvck1lc3NhZ2V9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=