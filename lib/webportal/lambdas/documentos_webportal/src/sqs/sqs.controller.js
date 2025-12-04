"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let SQSController = class SQSController {
    constructor(sqsService) {
        this.sqsService = sqsService;
    }
    async getHealth() {
        return await this.sqsService.getHealthCheck();
    }
    getMetrics() {
        return this.sqsService.getMetrics();
    }
    async testMessage(message) {
        return await this.sqsService.processTypedMessage(message);
    }
    resetMetrics() {
        this.sqsService.resetMetrics();
        return { message: 'Metrics reset successfully' };
    }
};
exports.SQSController = SQSController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'SQS Health Check' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SQS health status' })
], SQSController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'SQS Metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SQS processing metrics' })
], SQSController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)('test-message'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Test SQS Message Processing' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message processed successfully' }),
    __param(0, (0, common_1.Body)())
], SQSController.prototype, "testMessage", null);
__decorate([
    (0, common_1.Post)('reset-metrics'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset SQS Metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metrics reset successfully' })
], SQSController.prototype, "resetMetrics", null);
exports.SQSController = SQSController = __decorate([
    (0, swagger_1.ApiTags)('SQS'),
    (0, common_1.Controller)('sqs')
], SQSController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLmNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMuY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBbUY7QUFDbkYsNkNBQXFFO0FBTTlELElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7SUFDeEIsWUFBNkIsVUFBc0I7UUFBdEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtJQUFHLENBQUM7SUFLakQsQUFBTixLQUFLLENBQUMsU0FBUztRQUNiLE9BQU8sTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFLRCxVQUFVO1FBQ1IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFNSyxBQUFOLEtBQUssQ0FBQyxXQUFXLENBQVMsT0FBd0I7UUFDaEQsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQU1ELFlBQVk7UUFDVixJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQy9CLE9BQU8sRUFBRSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztJQUNuRCxDQUFDO0NBQ0YsQ0FBQTtBQWpDWSxzQ0FBYTtBQU1sQjtJQUhMLElBQUEsWUFBRyxFQUFDLFFBQVEsQ0FBQztJQUNiLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDO0lBQzdDLElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLENBQUM7OENBRzlEO0FBS0Q7SUFIQyxJQUFBLFlBQUcsRUFBQyxTQUFTLENBQUM7SUFDZCxJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQUM7SUFDeEMsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQzsrQ0FHbkU7QUFNSztJQUpMLElBQUEsYUFBSSxFQUFDLGNBQWMsQ0FBQztJQUNwQixJQUFBLGlCQUFRLEVBQUMsbUJBQVUsQ0FBQyxFQUFFLENBQUM7SUFDdkIsSUFBQSxzQkFBWSxFQUFDLEVBQUUsT0FBTyxFQUFFLDZCQUE2QixFQUFFLENBQUM7SUFDeEQsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQztJQUN6RCxXQUFBLElBQUEsYUFBSSxHQUFFLENBQUE7Z0RBRXhCO0FBTUQ7SUFKQyxJQUFBLGFBQUksRUFBQyxlQUFlLENBQUM7SUFDckIsSUFBQSxpQkFBUSxFQUFDLG1CQUFVLENBQUMsRUFBRSxDQUFDO0lBQ3ZCLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDO0lBQzlDLElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLENBQUM7aURBSXZFO3dCQWhDVSxhQUFhO0lBRnpCLElBQUEsaUJBQU8sRUFBQyxLQUFLLENBQUM7SUFDZCxJQUFBLG1CQUFVLEVBQUMsS0FBSyxDQUFDO0dBQ0wsYUFBYSxDQWlDekIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb250cm9sbGVyLCBHZXQsIFBvc3QsIEJvZHksIEh0dHBDb2RlLCBIdHRwU3RhdHVzIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBBcGlUYWdzLCBBcGlPcGVyYXRpb24sIEFwaVJlc3BvbnNlIH0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcclxuaW1wb3J0IHsgU1FTU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2Uvc3FzLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBUeXBlZFNRU01lc3NhZ2UgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nxcy1tZXNzYWdlLmludGVyZmFjZSc7XHJcblxyXG5AQXBpVGFncygnU1FTJylcclxuQENvbnRyb2xsZXIoJ3NxcycpXHJcbmV4cG9ydCBjbGFzcyBTUVNDb250cm9sbGVyIHtcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNxc1NlcnZpY2U6IFNRU1NlcnZpY2UpIHt9XHJcblxyXG4gIEBHZXQoJ2hlYWx0aCcpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6ICdTUVMgSGVhbHRoIENoZWNrJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ1NRUyBoZWFsdGggc3RhdHVzJyB9KVxyXG4gIGFzeW5jIGdldEhlYWx0aCgpIHtcclxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNxc1NlcnZpY2UuZ2V0SGVhbHRoQ2hlY2soKTtcclxuICB9XHJcblxyXG4gIEBHZXQoJ21ldHJpY3MnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnU1FTIE1ldHJpY3MnIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiAnU1FTIHByb2Nlc3NpbmcgbWV0cmljcycgfSlcclxuICBnZXRNZXRyaWNzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3FzU2VydmljZS5nZXRNZXRyaWNzKCk7XHJcbiAgfVxyXG5cclxuICBAUG9zdCgndGVzdC1tZXNzYWdlJylcclxuICBASHR0cENvZGUoSHR0cFN0YXR1cy5PSylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ1Rlc3QgU1FTIE1lc3NhZ2UgUHJvY2Vzc2luZycgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdNZXNzYWdlIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknIH0pXHJcbiAgYXN5bmMgdGVzdE1lc3NhZ2UoQEJvZHkoKSBtZXNzYWdlOiBUeXBlZFNRU01lc3NhZ2UpIHtcclxuICAgIHJldHVybiBhd2FpdCB0aGlzLnNxc1NlcnZpY2UucHJvY2Vzc1R5cGVkTWVzc2FnZShtZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIEBQb3N0KCdyZXNldC1tZXRyaWNzJylcclxuICBASHR0cENvZGUoSHR0cFN0YXR1cy5PSylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ1Jlc2V0IFNRUyBNZXRyaWNzJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ01ldHJpY3MgcmVzZXQgc3VjY2Vzc2Z1bGx5JyB9KVxyXG4gIHJlc2V0TWV0cmljcygpIHtcclxuICAgIHRoaXMuc3FzU2VydmljZS5yZXNldE1ldHJpY3MoKTtcclxuICAgIHJldHVybiB7IG1lc3NhZ2U6ICdNZXRyaWNzIHJlc2V0IHN1Y2Nlc3NmdWxseScgfTtcclxuICB9XHJcbn1cclxuXHJcbiJdfQ==