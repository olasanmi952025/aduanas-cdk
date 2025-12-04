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
var ExportStatus;
(function (ExportStatus) {
    ExportStatus["PENDING"] = "pending";
    ExportStatus["PROCESSING"] = "processing";
    ExportStatus["COMPLETED"] = "completed";
    ExportStatus["FAILED"] = "failed";
})(ExportStatus || (exports.ExportStatus = ExportStatus = {}));
let ExportStatusService = ExportStatusService_1 = class ExportStatusService {
    constructor(configService, awsConfigService) {
        this.configService = configService;
        this.awsConfigService = awsConfigService;
        this.logger = new common_1.Logger(ExportStatusService_1.name);
        this.tableName = this.configService.get('DYNAMODB_TABLE_NAME') || 'export-status';
        this.dynamoDB = this.awsConfigService.createDynamoDBClient();
        if (!this.tableName) {
            this.logger.warn('DYNAMODB_TABLE_NAME not configured.');
        }
        else {
            this.logger.log(`ExportStatusService initialized for table: ${this.tableName}`);
        }
    }
    /**
     * Crea un registro con estado pendiente en DynamoDB
     * El TTL se establece a 15 minutos desde la creación
     */
    async createPendingStatus(requestId, fileName) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
        }
        const now = new Date();
        // TTL en segundos Unix timestamp (15 minutos = 900 segundos)
        const ttl = Math.floor(now.getTime() / 1000) + 15 * 60;
        const record = {
            requestId,
            status: ExportStatus.PENDING,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            ttl,
            fileName,
        };
        try {
            await this.dynamoDB
                .put({
                TableName: this.tableName,
                Item: record,
            })
                .promise();
            this.logger.log(`Created pending status for requestId: ${requestId}`);
        }
        catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.logger.error(`Error creating pending status: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Actualiza el estado a "processing" cuando el consumidor inicia el procesamiento
     */
    async updateToProcessing(requestId) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
        }
        try {
            await this.dynamoDB
                .update({
                TableName: this.tableName,
                Key: { requestId },
                UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':status': ExportStatus.PROCESSING,
                    ':updatedAt': new Date().toISOString(),
                },
            })
                .promise();
            this.logger.log(`Updated status to processing for requestId: ${requestId}`);
        }
        catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.logger.error(`Error updating status to processing: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Actualiza el estado a "completed" con la URL firmada y el nombre del archivo
     * La URL firmada tiene una expiración de 1 hora
     */
    async updateToCompleted(requestId, signedUrl, fileName) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
        }
        try {
            await this.dynamoDB
                .update({
                TableName: this.tableName,
                Key: { requestId },
                UpdateExpression: 'SET #status = :status, signedUrl = :signedUrl, fileName = :fileName, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':status': ExportStatus.COMPLETED,
                    ':signedUrl': signedUrl,
                    ':fileName': fileName,
                    ':updatedAt': new Date().toISOString(),
                },
            })
                .promise();
            this.logger.log(`Updated status to completed for requestId: ${requestId}`);
        }
        catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.logger.error(`Error updating status to completed: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Actualiza el estado a "failed" con el mensaje de error
     */
    async updateToFailed(requestId, error) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
        }
        try {
            await this.dynamoDB
                .update({
                TableName: this.tableName,
                Key: { requestId },
                UpdateExpression: 'SET #status = :status, #error = :error, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                    '#error': 'error',
                },
                ExpressionAttributeValues: {
                    ':status': ExportStatus.FAILED,
                    ':error': error,
                    ':updatedAt': new Date().toISOString(),
                },
            })
                .promise();
            this.logger.log(`Updated status to failed for requestId: ${requestId}`);
        }
        catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
                this.logger.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.logger.error(`Error updating status to failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    /**
     * Obtiene el estado de una exportación por su requestId
     */
    async getStatus(requestId) {
        if (!this.tableName) {
            throw new Error('DYNAMODB_TABLE_NAME is not configured');
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
            if (error.code === 'ResourceNotFoundException') {
                const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhwb3J0LXN0YXR1cy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFLcEQsSUFBWSxZQUtYO0FBTEQsV0FBWSxZQUFZO0lBQ3RCLG1DQUFtQixDQUFBO0lBQ25CLHlDQUF5QixDQUFBO0lBQ3pCLHVDQUF1QixDQUFBO0lBQ3ZCLGlDQUFpQixDQUFBO0FBQ25CLENBQUMsRUFMVyxZQUFZLDRCQUFaLFlBQVksUUFLdkI7QUFjTSxJQUFNLG1CQUFtQiwyQkFBekIsTUFBTSxtQkFBbUI7SUFLOUIsWUFDbUIsYUFBNEIsRUFDNUIsZ0JBQWtDO1FBRGxDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBQzVCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFOcEMsV0FBTSxHQUFHLElBQUksZUFBTSxDQUFDLHFCQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBUTdELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMscUJBQXFCLENBQUMsSUFBSSxlQUFlLENBQUM7UUFDMUYsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUU3RCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDMUQsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw4Q0FBOEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsbUJBQW1CLENBQUMsU0FBaUIsRUFBRSxRQUFpQjtRQUM1RCxJQUFJLENBQUMs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QyxDQUFDO1lBQ3pFLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFBO0FBOU1ZLGtEQUFtQjs4QkFBbkIsbUJBQW1CO0lBRC9CLElBQUEsbUJBQVUsR0FBRTtHQUNBLG1CQUFtQixDQThNL0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ1NlcnZpY2UgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IEFXU0NvbmZpZ1NlcnZpY2UgfSBmcm9tICcuLi9hd3MnO1xyXG5pbXBvcnQgKiBhcyBBV1MgZnJvbSAnYXdzLXNkayc7XHJcblxyXG5leHBvcnQgZW51bSBFeHBvcnRTdGF0dXMge1xyXG4gIFBFTkRJTkcgPSAncGVuZGluZycsXHJcbiAgUFJPQ0VTU0lORyA9ICdwcm9jZXNzaW5nJyxcclxuICBDT01QTEVURUQgPSAnY29tcGxldGVkJyxcclxuICBGQUlMRUQgPSAnZmFpbGVkJyxcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFeHBvcnRTdGF0dXNSZWNvcmQge1xyXG4gIHJlcXVlc3RJZDogc3RyaW5nO1xyXG4gIHN0YXR1czogRXhwb3J0U3RhdHVzO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIHVwZGF0ZWRBdDogc3RyaW5nO1xyXG4gIHR0bD86IG51bWJlcjtcclxuICBzaWduZWRVcmw/OiBzdHJpbmc7XHJcbiAgZmlsZU5hbWU/OiBzdHJpbmc7XHJcbiAgZXJyb3I/OiBzdHJpbmc7XHJcbn1cclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIEV4cG9ydFN0YXR1c1NlcnZpY2Uge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihFeHBvcnRTdGF0dXNTZXJ2aWNlLm5hbWUpO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgZHluYW1vREI6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudDtcclxuICBwcml2YXRlIHJlYWRvbmx5IHRhYmxlTmFtZTogc3RyaW5nO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnU2VydmljZTogQ29uZmlnU2VydmljZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXdzQ29uZmlnU2VydmljZTogQVdTQ29uZmlnU2VydmljZSxcclxuICApIHtcclxuICAgIHRoaXMudGFibGVOYW1lID0gdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdEWU5BTU9EQl9UQUJMRV9OQU1FJykgfHwgJ2V4cG9ydC1zdGF0dXMnO1xyXG4gICAgdGhpcy5keW5hbW9EQiA9IHRoaXMuYXdzQ29uZmlnU2VydmljZS5jcmVhdGVEeW5hbW9EQkNsaWVudCgpO1xyXG5cclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybignRFlOQU1PREJfVEFCTEVfTkFNRSBub3QgY29uZmlndXJlZC4nKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgRXhwb3J0U3RhdHVzU2VydmljZSBpbml0aWFsaXplZCBmb3IgdGFibGU6ICR7dGhpcy50YWJsZU5hbWV9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhIHVuIHJlZ2lzdHJvIGNvbiBlc3RhZG8gcGVuZGllbnRlIGVuIER5bmFtb0RCXHJcbiAgICogRWwgVFRMIHNlIGVzdGFibGVjZSBhIDE1IG1pbnV0b3MgZGVzZGUgbGEgY3JlYWNpw7NuXHJcbiAgICovXHJcbiAgYXN5bmMgY3JlYXRlUGVuZGluZ1N0YXR1cyhyZXF1ZXN0SWQ6IHN0cmluZywgZmlsZU5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEWU5BTU9EQl9UQUJMRV9OQU1FIGlzIG5vdCBjb25maWd1cmVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIC8vIFRUTCBlbiBzZWd1bmRvcyBVbml4IHRpbWVzdGFtcCAoMTUgbWludXRvcyA9IDkwMCBzZWd1bmRvcylcclxuICAgIGNvbnN0IHR0bCA9IE1hdGguZmxvb3Iobm93LmdldFRpbWUoKSAvIDEwMDApICsgMTUgKiA2MDtcclxuXHJcbiAgICBjb25zdCByZWNvcmQ6IEV4cG9ydFN0YXR1c1JlY29yZCA9IHtcclxuICAgICAgcmVxdWVzdElkLFxyXG4gICAgICBzdGF0dXM6IEV4cG9ydFN0YXR1cy5QRU5ESU5HLFxyXG4gICAgICBjcmVhdGVkQXQ6IG5vdy50b0lTT1N0cmluZygpLFxyXG4gICAgICB1cGRhdGVkQXQ6IG5vdy50b0lTT1N0cmluZygpLFxyXG4gICAgICB0dGwsXHJcbiAgICAgIGZpbGVOYW1lLFxyXG4gICAgfTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0aGlzLmR5bmFtb0RCXHJcbiAgICAgICAgLnB1dCh7XHJcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxyXG4gICAgICAgICAgSXRlbTogcmVjb3JkLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnByb21pc2UoKTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgQ3JlYXRlZCBwZW5kaW5nIHN0YXR1cyBmb3IgcmVxdWVzdElkOiAke3JlcXVlc3RJZH1gKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBEeW5hbW9EQiB0YWJsZSBcIiR7dGhpcy50YWJsZU5hbWV9XCIgbm90IGZvdW5kLiBQbGVhc2UgY3JlYXRlIHRoZSB0YWJsZSBmaXJzdC4gU2VlIERZTkFNT0RCX1NFVFVQLm1kIGZvciBpbnN0cnVjdGlvbnMuYDtcclxuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciBjcmVhdGluZyBwZW5kaW5nIHN0YXR1czogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcclxuICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBY3R1YWxpemEgZWwgZXN0YWRvIGEgXCJwcm9jZXNzaW5nXCIgY3VhbmRvIGVsIGNvbnN1bWlkb3IgaW5pY2lhIGVsIHByb2Nlc2FtaWVudG9cclxuICAgKi9cclxuICBhc3luYyB1cGRhdGVUb1Byb2Nlc3NpbmcocmVxdWVzdElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEWU5BTU9EQl9UQUJMRV9OQU1FIGlzIG5vdCBjb25maWd1cmVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9EQlxyXG4gICAgICAgIC51cGRhdGUoe1xyXG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEtleTogeyByZXF1ZXN0SWQgfSxcclxuICAgICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI3N0YXR1cyA9IDpzdGF0dXMsIHVwZGF0ZWRBdCA9IDp1cGRhdGVkQXQnLFxyXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XHJcbiAgICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICAnOnN0YXR1cyc6IEV4cG9ydFN0YXR1cy5QUk9DRVNTSU5HLFxyXG4gICAgICAgICAgICAnOnVwZGF0ZWRBdCc6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAucHJvbWlzZSgpO1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBVcGRhdGVkIHN0YXR1cyB0byBwcm9jZXNzaW5nIGZvciByZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ1Jlc291cmNlTm90Rm91bmRFeGNlcHRpb24nKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYER5bmFtb0RCIHRhYmxlIFwiJHt0aGlzLnRhYmxlTmFtZX1cIiBub3QgZm91bmQuIFBsZWFzZSBjcmVhdGUgdGhlIHRhYmxlIGZpcnN0LiBTZWUgRFlOQU1PREJfU0VUVVAubWQgZm9yIGluc3RydWN0aW9ucy5gO1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIHVwZGF0aW5nIHN0YXR1cyB0byBwcm9jZXNzaW5nOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdHVhbGl6YSBlbCBlc3RhZG8gYSBcImNvbXBsZXRlZFwiIGNvbiBsYSBVUkwgZmlybWFkYSB5IGVsIG5vbWJyZSBkZWwgYXJjaGl2b1xyXG4gICAqIExhIFVSTCBmaXJtYWRhIHRpZW5lIHVuYSBleHBpcmFjacOzbiBkZSAxIGhvcmFcclxuICAgKi9cclxuICBhc3luYyB1cGRhdGVUb0NvbXBsZXRlZChcclxuICAgIHJlcXVlc3RJZDogc3RyaW5nLFxyXG4gICAgc2lnbmVkVXJsOiBzdHJpbmcsXHJcbiAgICBmaWxlTmFtZTogc3RyaW5nLFxyXG4gICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCF0aGlzLnRhYmxlTmFtZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RZTkFNT0RCX1RBQkxFX05BTUUgaXMgbm90IGNvbmZpZ3VyZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB0aGlzLmR5bmFtb0RCXHJcbiAgICAgICAgLnVwZGF0ZSh7XHJcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxyXG4gICAgICAgICAgS2V5OiB7IHJlcXVlc3RJZCB9LFxyXG4gICAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjpcclxuICAgICAgICAgICAgJ1NFVCAjc3RhdHVzID0gOnN0YXR1cywgc2lnbmVkVXJsID0gOnNpZ25lZFVybCwgZmlsZU5hbWUgPSA6ZmlsZU5hbWUsIHVwZGF0ZWRBdCA9IDp1cGRhdGVkQXQnLFxyXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XHJcbiAgICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICAnOnN0YXR1cyc6IEV4cG9ydFN0YXR1cy5DT01QTEVURUQsXHJcbiAgICAgICAgICAgICc6c2lnbmVkVXJsJzogc2lnbmVkVXJsLFxyXG4gICAgICAgICAgICAnOmZpbGVOYW1lJzogZmlsZU5hbWUsXHJcbiAgICAgICAgICAgICc6dXBkYXRlZEF0JzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5wcm9taXNlKCk7XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFVwZGF0ZWQgc3RhdHVzIHRvIGNvbXBsZXRlZCBmb3IgcmVxdWVzdElkOiAke3JlcXVlc3RJZH1gKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBEeW5hbW9EQiB0YWJsZSBcIiR7dGhpcy50YWJsZU5hbWV9XCIgbm90IGZvdW5kLiBQbGVhc2UgY3JlYXRlIHRoZSB0YWJsZSBmaXJzdC4gU2VlIERZTkFNT0RCX1NFVFVQLm1kIGZvciBpbnN0cnVjdGlvbnMuYDtcclxuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBFcnJvciB1cGRhdGluZyBzdGF0dXMgdG8gY29tcGxldGVkOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjdHVhbGl6YSBlbCBlc3RhZG8gYSBcImZhaWxlZFwiIGNvbiBlbCBtZW5zYWplIGRlIGVycm9yXHJcbiAgICovXHJcbiAgYXN5bmMgdXBkYXRlVG9GYWlsZWQocmVxdWVzdElkOiBzdHJpbmcsIGVycm9yOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy50YWJsZU5hbWUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEWU5BTU9EQl9UQUJMRV9OQU1FIGlzIG5vdCBjb25maWd1cmVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9EQlxyXG4gICAgICAgIC51cGRhdGUoe1xyXG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEtleTogeyByZXF1ZXN0SWQgfSxcclxuICAgICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI3N0YXR1cyA9IDpzdGF0dXMsICNlcnJvciA9IDplcnJvciwgdXBkYXRlZEF0ID0gOnVwZGF0ZWRBdCcsXHJcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcclxuICAgICAgICAgICAgJyNzdGF0dXMnOiAnc3RhdHVzJyxcclxuICAgICAgICAgICAgJyNlcnJvcic6ICdlcnJvcicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICAnOnN0YXR1cyc6IEV4cG9ydFN0YXR1cy5GQUlMRUQsXHJcbiAgICAgICAgICAgICc6ZXJyb3InOiBlcnJvcixcclxuICAgICAgICAgICAgJzp1cGRhdGVkQXQnOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnByb21pc2UoKTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgVXBkYXRlZCBzdGF0dXMgdG8gZmFpbGVkIGZvciByZXF1ZXN0SWQ6ICR7cmVxdWVzdElkfWApO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ1Jlc291cmNlTm90Rm91bmRFeGNlcHRpb24nKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYER5bmFtb0RCIHRhYmxlIFwiJHt0aGlzLnRhYmxlTmFtZX1cIiBub3QgZm91bmQuIFBsZWFzZSBjcmVhdGUgdGhlIHRhYmxlIGZpcnN0LiBTZWUgRFlOQU1PREJfU0VUVVAubWQgZm9yIGluc3RydWN0aW9ucy5gO1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoYEVycm9yIHVwZGF0aW5nIHN0YXR1cyB0byBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogT2J0aWVuZSBlbCBlc3RhZG8gZGUgdW5hIGV4cG9ydGFjacOzbiBwb3Igc3UgcmVxdWVzdElkXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0U3RhdHVzKHJlcXVlc3RJZDogc3RyaW5nKTogUHJvbWlzZTxFeHBvcnRTdGF0dXNSZWNvcmQgfCBudWxsPiB7XHJcbiAgICBpZiAoIXRoaXMudGFibGVOYW1lKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRFlOQU1PREJfVEFCTEVfTkFNRSBpcyBub3QgY29uZmlndXJlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vREJcclxuICAgICAgICAuZ2V0KHtcclxuICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXHJcbiAgICAgICAgICBLZXk6IHsgcmVxdWVzdElkIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICAucHJvbWlzZSgpO1xyXG5cclxuICAgICAgcmV0dXJuIChyZXN1bHQuSXRlbSBhcyBFeHBvcnRTdGF0dXNSZWNvcmQpIHx8IG51bGw7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvci5jb2RlID09PSAnUmVzb3VyY2VOb3RGb3VuZEV4Y2VwdGlvbicpIHtcclxuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBgRHluYW1vREIgdGFibGUgXCIke3RoaXMudGFibGVOYW1lfVwiIG5vdCBmb3VuZC4gUGxlYXNlIGNyZWF0ZSB0aGUgdGFibGUgZmlyc3QuIFNlZSBEWU5BTU9EQl9TRVRVUC5tZCBmb3IgaW5zdHJ1Y3Rpb25zLmA7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihgRXJyb3IgZ2V0dGluZyBzdGF0dXM6ICR7ZXJyb3IubWVzc2FnZX1gLCBlcnJvci5zdGFjayk7XHJcbiAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuIl19