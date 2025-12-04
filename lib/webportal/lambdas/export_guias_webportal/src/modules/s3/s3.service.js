"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
// SDK v3
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3Service = S3Service_1 = class S3Service {
    constructor(configService, awsConfigService) {
        this.configService = configService;
        this.awsConfigService = awsConfigService;
        this.logger = new common_1.Logger(S3Service_1.name);
        this.bucketName =
            this.configService.get('S3_BUCKET_NAME') ||
                'pweb-ms-export-guias';
        // Ahora es S3Client v3
        this.s3 = this.awsConfigService.createS3Client();
        this.logger.log(`S3 Service (SDK v3) initialized for bucket: ${this.bucketName}`);
    }
    // ==================================================
    // UPLOAD FILE (SDK v3)
    // ==================================================
    async uploadFile(options) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: options.key,
                Body: options.buffer,
                ContentType: options.contentType,
                ServerSideEncryption: options.encryption || 'AES256',
            });
            await this.s3.send(command);
            const location = `s3://${this.bucketName}/${options.key}`;
            this.logger.log(`File uploaded to S3: ${location}`);
            return location;
        }
        catch (error) {
            this.logger.error(`Error uploading file to S3: ${error.message}`, error.stack);
            throw new Error(`Error uploading file to S3: ${error.message}`);
        }
    }
    // ==================================================
    // SIGNED URL (SDK v3)
    // ==================================================
    async getSignedUrl(options) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: options.key,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, {
                expiresIn: options.expiresIn || 3600,
            });
            this.logger.debug(`Signed URL generated for: ${options.key}`);
            return url;
        }
        catch (error) {
            this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
            throw new Error(`Error generating signed URL: ${error.message}`);
        }
    }
    // ==================================================
    // DELETE FILE (SDK v3)
    // ==================================================
    async deleteFile(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3.send(command);
            this.logger.log(`File deleted from S3: ${key}`);
        }
        catch (error) {
            this.logger.error(`Error deleting file from S3: ${error.message}`, error.stack);
            throw new Error(`Error deleting file from S3: ${error.message}`);
        }
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)()
], S3Service);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInMzLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLDJDQUFvRDtBQUdwRCxTQUFTO0FBQ1Qsa0RBSzRCO0FBRTVCLHdFQUE2RDtBQWlCdEQsSUFBTSxTQUFTLGlCQUFmLE1BQU0sU0FBUztJQUtwQixZQUNtQixhQUE0QixFQUM1QixnQkFBa0M7UUFEbEMsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFDNUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQU5wQyxXQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsV0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBUW5ELElBQUksQ0FBQyxVQUFVO1lBQ2IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsZ0JBQWdCLENBQUM7Z0JBQ2hELHNCQUFzQixDQUFDO1FBRXpCLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUVqRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQ0FBK0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCx1QkFBdUI7SUFDdkIscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBd0I7UUFDdkMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQUcsSUFBSSw0QkFBZ0IsQ0FBQztnQkFDbkMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUN2QixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7Z0JBQ2hCLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTTtnQkFDcEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO2dCQUNoQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsVUFBVSxJQUFJLFFBQVE7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1QixNQUFNLFFBQVEsR0FBRyxRQUFRLElBQUksQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzFELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHdCQUF3QixRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRXBELE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLCtCQUErQixLQUFLLENBQUMsT0FBTyxFQUFFLEVBQzlDLEtBQUssQ0FBQyxLQUFLLENBQ1osQ0FBQztZQUNGLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7SUFDSCxDQUFDO0lBRUQscURBQXFEO0lBQ3JELHNCQUFzQjtJQUN0QixxREFBcUQ7SUFDckQsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUEyQjtRQUM1QyxJQUFJLENBQUM7WUFDSCxNQUFNLE9BQU8sR0FBRyxJQUFJLDRCQUFnQixDQUFDO2dCQUNuQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVU7Z0JBQ3ZCLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRzthQUNqQixDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsbUNBQVksRUFBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRTtnQkFDL0MsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSTthQUNyQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDOUQsT0FBTyxHQUFHLENBQUM7UUFDYixDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZixnQ0FBZ0MsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUMvQyxLQUFLLENBQUMsS0FBSyxDQUNaLENBQUM7WUFDRixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNuRSxDQUFDO0lBQ0gsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCx1QkFBdUI7SUFDdkIscURBQXFEO0lBQ3JELEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBVztRQUMxQixJQUFJLENBQUM7WUFDSCxNQUFNLE9BQU8sR0FBRyxJQUFJLCtCQUFtQixDQUFDO2dCQUN0QyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVU7Z0JBQ3ZCLEdBQUcsRUFBRSxHQUFHO2FBQ1QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZixnQ0FBZ0MsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUMvQyxLQUFLLENBQUMsS0FBSyxDQUNaLENBQUM7WUFDRixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNuRSxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUE3RlksOEJBQVM7b0JBQVQsU0FBUztJQURyQixJQUFBLG1CQUFVLEdBQUU7R0FDQSxTQUFTLENBNkZyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuXHJcbi8vIFNESyB2M1xyXG5pbXBvcnQge1xyXG4gIFMzQ2xpZW50LFxyXG4gIFB1dE9iamVjdENvbW1hbmQsXHJcbiAgRGVsZXRlT2JqZWN0Q29tbWFuZCxcclxuICBHZXRPYmplY3RDb21tYW5kLFxyXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zMyc7XHJcblxyXG5pbXBvcnQgeyBnZXRTaWduZWRVcmwgfSBmcm9tIFwiQGF3cy1zZGsvczMtcmVxdWVzdC1wcmVzaWduZXJcIjtcclxuXHJcbmltcG9ydCB7IEFXU0NvbmZpZ1NlcnZpY2UgfSBmcm9tICcuLi9hd3MnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTM1VwbG9hZE9wdGlvbnMge1xyXG4gIGJ1ZmZlcjogQnVmZmVyO1xyXG4gIGtleTogc3RyaW5nO1xyXG4gIGNvbnRlbnRUeXBlOiBzdHJpbmc7XHJcbiAgZW5jcnlwdGlvbj86ICdBRVMyNTYnIHwgJ2F3czprbXMnO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFMzU2lnbmVkVXJsT3B0aW9ucyB7XHJcbiAga2V5OiBzdHJpbmc7XHJcbiAgZXhwaXJlc0luPzogbnVtYmVyO1xyXG59XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBTM1NlcnZpY2Uge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgbG9nZ2VyID0gbmV3IExvZ2dlcihTM1NlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBzMzogUzNDbGllbnQ7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBidWNrZXROYW1lOiBzdHJpbmc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBhd3NDb25maWdTZXJ2aWNlOiBBV1NDb25maWdTZXJ2aWNlLFxyXG4gICkge1xyXG4gICAgdGhpcy5idWNrZXROYW1lID1cclxuICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdTM19CVUNLRVRfTkFNRScpIHx8XHJcbiAgICAgICdwd2ViLW1zLWV4cG9ydC1ndWlhcyc7XHJcblxyXG4gICAgLy8gQWhvcmEgZXMgUzNDbGllbnQgdjNcclxuICAgIHRoaXMuczMgPSB0aGlzLmF3c0NvbmZpZ1NlcnZpY2UuY3JlYXRlUzNDbGllbnQoKTtcclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFMzIFNlcnZpY2UgKFNESyB2MykgaW5pdGlhbGl6ZWQgZm9yIGJ1Y2tldDogJHt0aGlzLmJ1Y2tldE5hbWV9YCk7XHJcbiAgfVxyXG5cclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIC8vIFVQTE9BRCBGSUxFIChTREsgdjMpXHJcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICBhc3luYyB1cGxvYWRGaWxlKG9wdGlvbnM6IFMzVXBsb2FkT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFB1dE9iamVjdENvbW1hbmQoe1xyXG4gICAgICAgIEJ1Y2tldDogdGhpcy5idWNrZXROYW1lLFxyXG4gICAgICAgIEtleTogb3B0aW9ucy5rZXksXHJcbiAgICAgICAgQm9keTogb3B0aW9ucy5idWZmZXIsXHJcbiAgICAgICAgQ29udGVudFR5cGU6IG9wdGlvbnMuY29udGVudFR5cGUsXHJcbiAgICAgICAgU2VydmVyU2lkZUVuY3J5cHRpb246IG9wdGlvbnMuZW5jcnlwdGlvbiB8fCAnQUVTMjU2JyxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBhd2FpdCB0aGlzLnMzLnNlbmQoY29tbWFuZCk7XHJcblxyXG4gICAgICBjb25zdCBsb2NhdGlvbiA9IGBzMzovLyR7dGhpcy5idWNrZXROYW1lfS8ke29wdGlvbnMua2V5fWA7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgRmlsZSB1cGxvYWRlZCB0byBTMzogJHtsb2NhdGlvbn1gKTtcclxuXHJcbiAgICAgIHJldHVybiBsb2NhdGlvbjtcclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgYEVycm9yIHVwbG9hZGluZyBmaWxlIHRvIFMzOiAke2Vycm9yLm1lc3NhZ2V9YCxcclxuICAgICAgICBlcnJvci5zdGFjayxcclxuICAgICAgKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciB1cGxvYWRpbmcgZmlsZSB0byBTMzogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAvLyBTSUdORUQgVVJMIChTREsgdjMpXHJcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICBhc3luYyBnZXRTaWduZWRVcmwob3B0aW9uczogUzNTaWduZWRVcmxPcHRpb25zKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XHJcbiAgICAgICAgQnVja2V0OiB0aGlzLmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgS2V5OiBvcHRpb25zLmtleSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zdCB1cmwgPSBhd2FpdCBnZXRTaWduZWRVcmwodGhpcy5zMywgY29tbWFuZCwge1xyXG4gICAgICAgIGV4cGlyZXNJbjogb3B0aW9ucy5leHBpcmVzSW4gfHwgMzYwMCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgU2lnbmVkIFVSTCBnZW5lcmF0ZWQgZm9yOiAke29wdGlvbnMua2V5fWApO1xyXG4gICAgICByZXR1cm4gdXJsO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICBgRXJyb3IgZ2VuZXJhdGluZyBzaWduZWQgVVJMOiAke2Vycm9yLm1lc3NhZ2V9YCxcclxuICAgICAgICBlcnJvci5zdGFjayxcclxuICAgICAgKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZW5lcmF0aW5nIHNpZ25lZCBVUkw6ICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgLy8gREVMRVRFIEZJTEUgKFNESyB2MylcclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gIGFzeW5jIGRlbGV0ZUZpbGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVsZXRlT2JqZWN0Q29tbWFuZCh7XHJcbiAgICAgICAgQnVja2V0OiB0aGlzLmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgS2V5OiBrZXksXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYXdhaXQgdGhpcy5zMy5zZW5kKGNvbW1hbmQpO1xyXG5cclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBGaWxlIGRlbGV0ZWQgZnJvbSBTMzogJHtrZXl9YCk7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFxyXG4gICAgICAgIGBFcnJvciBkZWxldGluZyBmaWxlIGZyb20gUzM6ICR7ZXJyb3IubWVzc2FnZX1gLFxyXG4gICAgICAgIGVycm9yLnN0YWNrLFxyXG4gICAgICApO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGRlbGV0aW5nIGZpbGUgZnJvbSBTMzogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=