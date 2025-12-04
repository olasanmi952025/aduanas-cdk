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
let HealthController = class HealthController {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getHealth() {
        try {
            const oracleStatus = await this.testConnection();
            const dbInfo = await this.getDatabaseInfo();
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: {
                    oracle: {
                        connected: oracleStatus,
                        info: dbInfo,
                    },
                },
                environment: process.env.NODE_ENV || 'development',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                database: {
                    oracle: {
                        connected: false,
                        error: errorMessage,
                    },
                },
                environment: process.env.NODE_ENV || 'development',
            };
        }
    }
    async getDatabaseHealth() {
        try {
            const isConnected = await this.testConnection();
            const dbInfo = await this.getDatabaseInfo();
            return {
                connected: isConnected,
                database: dbInfo,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                connected: false,
                error: errorMessage,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async testConnection() {
        try {
            const result = await this.dataSource.query('SELECT 1 as test FROM DUAL');
            return result && result.length > 0;
        }
        catch (error) {
            console.error('Error al probar conexión:', error);
            return false;
        }
    }
    async getDatabaseInfo() {
        try {
            const result = await this.dataSource.query(`
        SELECT 
          SYS_CONTEXT('USERENV', 'DB_NAME') as database_name,
          SYS_CONTEXT('USERENV', 'SERVER_HOST') as server_host,
          SYS_CONTEXT('USERENV', 'SESSION_USER') as session_user,
          SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') as current_schema
        FROM DUAL
      `);
            return result?.[0] || null;
        }
        catch (error) {
            console.error('Error al obtener información de la base de datos:', error);
            return null;
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
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('database'),
    (0, swagger_1.ApiOperation)({ summary: 'Estado de la conexión a Oracle' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Información de la base de datos' })
], HealthController.prototype, "getDatabaseHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('api/health')
], HealthController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhbHRoLmNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJoZWFsdGguY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBaUQ7QUFDakQsNkNBQXFFO0FBQ3JFLCtEQUFrRDtBQUszQyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtJQUMzQixZQUE2QixVQUFzQjtRQUF0QixlQUFVLEdBQVYsVUFBVSxDQUFZO0lBQUcsQ0FBQztJQU1qRCxBQUFOLEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSxDQUFDO1lBQ0gsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFNUMsT0FBTztnQkFDTCxNQUFNLEVBQUUsSUFBSTtnQkFDWixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ25DLFFBQVEsRUFBRTtvQkFDUixNQUFNLEVBQUU7d0JBQ04sU0FBUyxFQUFFLFlBQVk7d0JBQ3ZCLElBQUksRUFBRSxNQUFNO3FCQUNiO2lCQUNGO2dCQUNELFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxhQUFhO2FBQ25ELENBQUM7UUFDSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sWUFBWSxHQUFHLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RSxPQUFPO2dCQUNMLE1BQU0sRUFBRSxPQUFPO2dCQUNmLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtnQkFDbkMsUUFBUSxFQUFFO29CQUNSLE1BQU0sRUFBRTt3QkFDTixTQUFTLEVBQUUsS0FBSzt3QkFDaEIsS0FBSyxFQUFFLFlBQVk7cUJBQ3BCO2lCQUNGO2dCQUNELFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxhQUFhO2FBQ25ELENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQU1LLEFBQU4sS0FBSyxDQUFDLGlCQUFpQjtRQUNyQixJQUFJLENBQUM7WUFDSCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUU1QyxPQUFPO2dCQUNMLFNBQVMsRUFBRSxXQUFXO2dCQUN0QixRQUFRLEVBQUUsTUFBTTtnQkFDaEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQ3BDLENBQUM7UUFDSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sWUFBWSxHQUFHLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RSxPQUFPO2dCQUNMLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixLQUFLLEVBQUUsWUFBWTtnQkFDbkIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQ3BDLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxjQUFjO1FBQzFCLElBQUksQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUN6RSxPQUFPLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUVPLEtBQUssQ0FBQyxlQUFlO1FBQzNCLElBQUksQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Ozs7Ozs7T0FPMUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDN0IsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFFLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7Q0FDRixDQUFBO0FBekZZLDRDQUFnQjtBQU9yQjtJQUpMLElBQUEseUJBQU0sR0FBRTtJQUNSLElBQUEsWUFBRyxHQUFFO0lBQ0wsSUFBQSxzQkFBWSxFQUFDLEVBQUUsT0FBTyxFQUFFLDJCQUEyQixFQUFFLENBQUM7SUFDdEQsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQztpREErQi9FO0FBTUs7SUFKTCxJQUFBLHlCQUFNLEdBQUU7SUFDUixJQUFBLFlBQUcsRUFBQyxVQUFVLENBQUM7SUFDZixJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQztJQUMzRCxJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxpQ0FBaUMsRUFBRSxDQUFDO3lEQW1CNUU7MkJBN0RVLGdCQUFnQjtJQUY1QixJQUFBLGlCQUFPLEVBQUMsUUFBUSxDQUFDO0lBQ2pCLElBQUEsbUJBQVUsRUFBQyxZQUFZLENBQUM7R0FDWixnQkFBZ0IsQ0F5RjVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udHJvbGxlciwgR2V0IH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xuaW1wb3J0IHsgQXBpVGFncywgQXBpT3BlcmF0aW9uLCBBcGlSZXNwb25zZSB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQgeyBQdWJsaWMgfSBmcm9tICcuLi9hdXRoL3B1YmxpYy5kZWNvcmF0b3InO1xuaW1wb3J0IHsgRGF0YVNvdXJjZSB9IGZyb20gJ3R5cGVvcm0nO1xuXG5AQXBpVGFncygnaGVhbHRoJylcbkBDb250cm9sbGVyKCdhcGkvaGVhbHRoJylcbmV4cG9ydCBjbGFzcyBIZWFsdGhDb250cm9sbGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkYXRhU291cmNlOiBEYXRhU291cmNlKSB7fVxuXG4gIEBQdWJsaWMoKVxuICBAR2V0KClcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6ICdIZWFsdGggY2hlY2sgZGVsIHNlcnZpY2lvJyB9KVxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdTZXJ2aWNpbyBmdW5jaW9uYW5kbyBjb3JyZWN0YW1lbnRlJyB9KVxuICBhc3luYyBnZXRIZWFsdGgoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG9yYWNsZVN0YXR1cyA9IGF3YWl0IHRoaXMudGVzdENvbm5lY3Rpb24oKTtcbiAgICAgIGNvbnN0IGRiSW5mbyA9IGF3YWl0IHRoaXMuZ2V0RGF0YWJhc2VJbmZvKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogJ29rJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgICAgb3JhY2xlOiB7XG4gICAgICAgICAgICBjb25uZWN0ZWQ6IG9yYWNsZVN0YXR1cyxcbiAgICAgICAgICAgIGluZm86IGRiSW5mbyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgICAgb3JhY2xlOiB7XG4gICAgICAgICAgICBjb25uZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50JyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgQFB1YmxpYygpXG4gIEBHZXQoJ2RhdGFiYXNlJylcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6ICdFc3RhZG8gZGUgbGEgY29uZXhpw7NuIGEgT3JhY2xlJyB9KVxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdJbmZvcm1hY2nDs24gZGUgbGEgYmFzZSBkZSBkYXRvcycgfSlcbiAgYXN5bmMgZ2V0RGF0YWJhc2VIZWFsdGgoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGlzQ29ubmVjdGVkID0gYXdhaXQgdGhpcy50ZXN0Q29ubmVjdGlvbigpO1xuICAgICAgY29uc3QgZGJJbmZvID0gYXdhaXQgdGhpcy5nZXREYXRhYmFzZUluZm8oKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29ubmVjdGVkOiBpc0Nvbm5lY3RlZCxcbiAgICAgICAgZGF0YWJhc2U6IGRiSW5mbyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25uZWN0ZWQ6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3JNZXNzYWdlLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB0ZXN0Q29ubmVjdGlvbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KCdTRUxFQ1QgMSBhcyB0ZXN0IEZST00gRFVBTCcpO1xuICAgICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID4gMDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYWwgcHJvYmFyIGNvbmV4acOzbjonLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXREYXRhYmFzZUluZm8oKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYXRhU291cmNlLnF1ZXJ5KGBcbiAgICAgICAgU0VMRUNUIFxuICAgICAgICAgIFNZU19DT05URVhUKCdVU0VSRU5WJywgJ0RCX05BTUUnKSBhcyBkYXRhYmFzZV9uYW1lLFxuICAgICAgICAgIFNZU19DT05URVhUKCdVU0VSRU5WJywgJ1NFUlZFUl9IT1NUJykgYXMgc2VydmVyX2hvc3QsXG4gICAgICAgICAgU1lTX0NPTlRFWFQoJ1VTRVJFTlYnLCAnU0VTU0lPTl9VU0VSJykgYXMgc2Vzc2lvbl91c2VyLFxuICAgICAgICAgIFNZU19DT05URVhUKCdVU0VSRU5WJywgJ0NVUlJFTlRfU0NIRU1BJykgYXMgY3VycmVudF9zY2hlbWFcbiAgICAgICAgRlJPTSBEVUFMXG4gICAgICBgKTtcbiAgICAgIHJldHVybiByZXN1bHQ/LlswXSB8fCBudWxsO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBhbCBvYnRlbmVyIGluZm9ybWFjacOzbiBkZSBsYSBiYXNlIGRlIGRhdG9zOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuIl19