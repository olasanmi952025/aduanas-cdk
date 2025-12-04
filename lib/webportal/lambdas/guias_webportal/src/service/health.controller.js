"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/public.decorator");
//import { DataSource } from 'typeorm';
let HealthController = class HealthController {
    constructor(
    //private readonly dataSource: DataSource
    ) { }
    async getHealth() {
        try {
            // const oracleStatus = await this.testConnection();
            // const dbInfo = await this.getDatabaseInfo();
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                //database: {
                //  oracle: {
                //    connected: oracleStatus,
                //    info: dbInfo,
                //  },
                //},
                environment: process.env.NODE_ENV || 'development',
            };
        }
        catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                //database: {
                //  oracle: {
                //    connected: false,
                //    error: error instanceof Error ? error.message : String(error),
                //  },
                //},
                environment: process.env.NODE_ENV || 'development',
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check del servicio' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Servicio funcionando correctamente' })
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('api/health')
], HealthController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhbHRoLmNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoZWFsdGguY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBaUQ7QUFDakQsNkNBQXFFO0FBQ3JFLCtEQUFrRDtBQUNsRCx1Q0FBdUM7QUFJaEMsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7SUFDM0I7SUFDRSx5Q0FBeUM7UUFDeEMsQ0FBQztJQU1FLEFBQU4sS0FBSyxDQUFDLFNBQVM7UUFDYixJQUFJLENBQUM7WUFDSCxvREFBb0Q7WUFDcEQsK0NBQStDO1lBRS9DLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLElBQUk7Z0JBQ1osU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNuQyxhQUFhO2dCQUNiLGFBQWE7Z0JBQ2IsOEJBQThCO2dCQUM5QixtQkFBbUI7Z0JBQ25CLE1BQU07Z0JBQ04sSUFBSTtnQkFDSixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYTthQUNuRCxDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPO2dCQUNMLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtnQkFDbkMsYUFBYTtnQkFDYixhQUFhO2dCQUNiLHVCQUF1QjtnQkFDdkIsb0VBQW9FO2dCQUNwRSxNQUFNO2dCQUNOLElBQUk7Z0JBQ0osV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLGFBQWE7YUFDbkQsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQXZDWSw0Q0FBZ0I7QUFTckI7SUFKTCxJQUFBLHlCQUFNLEdBQUU7SUFDUixJQUFBLFlBQUcsR0FBRTtJQUNMLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxDQUFDO0lBQ3RELElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLG9DQUFvQyxFQUFFLENBQUM7aURBOEIvRTsyQkF0Q1UsZ0JBQWdCO0lBRjVCLElBQUEsaUJBQU8sRUFBQyxRQUFRLENBQUM7SUFDakIsSUFBQSxtQkFBVSxFQUFDLFlBQVksQ0FBQztHQUNaLGdCQUFnQixDQXVDNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb250cm9sbGVyLCBHZXQgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IEFwaVRhZ3MsIEFwaU9wZXJhdGlvbiwgQXBpUmVzcG9uc2UgfSBmcm9tICdAbmVzdGpzL3N3YWdnZXInO1xyXG5pbXBvcnQgeyBQdWJsaWMgfSBmcm9tICcuLi9hdXRoL3B1YmxpYy5kZWNvcmF0b3InO1xyXG4vL2ltcG9ydCB7IERhdGFTb3VyY2UgfSBmcm9tICd0eXBlb3JtJztcclxuXHJcbkBBcGlUYWdzKCdoZWFsdGgnKVxyXG5AQ29udHJvbGxlcignYXBpL2hlYWx0aCcpXHJcbmV4cG9ydCBjbGFzcyBIZWFsdGhDb250cm9sbGVyIHtcclxuICBjb25zdHJ1Y3RvcihcclxuICAgIC8vcHJpdmF0ZSByZWFkb25seSBkYXRhU291cmNlOiBEYXRhU291cmNlXHJcbiAgKSB7fVxyXG5cclxuICBAUHVibGljKClcclxuICBAR2V0KClcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ0hlYWx0aCBjaGVjayBkZWwgc2VydmljaW8nIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiAnU2VydmljaW8gZnVuY2lvbmFuZG8gY29ycmVjdGFtZW50ZScgfSlcclxuICBhc3luYyBnZXRIZWFsdGgoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBjb25zdCBvcmFjbGVTdGF0dXMgPSBhd2FpdCB0aGlzLnRlc3RDb25uZWN0aW9uKCk7XHJcbiAgICAgIC8vIGNvbnN0IGRiSW5mbyA9IGF3YWl0IHRoaXMuZ2V0RGF0YWJhc2VJbmZvKCk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1czogJ29rJyxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAvL2RhdGFiYXNlOiB7XHJcbiAgICAgICAgLy8gIG9yYWNsZToge1xyXG4gICAgICAgIC8vICAgIGNvbm5lY3RlZDogb3JhY2xlU3RhdHVzLFxyXG4gICAgICAgIC8vICAgIGluZm86IGRiSW5mbyxcclxuICAgICAgICAvLyAgfSxcclxuICAgICAgICAvL30sXHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXZlbG9wbWVudCcsXHJcbiAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAvL2RhdGFiYXNlOiB7XHJcbiAgICAgICAgLy8gIG9yYWNsZToge1xyXG4gICAgICAgIC8vICAgIGNvbm5lY3RlZDogZmFsc2UsXHJcbiAgICAgICAgLy8gICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcclxuICAgICAgICAvLyAgfSxcclxuICAgICAgICAvL30sXHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdkZXZlbG9wbWVudCcsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==