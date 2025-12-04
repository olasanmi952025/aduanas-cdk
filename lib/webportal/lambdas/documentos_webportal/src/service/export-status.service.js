"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExportStatusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStatusService = exports.ExportStatus = void 0;
const common_1 = require("@nestjs/common");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var ExportStatus;
(function (ExportStatus) {
    ExportStatus["PENDING"] = "pending";
    ExportStatus["PROCESSING"] = "processing";
    ExportStatus["COMPLETED"] = "completed";
    ExportStatus["FAILED"] = "failed";
})(ExportStatus || (exports.ExportStatus = ExportStatus = {}));
let ExportStatusService = ExportStatusService_1 = class ExportStatusService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ExportStatusService_1.name);
        const region = this.configService.get('AWS_REGION') || 'us-east-1';
        const client = new client_dynamodb_1.DynamoDBClient({
            region,
            endpoint: this.configService.get("DYNAMODB_ENDPOINT_URL"),
        });
        this.dynamoDB = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
        this.tableName = this.configService.get('DYNAMODB_TABLE_NAME') || 'export-status';
        if (!this.tableName) {
            this.logger.warn('DYNAMODB_TABLE_NAME not configured.');
        }
        else {
            this.logger.log(`ExportStatusService initialized for table: ${this.tableName}`);
        }
    }
    /**
     * Obtiene el estado de un proceso por su requestId desde DynamoDB
     */
    async getStatus(requestId) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
        }
        try {
            const result = await this.dynamoDB.send(new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: { requestId },
            }));
            return result.Item || null;
        }
        catch (error) {
            if (error.name === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first.`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.logger.error(`Error getting status: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ExportStatusService = ExportStatusService;
exports.ExportStatusService = ExportStatusService = ExportStatusService_1 = __decorate([
    (0, common_1.Injectable)()
], ExportStatusService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsOERBQTBEO0FBQzFELHdEQUEyRTtBQUUzRSxJQUFZLFlBS1g7QUFMRCxXQUFZLFlBQVk7SUFDdEIsbUNBQW1CLENBQUE7SUFDbkIseUNBQXlCLENBQUE7SUFDekIsdUNBQXVCLENBQUE7SUFDdkIsaUNBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQUxXLFlBQVksNEJBQVosWUFBWSxRQUt2QjtBQWNNLElBQU0sbUJBQW1CLDJCQUF6QixNQUFNLG1CQUFtQjtJQUs5QixZQUE2QixhQUE0QjtRQUE1QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUp4QyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMscUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFLN0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsWUFBWSxDQUFDLElBQUksV0FBVyxDQUFDO1FBRTNFLE1BQU0sTUFBTSxHQUFHLElBQUksZ0NBQWMsQ0FBQztZQUNoQyxNQUFNO1lBQ04sUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLHVCQUF1QixDQUFDO1NBQ2xFLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXBELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMscUJBQXFCLENBQUMsSUFBSSxlQUFlLENBQUM7UUFFMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsOENBQThDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQWlCO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUNyQyxJQUFJLHlCQUFVLENBQUM7Z0JBQ2IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUU7YUFDbkIsQ0FBQyxDQUNILENBQUM7WUFFRixPQUFRLE1BQU0sQ0FBQyxJQUEyQixJQUFJLElBQUksQ0FBQztRQUNyRCxDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssMkJBQTJCLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxZQUFZLEdBQUcsbUJBQW1CLElBQUksQ0FBQyxTQUFTLDZDQUE2QyxDQUFDO2dCQUNwRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekUsTUFBTSxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUFsRFksa0RBQW1COzhCQUFuQixtQkFBbUI7SUFEL0IsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsbUJBQW1CLENBa0QvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xyXG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBHZXRDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuXHJcbmV4cG9ydCBlbnVtIEV4cG9ydFN0YXR1cyB7XHJcbiAgUEVORElORyA9ICdwZW5kaW5nJyxcclxuICBQUk9DRVNTSU5HID0gJ3Byb2Nlc3NpbmcnLFxyXG4gIENPTVBMRVRFRCA9ICdjb21wbGV0ZWQnLFxyXG4gIEZBSUxFRCA9ICdmYWlsZWQnLFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEV4cG9ydFN0YXR1c1JlY29yZCB7XHJcbiAgcmVxdWVzdElkOiBzdHJpbmc7XHJcbiAgc3RhdHVzOiBFeHBvcnRTdGF0dXM7XHJcbiAgY3JlYXRlZEF0OiBzdHJpbmc7XHJcbiAgdXBkYXRlZEF0OiBzdHJpbmc7XHJcbiAgdHRsPzogbnVtYmVyO1xyXG4gIHNpZ25lZFVybD86IHN0cmluZztcclxuICBmaWxlTmFtZT86IHN0cmluZztcclxuICBlcnJvcj86IHN0cmluZztcclxufVxyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgRXhwb3J0U3RhdHVzU2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKEV4cG9ydFN0YXR1c1NlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkeW5hbW9EQjogRHluYW1vREJEb2N1bWVudENsaWVudDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRhYmxlTmFtZTogc3RyaW5nO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UpIHtcclxuICAgIGNvbnN0IHJlZ2lvbiA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignQVdTX1JFR0lPTicpIHx8ICd1cy1lYXN0LTEnO1xyXG5cclxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7XHJcbiAgICAgIHJlZ2lvbixcclxuICAgICAgZW5kcG9pbnQ6IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPihcIkRZTkFNT0RCX0VORFBPSU5UX1VSTFwiKSxcclxuICAgIH0pO1xyXG4gICAgdGhpcy5keW5hbW9EQiA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShjbGllbnQpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRhYmxlTmFtZSA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignRFlOQU1PREJfVEFCTEVfTkFNRScpIHx8ICdleHBvcnQtc3RhdHVzJztcclxuXHJcbiAgICBpZiAoIXRoaXMudGFibGVOYW1lKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ0RZTkFNT0RCX1RBQkxFX05BTUUgbm90IGNvbmZpZ3VyZWQuJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYEV4cG9ydFN0YXR1c1NlcnZpY2UgaW5pdGlhbGl6ZWQgZm9yIHRhYmxlOiAke3RoaXMudGFibGVOYW1lfWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT2J0aWVuZSBlbCBlc3RhZG8gZGUgdW4gcHJvY2VzbyBwb3Igc3UgcmVxdWVzdElkIGRlc2RlIER5bmFtb0RCXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0U3RhdHVzKHJlcXVlc3RJZDogc3RyaW5nKTogUHJvbWlzZTxFeHBvcnRTdGF0dXNSZWNvcmQgfCBudWxsPiB7XHJcbiAgICBpZiAoIXRoaXMudGFibGVOYW1lKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRFlOQU1PREJfVEFCTEVfTkFNRSBpcyBub3QgY29uZmlndXJlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vREIuc2VuZChcclxuICAgICAgICBuZXcgR2V0Q29tbWFuZCh7XHJcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxyXG4gICAgICAgICAgS2V5OiB7IHJlcXVlc3RJZCB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcblxyXG4gICAgICByZXR1cm4gKHJlc3VsdC5JdGVtIGFzIEV4cG9ydFN0YXR1c1JlY29yZCkgfHwgbnVsbDtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBEeW5hbW9EQiB0YWJsZSBcIiR7dGhpcy50YWJsZU5hbWV9XCIgbm90IGZvdW5kLiBQbGVhc2UgY3JlYXRlIHRoZSB0YWJsZSBmaXJzdC5gO1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIGdldHRpbmcgc3RhdHVzOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbiJdfQ==