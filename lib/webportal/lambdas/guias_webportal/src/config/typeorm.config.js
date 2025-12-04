"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = void 0;
const oracledb = __importStar(require("oracledb"));
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('TypeOrmConfig');
const getTypeOrmConfig = (configService) => {
    const clientLibDir = configService.get('ORACLE_CLIENT_LIB_DIR');
    if (clientLibDir) {
        try {
            oracledb.initOracleClient({
                libDir: clientLibDir,
                configDir: undefined,
                errorUrl: undefined
            });
            logger.log('Oracle Client inicializado en modo Thick para TypeORM');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn('Oracle Client ya inicializado o error en inicialización:', errorMessage);
        }
    }
    else {
        logger.warn('ORACLE_CLIENT_LIB_DIR no configurado. Usando modo Thin (puede no ser compatible con Oracle 11)');
    }
    const host = configService.get('ORACLE_HOST') || '';
    const port = configService.get('ORACLE_PORT') || 1522;
    const username = configService.get('ORACLE_USERNAME') || '';
    const password = configService.get('ORACLE_PASSWORD') || '';
    const sid = configService.get('ORACLE_SID') || 'aries';
    const database = configService.get('ORACLE_DATABASE') || configService.get('DB_DATABASE') || sid;
    console.log('host', host);
    console.log('port', port);
    console.log('username', username);
    console.log('password', password);
    console.log('sid', sid);
    console.log('database', database);
    return {
        type: 'oracle',
        host,
        port,
        username,
        password,
        serviceName: sid,
        database,
        entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
        synchronize: false, // Nunca usar synchronize en producción con Oracle
        logging: configService.get('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
        // Configuraciones específicas para Oracle
        extra: {
            // Configuración adicional para Oracle
            connectTimeout: 60000,
            requestTimeout: 60000,
            useUTC: false,
        },
    };
};
exports.getTypeOrmConfig = getTypeOrmConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZW9ybS5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0eXBlb3JtLmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFBcUM7QUFDckMsMkNBQXdDO0FBSXhDLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxhQUE0QixFQUF3QixFQUFFO0lBQ3JGLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsdUJBQXVCLENBQUMsQ0FBQztJQUN4RSxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQztZQUNILFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDeEIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixRQUFRLEVBQUUsU0FBUzthQUNwQixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixNQUFNLFlBQVksR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLElBQUksQ0FBQywwREFBMEQsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN4RixDQUFDO0lBQ0gsQ0FBQztTQUFNLENBQUM7UUFDTixNQUFNLENBQUMsSUFBSSxDQUFDLGdHQUFnRyxDQUFDLENBQUM7SUFDaEgsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQzlELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDcEUsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBUyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwRSxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFTLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQztJQUMvRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFTLGlCQUFpQixDQUFDLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBUyxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUM7SUFFakgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFbEMsT0FBTztRQUNMLElBQUksRUFBRSxRQUFRO1FBQ2QsSUFBSTtRQUNKLElBQUk7UUFDSixRQUFRO1FBQ1IsUUFBUTtRQUNSLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLFFBQVE7UUFDUixRQUFRLEVBQUUsQ0FBQyxTQUFTLEdBQUcsMkNBQTJDLENBQUM7UUFDbkUsV0FBVyxFQUFFLEtBQUssRUFBRSxrREFBa0Q7UUFDdEUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQVMsVUFBVSxDQUFDLEtBQUssYUFBYTtRQUNoRSxhQUFhLEVBQUUsQ0FBQztRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQiwwQ0FBMEM7UUFDMUMsS0FBSyxFQUFFO1lBQ0wsc0NBQXNDO1lBQ3RDLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLE1BQU0sRUFBRSxLQUFLO1NBQ2Q7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBckRXLFFBQUEsZ0JBQWdCLG9CQXFEM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBvcmFjbGVkYiBmcm9tICdvcmFjbGVkYic7XHJcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ29uZmlnU2VydmljZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgVHlwZU9ybU1vZHVsZU9wdGlvbnMgfSBmcm9tICdAbmVzdGpzL3R5cGVvcm0nO1xyXG5cclxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignVHlwZU9ybUNvbmZpZycpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGdldFR5cGVPcm1Db25maWcgPSAoY29uZmlnU2VydmljZTogQ29uZmlnU2VydmljZSk6IFR5cGVPcm1Nb2R1bGVPcHRpb25zID0+IHtcclxuICBjb25zdCBjbGllbnRMaWJEaXIgPSBjb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdPUkFDTEVfQ0xJRU5UX0xJQl9ESVInKTtcclxuICBpZiAoY2xpZW50TGliRGlyKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBvcmFjbGVkYi5pbml0T3JhY2xlQ2xpZW50KHsgXHJcbiAgICAgICAgbGliRGlyOiBjbGllbnRMaWJEaXIsXHJcbiAgICAgICAgY29uZmlnRGlyOiB1bmRlZmluZWQsXHJcbiAgICAgICAgZXJyb3JVcmw6IHVuZGVmaW5lZFxyXG4gICAgICB9KTtcclxuICAgICAgbG9nZ2VyLmxvZygnT3JhY2xlIENsaWVudCBpbmljaWFsaXphZG8gZW4gbW9kbyBUaGljayBwYXJhIFR5cGVPUk0nKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcclxuICAgICAgbG9nZ2VyLndhcm4oJ09yYWNsZSBDbGllbnQgeWEgaW5pY2lhbGl6YWRvIG8gZXJyb3IgZW4gaW5pY2lhbGl6YWNpw7NuOicsIGVycm9yTWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGxvZ2dlci53YXJuKCdPUkFDTEVfQ0xJRU5UX0xJQl9ESVIgbm8gY29uZmlndXJhZG8uIFVzYW5kbyBtb2RvIFRoaW4gKHB1ZWRlIG5vIHNlciBjb21wYXRpYmxlIGNvbiBPcmFjbGUgMTEpJyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBob3N0ID0gY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignT1JBQ0xFX0hPU1QnKSB8fCAnJztcclxuICBjb25zdCBwb3J0ID0gY29uZmlnU2VydmljZS5nZXQ8bnVtYmVyPignT1JBQ0xFX1BPUlQnKSB8fCAxNTIyO1xyXG4gIGNvbnN0IHVzZXJuYW1lID0gY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignT1JBQ0xFX1VTRVJOQU1FJykgfHwgJyc7XHJcbiAgY29uc3QgcGFzc3dvcmQgPSBjb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdPUkFDTEVfUEFTU1dPUkQnKSB8fCAnJztcclxuICBjb25zdCBzaWQgPSBjb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KCdPUkFDTEVfU0lEJykgfHwgJ2FyaWVzJztcclxuICBjb25zdCBkYXRhYmFzZSA9IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ09SQUNMRV9EQVRBQkFTRScpIHx8IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ0RCX0RBVEFCQVNFJykgfHwgc2lkO1xyXG5cclxuICBjb25zb2xlLmxvZygnaG9zdCcsIGhvc3QpO1xyXG4gIGNvbnNvbGUubG9nKCdwb3J0JywgcG9ydCk7XHJcbiAgY29uc29sZS5sb2coJ3VzZXJuYW1lJywgdXNlcm5hbWUpO1xyXG4gIGNvbnNvbGUubG9nKCdwYXNzd29yZCcsIHBhc3N3b3JkKTtcclxuICBjb25zb2xlLmxvZygnc2lkJywgc2lkKTtcclxuICBjb25zb2xlLmxvZygnZGF0YWJhc2UnLCBkYXRhYmFzZSk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB0eXBlOiAnb3JhY2xlJyxcclxuICAgIGhvc3QsXHJcbiAgICBwb3J0LFxyXG4gICAgdXNlcm5hbWUsXHJcbiAgICBwYXNzd29yZCxcclxuICAgIHNlcnZpY2VOYW1lOiBzaWQsXHJcbiAgICBkYXRhYmFzZSxcclxuICAgIGVudGl0aWVzOiBbX19kaXJuYW1lICsgJy8uLi9tb2R1bGVzLyoqL2VudGl0aWVzLyouZW50aXR5ey50cywuanN9J10sXHJcbiAgICBzeW5jaHJvbml6ZTogZmFsc2UsIC8vIE51bmNhIHVzYXIgc3luY2hyb25pemUgZW4gcHJvZHVjY2nDs24gY29uIE9yYWNsZVxyXG4gICAgbG9nZ2luZzogY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignTk9ERV9FTlYnKSA9PT0gJ2RldmVsb3BtZW50JyxcclxuICAgIHJldHJ5QXR0ZW1wdHM6IDMsXHJcbiAgICByZXRyeURlbGF5OiAzMDAwLFxyXG4gICAgLy8gQ29uZmlndXJhY2lvbmVzIGVzcGVjw61maWNhcyBwYXJhIE9yYWNsZVxyXG4gICAgZXh0cmE6IHtcclxuICAgICAgLy8gQ29uZmlndXJhY2nDs24gYWRpY2lvbmFsIHBhcmEgT3JhY2xlXHJcbiAgICAgIGNvbm5lY3RUaW1lb3V0OiA2MDAwMCxcclxuICAgICAgcmVxdWVzdFRpbWVvdXQ6IDYwMDAwLFxyXG4gICAgICB1c2VVVEM6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9O1xyXG59O1xyXG4iXX0=