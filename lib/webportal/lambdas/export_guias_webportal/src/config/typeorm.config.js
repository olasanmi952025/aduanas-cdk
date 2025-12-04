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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZW9ybS5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0eXBlb3JtLmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFBcUM7QUFDckMsMkNBQXdDO0FBSXhDLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxhQUE0QixFQUF3QixFQUFFO0lBQ3JGLE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsdUJBQXVCLENBQUMsQ0FBQztJQUN4RSxJQUFJLFlBQVksRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQztZQUNILFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDeEIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixRQUFRLEVBQUUsU0FBUzthQUNwQixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixNQUFNLFlBQVksR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLElBQUksQ0FBQywwREFBMEQsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN4RixDQUFDO0lBQ0gsQ0FBQztTQUFNLENBQUM7UUFDTixNQUFNLENBQUMsSUFBSSxDQUFDLGdHQUFnRyxDQUFDLENBQUM7SUFDaEgsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzVELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQzlELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDcEUsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBUyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwRSxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFTLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQztJQUMvRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFTLGlCQUFpQixDQUFDLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBUyxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUM7SUFFakgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFbEMsT0FBTztRQUNMLElBQUksRUFBRSxRQUFRO1FBQ2QsSUFBSTtRQUNKLElBQUk7UUFDSixRQUFRO1FBQ1IsUUFBUTtRQUNSLFdBQVcsRUFBRSxHQUFHO1FBQ2hCLFFBQVE7UUFDUixRQUFRLEVBQUUsQ0FBQyxTQUFTLEdBQUcsMkNBQTJDLENBQUM7UUFDbkUsV0FBVyxFQUFFLEtBQUssRUFBRSxrREFBa0Q7UUFDdEUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQVMsVUFBVSxDQUFDLEtBQUssYUFBYTtRQUNoRSxhQUFhLEVBQUUsQ0FBQztRQUNoQixVQUFVLEVBQUUsSUFBSTtRQUNoQiwwQ0FBMEM7UUFDMUMsS0FBSyxFQUFFO1lBQ0wsc0NBQXNDO1lBQ3RDLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLE1BQU0sRUFBRSxLQUFLO1NBQ2Q7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBckRXLFFBQUEsZ0JBQWdCLG9CQXFEM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBvcmFjbGVkYiBmcm9tICdvcmFjbGVkYic7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xuaW1wb3J0IHsgVHlwZU9ybU1vZHVsZU9wdGlvbnMgfSBmcm9tICdAbmVzdGpzL3R5cGVvcm0nO1xuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdUeXBlT3JtQ29uZmlnJyk7XG5cbmV4cG9ydCBjb25zdCBnZXRUeXBlT3JtQ29uZmlnID0gKGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UpOiBUeXBlT3JtTW9kdWxlT3B0aW9ucyA9PiB7XG4gIGNvbnN0IGNsaWVudExpYkRpciA9IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ09SQUNMRV9DTElFTlRfTElCX0RJUicpO1xuICBpZiAoY2xpZW50TGliRGlyKSB7XG4gICAgdHJ5IHtcbiAgICAgIG9yYWNsZWRiLmluaXRPcmFjbGVDbGllbnQoeyBcbiAgICAgICAgbGliRGlyOiBjbGllbnRMaWJEaXIsXG4gICAgICAgIGNvbmZpZ0RpcjogdW5kZWZpbmVkLFxuICAgICAgICBlcnJvclVybDogdW5kZWZpbmVkXG4gICAgICB9KTtcbiAgICAgIGxvZ2dlci5sb2coJ09yYWNsZSBDbGllbnQgaW5pY2lhbGl6YWRvIGVuIG1vZG8gVGhpY2sgcGFyYSBUeXBlT1JNJyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGxvZ2dlci53YXJuKCdPcmFjbGUgQ2xpZW50IHlhIGluaWNpYWxpemFkbyBvIGVycm9yIGVuIGluaWNpYWxpemFjacOzbjonLCBlcnJvck1lc3NhZ2UpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsb2dnZXIud2FybignT1JBQ0xFX0NMSUVOVF9MSUJfRElSIG5vIGNvbmZpZ3VyYWRvLiBVc2FuZG8gbW9kbyBUaGluIChwdWVkZSBubyBzZXIgY29tcGF0aWJsZSBjb24gT3JhY2xlIDExKScpO1xuICB9XG5cbiAgY29uc3QgaG9zdCA9IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ09SQUNMRV9IT1NUJykgfHwgJyc7XG4gIGNvbnN0IHBvcnQgPSBjb25maWdTZXJ2aWNlLmdldDxudW1iZXI+KCdPUkFDTEVfUE9SVCcpIHx8IDE1MjI7XG4gIGNvbnN0IHVzZXJuYW1lID0gY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignT1JBQ0xFX1VTRVJOQU1FJykgfHwgJyc7XG4gIGNvbnN0IHBhc3N3b3JkID0gY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignT1JBQ0xFX1BBU1NXT1JEJykgfHwgJyc7XG4gIGNvbnN0IHNpZCA9IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ09SQUNMRV9TSUQnKSB8fCAnYXJpZXMnO1xuICBjb25zdCBkYXRhYmFzZSA9IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ09SQUNMRV9EQVRBQkFTRScpIHx8IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ0RCX0RBVEFCQVNFJykgfHwgc2lkO1xuXG4gIGNvbnNvbGUubG9nKCdob3N0JywgaG9zdCk7XG4gIGNvbnNvbGUubG9nKCdwb3J0JywgcG9ydCk7XG4gIGNvbnNvbGUubG9nKCd1c2VybmFtZScsIHVzZXJuYW1lKTtcbiAgY29uc29sZS5sb2coJ3Bhc3N3b3JkJywgcGFzc3dvcmQpO1xuICBjb25zb2xlLmxvZygnc2lkJywgc2lkKTtcbiAgY29uc29sZS5sb2coJ2RhdGFiYXNlJywgZGF0YWJhc2UpO1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ29yYWNsZScsXG4gICAgaG9zdCxcbiAgICBwb3J0LFxuICAgIHVzZXJuYW1lLFxuICAgIHBhc3N3b3JkLFxuICAgIHNlcnZpY2VOYW1lOiBzaWQsXG4gICAgZGF0YWJhc2UsXG4gICAgZW50aXRpZXM6IFtfX2Rpcm5hbWUgKyAnLy4uL21vZHVsZXMvKiovZW50aXRpZXMvKi5lbnRpdHl7LnRzLC5qc30nXSxcbiAgICBzeW5jaHJvbml6ZTogZmFsc2UsIC8vIE51bmNhIHVzYXIgc3luY2hyb25pemUgZW4gcHJvZHVjY2nDs24gY29uIE9yYWNsZVxuICAgIGxvZ2dpbmc6IGNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ05PREVfRU5WJykgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgcmV0cnlBdHRlbXB0czogMyxcbiAgICByZXRyeURlbGF5OiAzMDAwLFxuICAgIC8vIENvbmZpZ3VyYWNpb25lcyBlc3BlY8OtZmljYXMgcGFyYSBPcmFjbGVcbiAgICBleHRyYToge1xuICAgICAgLy8gQ29uZmlndXJhY2nDs24gYWRpY2lvbmFsIHBhcmEgT3JhY2xlXG4gICAgICBjb25uZWN0VGltZW91dDogNjAwMDAsXG4gICAgICByZXF1ZXN0VGltZW91dDogNjAwMDAsXG4gICAgICB1c2VVVEM6IGZhbHNlLFxuICAgIH0sXG4gIH07XG59O1xuIl19