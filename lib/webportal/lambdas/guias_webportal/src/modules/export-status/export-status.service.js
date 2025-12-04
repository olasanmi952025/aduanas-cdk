"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExportStatusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStatusService = void 0;
const common_1 = require("@nestjs/common");
let ExportStatusService = ExportStatusService_1 = class ExportStatusService {
    constructor(configService, awsConfigService) {
        this.configService = configService;
        this.awsConfigService = awsConfigService;
        this.logger = new common_1.Logger(ExportStatusService_1.name);
        this.tableName =
            this.configService.get("DYNAMODB_TABLE_NAME") || "";
        this.dynamoDB = this.awsConfigService.createDynamoDBClient();
        if (!this.tableName) {
            this.logger.warn("DYNAMODB_TABLE_NAME not configured.");
        }
        else {
            this.logger.log(`ExportStatusService initialized for table: ${this.tableName}`);
        }
    }
    /**
     * Obtiene el estado de una exportación por su requestId
     */
    async getStatus(requestId) {
        if (!this.tableName) {
            throw new Error("DYNAMODB_TABLE_NAME is not configured");
        }
        try {
            const result = await this.dynamoDB
                .get({
                TableName: this.tableName,
                Key: { requestId },
            })
                .promise();
            return result.Item || null;
        }
        catch (error) {
            if (error.code === "ResourceNotFoundException") {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFPN0MsSUFBTSxtQkFBbUIsMkJBQXpCLE1BQU0sbUJBQW1CO0lBSzlCLFlBQ21CLGFBQTRCLEVBQzVCLGdCQUFrQztRQURsQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUM1QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBTnBDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxxQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQVE3RCxJQUFJLENBQUMsU0FBUztZQUNaLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1FBRTlELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQ2IsOENBQThDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FDL0QsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQWlCO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRO2lCQUMvQixHQUFHLENBQUM7Z0JBQ0gsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUU7YUFDbkIsQ0FBQztpQkFDRCxPQUFPLEVBQUUsQ0FBQztZQUViLE9BQVEsTUFBTSxDQUFDLElBQTJCLElBQUksSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSywyQkFBMkIsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLFlBQVksR0FBRyxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsNkNBQTZDLENBQUM7Z0JBQ3BHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RSxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQWxEWSxrREFBbUI7OEJBQW5CLG1CQUFtQjtJQUQvQixJQUFBLG1CQUFVLEdBQUU7R0FDQSxtQkFBbUIsQ0FrRC9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTG9nZ2VyIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tIFwiQG5lc3Rqcy9jb25maWdcIjtcclxuaW1wb3J0IHsgQVdTQ29uZmlnU2VydmljZSB9IGZyb20gXCIuLi9hd3NcIjtcclxuaW1wb3J0ICogYXMgQVdTIGZyb20gXCJhd3Mtc2RrXCI7XHJcbmltcG9ydCB7IEV4cG9ydFN0YXR1c1JlY29yZCB9IGZyb20gXCIuL2ludGVyZmFjZXMvZXhwb3J0LnN0YXR1c1wiO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgRXhwb3J0U3RhdHVzU2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKEV4cG9ydFN0YXR1c1NlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBkeW5hbW9EQjogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50O1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgdGFibGVOYW1lOiBzdHJpbmc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhd3NDb25maWdTZXJ2aWNlOiBBV1NDb25maWdTZXJ2aWNlLFxyXG4gICkge1xyXG4gICAgdGhpcy50YWJsZU5hbWUgPVxyXG4gICAgICB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oXCJEWU5BTU9EQl9UQUJMRV9OQU1FXCIpIHx8IFwiXCI7XHJcblxyXG4gICAgdGhpcy5keW5hbW9EQiA9IHRoaXMuYXdzQ29uZmlnU2VydmljZS5jcmVhdGVEeW5hbW9EQkNsaWVudCgpO1xyXG5cclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybihcIkRZTkFNT0RCX1RBQkxFX05BTUUgbm90IGNvbmZpZ3VyZWQuXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKFxyXG4gICAgICAgIGBFeHBvcnRTdGF0dXNTZXJ2aWNlIGluaXRpYWxpemVkIGZvciB0YWJsZTogJHt0aGlzLnRhYmxlTmFtZX1gXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPYnRpZW5lIGVsIGVzdGFkbyBkZSB1bmEgZXhwb3J0YWNpw7NuIHBvciBzdSByZXF1ZXN0SWRcclxuICAgKi9cclxuICBhc3luYyBnZXRTdGF0dXMocmVxdWVzdElkOiBzdHJpbmcpOiBQcm9taXNlPEV4cG9ydFN0YXR1c1JlY29yZCB8IG51bGw+IHtcclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRFlOQU1PREJfVEFCTEVfTkFNRSBpcyBub3QgY29uZmlndXJlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmR5bmFtb0RCXHJcbiAgICAgICAgLmdldCh7XHJcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxyXG4gICAgICAgICAgS2V5OiB7IHJlcXVlc3RJZCB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnByb21pc2UoKTtcclxuXHJcbiAgICAgIHJldHVybiAocmVzdWx0Lkl0ZW0gYXMgRXhwb3J0U3RhdHVzUmVjb3JkKSB8fCBudWxsO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBpZiAoZXJyb3IuY29kZSA9PT0gXCJSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uXCIpIHtcclxuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgRHluYW1vREIgdGFibGUgXCIke3RoaXMudGFibGVOYW1lfVwiIG5vdCBmb3VuZC4gUGxlYXNlIGNyZWF0ZSB0aGUgdGFibGUgZmlyc3QuYDtcclxuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBnZXR0aW5nIHN0YXR1czogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=