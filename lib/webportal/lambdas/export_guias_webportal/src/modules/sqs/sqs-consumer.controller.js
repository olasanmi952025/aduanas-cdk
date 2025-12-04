"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSConsumerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let SQSConsumerController = class SQSConsumerController {
    constructor(sqsConsumer) {
        this.sqsConsumer = sqsConsumer;
    }
    async consumeMessage() {
        try {
            const hasMessage = await this.sqsConsumer.consumeAndProcessMessage(0);
            return {
                success: true,
                message: hasMessage ? 'Message processed successfully' : 'No messages in queue',
                hasMessage,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async startListener() {
        this.sqsConsumer.listen().catch((error) => {
            console.error('Error starting listener:', error);
        });
        return {
            success: true,
            message: 'Listener started',
        };
    }
    stopListener() {
        this.sqsConsumer.stop();
        return {
            success: true,
            message: 'Listener stopped',
        };
    }
    getStatus() {
        return {
            success: true,
            ...this.sqsConsumer.getStatus(),
        };
    }
};
exports.SQSConsumerController = SQSConsumerController;
__decorate([
    (0, common_1.Post)('consume'),
    (0, swagger_1.ApiOperation)({ summary: 'Consume un mensaje único de la cola SQS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensaje consumido exitosamente o no hay mensajes disponibles' })
], SQSConsumerController.prototype, "consumeMessage", null);
__decorate([
    (0, common_1.Post)('listen'),
    (0, swagger_1.ApiOperation)({ summary: 'Inicia el listener continuo para mensajes SQS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listener iniciado' })
], SQSConsumerController.prototype, "startListener", null);
__decorate([
    (0, common_1.Post)('stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Detiene el listener SQS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Listener detenido' })
], SQSConsumerController.prototype, "stopListener", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtiene el estado del consumidor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estado del consumidor' })
], SQSConsumerController.prototype, "getStatus", null);
exports.SQSConsumerController = SQSConsumerController = __decorate([
    (0, swagger_1.ApiTags)('SQS Consumer'),
    (0, common_1.Controller)('sqs/consumer')
], SQSConsumerController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLWNvbnN1bWVyLmNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMtY29uc3VtZXIuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBdUQ7QUFDdkQsNkNBQXFFO0FBSzlELElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO0lBQ2hDLFlBQ21CLFdBQStCO1FBQS9CLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtJQUMvQyxDQUFDO0lBS0UsQUFBTixLQUFLLENBQUMsY0FBYztRQUNsQixJQUFJLENBQUM7WUFDSCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsT0FBTztnQkFDTCxPQUFPLEVBQUUsSUFBSTtnQkFDYixPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsc0JBQXNCO2dCQUMvRSxVQUFVO2FBQ1gsQ0FBQztRQUNKLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE9BQU87Z0JBQ0wsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2FBQ3JCLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUtLLEFBQU4sS0FBSyxDQUFDLGFBQWE7UUFDakIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLGtCQUFrQjtTQUM1QixDQUFDO0lBQ0osQ0FBQztJQUtELFlBQVk7UUFDVixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3hCLE9BQU87WUFDTCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxrQkFBa0I7U0FDNUIsQ0FBQztJQUNKLENBQUM7SUFLRCxTQUFTO1FBQ1AsT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRTtTQUNoQyxDQUFDO0lBQ0osQ0FBQztDQUNGLENBQUE7QUF6RFksc0RBQXFCO0FBUTFCO0lBSEwsSUFBQSxhQUFJLEVBQUMsU0FBUyxDQUFDO0lBQ2YsSUFBQSxzQkFBWSxFQUFDLEVBQUUsT0FBTyxFQUFFLHlDQUF5QyxFQUFFLENBQUM7SUFDcEUsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsOERBQThELEVBQUUsQ0FBQzsyREFlekc7QUFLSztJQUhMLElBQUEsYUFBSSxFQUFDLFFBQVEsQ0FBQztJQUNkLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSwrQ0FBK0MsRUFBRSxDQUFDO0lBQzFFLElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLENBQUM7MERBUzlEO0FBS0Q7SUFIQyxJQUFBLGFBQUksRUFBQyxNQUFNLENBQUM7SUFDWixJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsQ0FBQztJQUNwRCxJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxDQUFDO3lEQU85RDtBQUtEO0lBSEMsSUFBQSxZQUFHLEVBQUMsUUFBUSxDQUFDO0lBQ2IsSUFBQSxzQkFBWSxFQUFDLEVBQUUsT0FBTyxFQUFFLGtDQUFrQyxFQUFFLENBQUM7SUFDN0QsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztzREFNbEU7Z0NBeERVLHFCQUFxQjtJQUZqQyxJQUFBLGlCQUFPLEVBQUMsY0FBYyxDQUFDO0lBQ3ZCLElBQUEsbUJBQVUsRUFBQyxjQUFjLENBQUM7R0FDZCxxQkFBcUIsQ0F5RGpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udHJvbGxlciwgUG9zdCwgR2V0IH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBBcGlUYWdzLCBBcGlPcGVyYXRpb24sIEFwaVJlc3BvbnNlIH0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcclxuaW1wb3J0IHsgU1FTQ29uc3VtZXJTZXJ2aWNlIH0gZnJvbSAnLi9zcXMtY29uc3VtZXIuc2VydmljZSc7XHJcblxyXG5AQXBpVGFncygnU1FTIENvbnN1bWVyJylcclxuQENvbnRyb2xsZXIoJ3Nxcy9jb25zdW1lcicpXHJcbmV4cG9ydCBjbGFzcyBTUVNDb25zdW1lckNvbnRyb2xsZXIge1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzcXNDb25zdW1lcjogU1FTQ29uc3VtZXJTZXJ2aWNlLFxyXG4gICkge31cclxuXHJcbiAgQFBvc3QoJ2NvbnN1bWUnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnQ29uc3VtZSB1biBtZW5zYWplIMO6bmljbyBkZSBsYSBjb2xhIFNRUycgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdNZW5zYWplIGNvbnN1bWlkbyBleGl0b3NhbWVudGUgbyBubyBoYXkgbWVuc2FqZXMgZGlzcG9uaWJsZXMnIH0pXHJcbiAgYXN5bmMgY29uc3VtZU1lc3NhZ2UoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBoYXNNZXNzYWdlID0gYXdhaXQgdGhpcy5zcXNDb25zdW1lci5jb25zdW1lQW5kUHJvY2Vzc01lc3NhZ2UoMCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICBtZXNzYWdlOiBoYXNNZXNzYWdlID8gJ01lc3NhZ2UgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScgOiAnTm8gbWVzc2FnZXMgaW4gcXVldWUnLFxyXG4gICAgICAgIGhhc01lc3NhZ2UsXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBAUG9zdCgnbGlzdGVuJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ0luaWNpYSBlbCBsaXN0ZW5lciBjb250aW51byBwYXJhIG1lbnNhamVzIFNRUycgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdMaXN0ZW5lciBpbmljaWFkbycgfSlcclxuICBhc3luYyBzdGFydExpc3RlbmVyKCkge1xyXG4gICAgdGhpcy5zcXNDb25zdW1lci5saXN0ZW4oKS5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhcnRpbmcgbGlzdGVuZXI6JywgZXJyb3IpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiAnTGlzdGVuZXIgc3RhcnRlZCcsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgQFBvc3QoJ3N0b3AnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnRGV0aWVuZSBlbCBsaXN0ZW5lciBTUVMnIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiAnTGlzdGVuZXIgZGV0ZW5pZG8nIH0pXHJcbiAgc3RvcExpc3RlbmVyKCkge1xyXG4gICAgdGhpcy5zcXNDb25zdW1lci5zdG9wKCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlOiAnTGlzdGVuZXIgc3RvcHBlZCcsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgQEdldCgnc3RhdHVzJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ09idGllbmUgZWwgZXN0YWRvIGRlbCBjb25zdW1pZG9yJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ0VzdGFkbyBkZWwgY29uc3VtaWRvcicgfSlcclxuICBnZXRTdGF0dXMoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAuLi50aGlzLnNxc0NvbnN1bWVyLmdldFN0YXR1cygpLFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbiJdfQ==