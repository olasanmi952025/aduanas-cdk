"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PollingProcessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingProcessService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let PollingProcessService = PollingProcessService_1 = class PollingProcessService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PollingProcessService_1.name);
        this.pollingApiUrl =
            this.configService.get('ZEDMOUS_API_URL') ||
                this.configService.get('POLLING_API_URL') || '';
        if (!this.pollingApiUrl) {
            this.logger.warn('ZEDMOUS_API_URL or POLLING_API_URL not configured. Polling process integration will not work.');
        }
        this.httpClient = axios_1.default.create({
            timeout: 30000, // 30 segundos
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Envía un proceso al polling_process usando POST /process
     * @param processType Tipo de proceso (ej: 'manifest.close')
     * @param payload Payload del proceso
     * @returns Respuesta con jobId y estado
     */
    async submitProcess(processType, payload) {
        if (!this.pollingApiUrl) {
            throw new common_1.HttpException('ZEDMOUS_API_URL or POLLING_API_URL not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const url = `${this.pollingApiUrl}/process`;
            this.logger.log(`Submitting process to polling_process: ${processType}`);
            const response = await this.httpClient.post(url, {
                processType,
                payload,
            });
            this.logger.log(`Process submitted successfully. JobId: ${response.data.jobId}, Status: ${response.data.status}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to submit process to polling_process: ${processType}`, error.message);
            if (error.response) {
                throw new common_1.HttpException(`Error submitting process: ${error.response.status} ${error.response.statusText}`, error.response.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw new common_1.HttpException(`Error submitting process: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Consulta el estado de un proceso usando GET /process/:jobId
     * @param jobId ID del job
     * @returns Estado del proceso
     */
    async getProcessStatus(jobId) {
        if (!this.pollingApiUrl) {
            throw new common_1.HttpException('ZEDMOUS_API_URL or POLLING_API_URL not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const url = `${this.pollingApiUrl}/process/${jobId}`;
            const response = await this.httpClient.get(url);
            this.logger.log(`Process status retrieved. JobId: ${jobId}, Status: ${response.data.status}`);
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new common_1.HttpException(`Process not found for jobId: ${jobId}`, common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.error(`Failed to get process status for jobId: ${jobId}`, error.message);
            throw new common_1.HttpException(`Error consulting process status: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PollingProcessService = PollingProcessService;
exports.PollingProcessService = PollingProcessService = PollingProcessService_1 = __decorate([
    (0, common_1.Injectable)()
], PollingProcessService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9sbGluZy1wcm9jZXNzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwb2xsaW5nLXByb2Nlc3Muc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQStFO0FBRS9FLGtEQUE2QztBQW1CdEMsSUFBTSxxQkFBcUIsNkJBQTNCLE1BQU0scUJBQXFCO0lBS2hDLFlBQTZCLGFBQTRCO1FBQTVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBSnhDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyx1QkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUsvRCxJQUFJLENBQUMsYUFBYTtZQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBUyxpQkFBaUIsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFMUQsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywrRkFBK0YsQ0FBQyxDQUFDO1FBQ3BILENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLGVBQUssQ0FBQyxNQUFNLENBQUM7WUFDN0IsT0FBTyxFQUFFLEtBQUssRUFBRSxjQUFjO1lBQzlCLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FDakIsV0FBbUIsRUFDbkIsT0FBYTtRQUViLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLHNCQUFhLENBQ3JCLG1EQUFtRCxFQUNuRCxtQkFBVSxDQUFDLHFCQUFxQixDQUNqQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsVUFBVSxDQUFDO1lBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNiLDBDQUEwQyxXQUFXLEVBQUUsQ0FDeEQsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQ3pDLEdBQUcsRUFDSDtnQkFDRSxXQUFXO2dCQUNYLE9BQU87YUFDUixDQUNGLENBQUM7WUFFRixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FDYiwwQ0FBMEMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLGFBQWEsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FDakcsQ0FBQztZQUVGLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztRQUN2QixDQUFDO1FBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDZixnREFBZ0QsV0FBVyxFQUFFLEVBQzdELEtBQUssQ0FBQyxPQUFPLENBQ2QsQ0FBQztZQUVGLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixNQUFNLElBQUksc0JBQWEsQ0FDckIsNkJBQTZCLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQ2pGLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLG1CQUFVLENBQUMscUJBQXFCLENBQzFELENBQUM7WUFDSixDQUFDO1lBRUQsTUFBTSxJQUFJLHNCQUFhLENBQ3JCLDZCQUE2QixLQUFLLENBQUMsT0FBTyxFQUFFLEVBQzVDLG1CQUFVLENBQUMscUJBQXFCLENBQ2pDLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBYTtRQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sSUFBSSxzQkFBYSxDQUNyQixtREFBbUQsRUFDbkQsbUJBQVUsQ0FBQyxxQkFBcUIsQ0FDakMsQ0FBQztRQUNKLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLFlBQVksS0FBSyxFQUFFLENBQUM7WUFFckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBd0IsR0FBRyxDQUFDLENBQUM7WUFFdkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQ2Isb0NBQW9DLEtBQUssYUFBYSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUM3RSxDQUFDO1lBRUYsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSxzQkFBYSxDQUNyQixnQ0FBZ0MsS0FBSyxFQUFFLEVBQ3ZDLG1CQUFVLENBQUMsU0FBUyxDQUNyQixDQUFDO1lBQ0osQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNmLDJDQUEyQyxLQUFLLEVBQUUsRUFDbEQsS0FBSyxDQUFDLE9BQU8sQ0FDZCxDQUFDO1lBRUYsTUFBTSxJQUFJLHNCQUFhLENBQ3JCLG9DQUFvQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQ25ELG1CQUFVLENBQUMscUJBQXFCLENBQ2pDLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUF6SFksc0RBQXFCO2dDQUFyQixxQkFBcUI7SUFEakMsSUFBQSxtQkFBVSxHQUFFO0dBQ0EscUJBQXFCLENBeUhqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIExvZ2dlciwgSHR0cEV4Y2VwdGlvbiwgSHR0cFN0YXR1cyB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IGF4aW9zLCB7IEF4aW9zSW5zdGFuY2UgfSBmcm9tICdheGlvcyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN1Ym1pdFByb2Nlc3NSZXNwb25zZSB7XHJcbiAgam9iSWQ6IHN0cmluZztcclxuICBzdGF0dXM6IHN0cmluZztcclxuICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2Vzc1N0YXR1c1Jlc3BvbnNlIHtcclxuICBqb2JJZDogc3RyaW5nO1xyXG4gIHByb2Nlc3NUeXBlOiBzdHJpbmc7XHJcbiAgc3RhdHVzOiAncGVuZGluZycgfCAncHJvY2Vzc2luZycgfCAnY29tcGxldGVkJyB8ICdmYWlsZWQnO1xyXG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xyXG4gIGNvbXBsZXRlZEF0Pzogc3RyaW5nO1xyXG4gIHJlc3VsdD86IGFueTtcclxuICBlcnJvcj86IHN0cmluZztcclxufVxyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgUG9sbGluZ1Byb2Nlc3NTZXJ2aWNlIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoUG9sbGluZ1Byb2Nlc3NTZXJ2aWNlLm5hbWUpO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaHR0cENsaWVudDogQXhpb3NJbnN0YW5jZTtcclxuICBwcml2YXRlIHJlYWRvbmx5IHBvbGxpbmdBcGlVcmw6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlKSB7XHJcbiAgICB0aGlzLnBvbGxpbmdBcGlVcmwgPSBcclxuICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdaRURNT1VTX0FQSV9VUkwnKSB8fCBcclxuICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdQT0xMSU5HX0FQSV9VUkwnKSB8fCAnJztcclxuICAgIFxyXG4gICAgaWYgKCF0aGlzLnBvbGxpbmdBcGlVcmwpIHtcclxuICAgICAgdGhpcy5sb2dnZXIud2FybignWkVETU9VU19BUElfVVJMIG9yIFBPTExJTkdfQVBJX1VSTCBub3QgY29uZmlndXJlZC4gUG9sbGluZyBwcm9jZXNzIGludGVncmF0aW9uIHdpbGwgbm90IHdvcmsuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5odHRwQ2xpZW50ID0gYXhpb3MuY3JlYXRlKHtcclxuICAgICAgdGltZW91dDogMzAwMDAsIC8vIDMwIHNlZ3VuZG9zXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbnbDrWEgdW4gcHJvY2VzbyBhbCBwb2xsaW5nX3Byb2Nlc3MgdXNhbmRvIFBPU1QgL3Byb2Nlc3NcclxuICAgKiBAcGFyYW0gcHJvY2Vzc1R5cGUgVGlwbyBkZSBwcm9jZXNvIChlajogJ21hbmlmZXN0LmNsb3NlJylcclxuICAgKiBAcGFyYW0gcGF5bG9hZCBQYXlsb2FkIGRlbCBwcm9jZXNvXHJcbiAgICogQHJldHVybnMgUmVzcHVlc3RhIGNvbiBqb2JJZCB5IGVzdGFkb1xyXG4gICAqL1xyXG4gIGFzeW5jIHN1Ym1pdFByb2Nlc3MoXHJcbiAgICBwcm9jZXNzVHlwZTogc3RyaW5nLFxyXG4gICAgcGF5bG9hZD86IGFueVxyXG4gICk6IFByb21pc2U8U3VibWl0UHJvY2Vzc1Jlc3BvbnNlPiB7XHJcbiAgICBpZiAoIXRoaXMucG9sbGluZ0FwaVVybCkge1xyXG4gICAgICB0aHJvdyBuZXcgSHR0cEV4Y2VwdGlvbihcclxuICAgICAgICAnWkVETU9VU19BUElfVVJMIG9yIFBPTExJTkdfQVBJX1VSTCBub3QgY29uZmlndXJlZCcsXHJcbiAgICAgICAgSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1JcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB1cmwgPSBgJHt0aGlzLnBvbGxpbmdBcGlVcmx9L3Byb2Nlc3NgO1xyXG4gICAgICBcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKFxyXG4gICAgICAgIGBTdWJtaXR0aW5nIHByb2Nlc3MgdG8gcG9sbGluZ19wcm9jZXNzOiAke3Byb2Nlc3NUeXBlfWBcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LnBvc3Q8U3VibWl0UHJvY2Vzc1Jlc3BvbnNlPihcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHJvY2Vzc1R5cGUsXHJcbiAgICAgICAgICBwYXlsb2FkLFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhcclxuICAgICAgICBgUHJvY2VzcyBzdWJtaXR0ZWQgc3VjY2Vzc2Z1bGx5LiBKb2JJZDogJHtyZXNwb25zZS5kYXRhLmpvYklkfSwgU3RhdHVzOiAke3Jlc3BvbnNlLmRhdGEuc3RhdHVzfWBcclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcclxuICAgICAgICBgRmFpbGVkIHRvIHN1Ym1pdCBwcm9jZXNzIHRvIHBvbGxpbmdfcHJvY2VzczogJHtwcm9jZXNzVHlwZX1gLFxyXG4gICAgICAgIGVycm9yLm1lc3NhZ2VcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmIChlcnJvci5yZXNwb25zZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBIdHRwRXhjZXB0aW9uKFxyXG4gICAgICAgICAgYEVycm9yIHN1Ym1pdHRpbmcgcHJvY2VzczogJHtlcnJvci5yZXNwb25zZS5zdGF0dXN9ICR7ZXJyb3IucmVzcG9uc2Uuc3RhdHVzVGV4dH1gLFxyXG4gICAgICAgICAgZXJyb3IucmVzcG9uc2Uuc3RhdHVzIHx8IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhyb3cgbmV3IEh0dHBFeGNlcHRpb24oXHJcbiAgICAgICAgYEVycm9yIHN1Ym1pdHRpbmcgcHJvY2VzczogJHtlcnJvci5tZXNzYWdlfWAsXHJcbiAgICAgICAgSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1JcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bHRhIGVsIGVzdGFkbyBkZSB1biBwcm9jZXNvIHVzYW5kbyBHRVQgL3Byb2Nlc3MvOmpvYklkXHJcbiAgICogQHBhcmFtIGpvYklkIElEIGRlbCBqb2JcclxuICAgKiBAcmV0dXJucyBFc3RhZG8gZGVsIHByb2Nlc29cclxuICAgKi9cclxuICBhc3luYyBnZXRQcm9jZXNzU3RhdHVzKGpvYklkOiBzdHJpbmcpOiBQcm9taXNlPFByb2Nlc3NTdGF0dXNSZXNwb25zZT4ge1xyXG4gICAgaWYgKCF0aGlzLnBvbGxpbmdBcGlVcmwpIHtcclxuICAgICAgdGhyb3cgbmV3IEh0dHBFeGNlcHRpb24oXHJcbiAgICAgICAgJ1pFRE1PVVNfQVBJX1VSTCBvciBQT0xMSU5HX0FQSV9VUkwgbm90IGNvbmZpZ3VyZWQnLFxyXG4gICAgICAgIEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdXJsID0gYCR7dGhpcy5wb2xsaW5nQXBpVXJsfS9wcm9jZXNzLyR7am9iSWR9YDtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LmdldDxQcm9jZXNzU3RhdHVzUmVzcG9uc2U+KHVybCk7XHJcblxyXG4gICAgICB0aGlzLmxvZ2dlci5sb2coXHJcbiAgICAgICAgYFByb2Nlc3Mgc3RhdHVzIHJldHJpZXZlZC4gSm9iSWQ6ICR7am9iSWR9LCBTdGF0dXM6ICR7cmVzcG9uc2UuZGF0YS5zdGF0dXN9YFxyXG4gICAgICApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGlmIChlcnJvci5yZXNwb25zZT8uc3RhdHVzID09PSA0MDQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgSHR0cEV4Y2VwdGlvbihcclxuICAgICAgICAgIGBQcm9jZXNzIG5vdCBmb3VuZCBmb3Igam9iSWQ6ICR7am9iSWR9YCxcclxuICAgICAgICAgIEh0dHBTdGF0dXMuTk9UX0ZPVU5EXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXHJcbiAgICAgICAgYEZhaWxlZCB0byBnZXQgcHJvY2VzcyBzdGF0dXMgZm9yIGpvYklkOiAke2pvYklkfWAsXHJcbiAgICAgICAgZXJyb3IubWVzc2FnZVxyXG4gICAgICApO1xyXG5cclxuICAgICAgdGhyb3cgbmV3IEh0dHBFeGNlcHRpb24oXHJcbiAgICAgICAgYEVycm9yIGNvbnN1bHRpbmcgcHJvY2VzcyBzdGF0dXM6ICR7ZXJyb3IubWVzc2FnZX1gLFxyXG4gICAgICAgIEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=