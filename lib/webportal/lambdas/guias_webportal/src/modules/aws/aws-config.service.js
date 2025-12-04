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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var AWSConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSConfigService = void 0;
const common_1 = require("@nestjs/common");
const AWS = __importStar(require("aws-sdk"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
/**
 * Servicio base para configuración de AWS
 * Centraliza la configuración común de servicios AWS
 */
let AWSConfigService = AWSConfigService_1 = class AWSConfigService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AWSConfigService_1.name);
        this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        this.config = {
            region: this.configService.get("AWS_REGION") || "us-east-1",
            sqsEndpointUrl: this.configService.get("SQS_ENDPOINT_URL"),
        };
        if (this.isLambda) {
            this.logger.log(`AWS Config inicializado para Lambda - Región: ${this.config.region} - Usando IAM Role`);
        }
        else {
            this.config.accessKeyId =
                this.configService.get("AWS_ACCESS_KEY_ID");
            this.config.secretAccessKey = this.configService.get("AWS_SECRET_ACCESS_KEY");
            this.logger.log(`AWS Config inicializado para desarrollo - Región: ${this.config.region}`);
        }
    }
    /**
     * Obtiene la configuración de AWS
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Crea una instancia de S3 con la configuración
     */
    createS3Client() {
        const s3Config = {
            region: this.config.region,
            endpoint: this.configService.get("S3_ENDPOINT_URL"),
            s3ForcePathStyle: true,
            signatureVersion: "v4",
            httpOptions: {
                timeout: 15000,
            },
        };
        if (!this.isLambda &&
            this.config.accessKeyId &&
            this.config.secretAccessKey) {
            s3Config.accessKeyId = this.config.accessKeyId;
            s3Config.secretAccessKey = this.config.secretAccessKey;
            this.logger.log("Usando credenciales explícitas para S3 (entorno local/desarrollo)");
        }
        else if (this.isLambda) {
            this.logger.log("Usando IAM role para S3 (entorno Lambda)");
        }
        else {
            this.logger.log("Usando credenciales por defecto del entorno (IAM role o credenciales del sistema)");
        }
        return new AWS.S3(s3Config);
    }
    /**
     * Crea una instancia de SQS con la configuración
     */
    createSQSClient() {
        const resolvedEndpoint = this.configService.get("SQS_ENDPOINT_URL");
        const sqsConfig = {
            region: this.config.region,
            timeout: 5000,
            maxRetries: 3,
        };
        if (resolvedEndpoint) {
            sqsConfig.endpoint = resolvedEndpoint;
            this.logger.log(`SQS: usando VPC endpoint privado: ${resolvedEndpoint}`);
        }
        else {
            this.logger.log(`SQS: usando endpoint público de SQS (sqs.${this.config.region}.amazonaws.com)`);
        }
        if (!this.isLambda) {
            if (this.config.accessKeyId && this.config.secretAccessKey) {
                sqsConfig.credentials = {
                    accessKeyId: this.config.accessKeyId,
                    secretAccessKey: this.config.secretAccessKey,
                };
                this.logger.log('SQS: usando credenciales explícitas (local)');
            }
            else {
                this.logger.log('SQS: usando credenciales por defecto del sistema');
            }
        }
        else {
            this.logger.log('SQS: usando IAM Role en Lambda');
        }
        this.logger.log(`SQS Config final - Region: ${sqsConfig.region}, Endpoint: ${sqsConfig.endpoint || 'default'}`);
        return new client_sqs_1.SQSClient(sqsConfig);
    }
    /**
     * Crea una instancia de DynamoDB DocumentClient con la configuración
     */
    createDynamoDBClient() {
        const dynamoConfig = {
            region: this.config.region,
            endpoint: this.configService.get("DYNAMODB_ENDPOINT_URL"),
        };
        if (!this.isLambda &&
            this.config.accessKeyId &&
            this.config.secretAccessKey) {
            dynamoConfig.accessKeyId = this.config.accessKeyId;
            dynamoConfig.secretAccessKey = this.config.secretAccessKey;
            this.logger.log("Usando credenciales explícitas para DynamoDB (entorno local/desarrollo)");
        }
        else if (this.isLambda) {
            this.logger.log("Usando IAM role para DynamoDB (entorno Lambda)");
        }
        else {
            this.logger.log("Usando credenciales por defecto del entorno para DynamoDB");
        }
        return new AWS.DynamoDB.DocumentClient(dynamoConfig);
    }
};
exports.AWSConfigService = AWSConfigService;
exports.AWSConfigService = AWSConfigService = AWSConfigService_1 = __decorate([
    (0, common_1.Injectable)()
], AWSConfigService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNvbmZpZy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLWNvbmZpZy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsNkNBQStCO0FBQy9CLG9EQUFnRDtBQVNoRDs7O0dBR0c7QUFFSSxJQUFNLGdCQUFnQix3QkFBdEIsTUFBTSxnQkFBZ0I7SUFLM0IsWUFBNkIsYUFBNEI7UUFBNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFKeEMsV0FBTSxHQUFHLElBQUksZUFBTSxDQUFDLGtCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBSzFELElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUM7UUFFdkQsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNaLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBUyxZQUFZLENBQUMsSUFBSSxXQUFXO1lBQ25FLGNBQWMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBUyxrQkFBa0IsQ0FBQztTQUNuRSxDQUFDO1FBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQ2IsaURBQWlELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxvQkFBb0IsQ0FDeEYsQ0FBQztRQUNKLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUNyQixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBUyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNsRCx1QkFBdUIsQ0FDeEIsQ0FBQztZQUNGLElBQUks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QixJQUFBLG1CQUFVLEdBQUU7R0FDQSxnQkFBZ0IsQ0EwSTVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTG9nZ2VyIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSBcIkBuZXN0anMvY29uZmlnXCI7XG5pbXBvcnQgKiBhcyBBV1MgZnJvbSBcImF3cy1zZGtcIjtcbmltcG9ydCB7IFNRU0NsaWVudCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc3FzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQVdTQ29uZmlnIHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGFjY2Vzc0tleUlkPzogc3RyaW5nO1xuICBzZWNyZXRBY2Nlc3NLZXk/OiBzdHJpbmc7XG4gIHNxc0VuZHBvaW50VXJsPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFNlcnZpY2lvIGJhc2UgcGFyYSBjb25maWd1cmFjacOzbiBkZSBBV1NcbiAqIENlbnRyYWxpemEgbGEgY29uZmlndXJhY2nDs24gY29tw7puIGRlIHNlcnZpY2lvcyBBV1NcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEFXU0NvbmZpZ1NlcnZpY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlciA9IG5ldyBMb2dnZXIoQVdTQ29uZmlnU2VydmljZS5uYW1lKTtcbiAgcHJpdmF0ZSByZWFkb25seSBjb25maWc6IEFXU0NvbmZpZztcbiAgcHJpdmF0ZSByZWFkb25seSBpc0xhbWJkYTogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UpIHtcbiAgICB0aGlzLmlzTGFtYmRhID0gISFwcm9jZXNzLmVudi5BV1NfTEFNQkRBX0ZVTkNUSU9OX05BTUU7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIHJlZ2lvbjogdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KFwiQVdTX1JFR0lPTlwiKSB8fCBcInVzLWVhc3QtMVwiLFxuICAgICAgc3FzRW5kcG9pbnRVcmw6IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPihcIlNRU19FTkRQT0lOVF9VUkxcIiksXG4gICAgfTtcblxuICAgIGlmICh0aGlzLmlzTGFtYmRhKSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coXG4gICAgICAgIGBBV1MgQ29uZmlnIGluaWNpYWxpemFkbyBwYXJhIExhbWJkYSAtIFJlZ2nDs246ICR7dGhpcy5jb25maWcucmVnaW9ufSAtIFVzYW5kbyBJQU0gUm9sZWBcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29uZmlnLmFjY2Vzc0tleUlkID1cbiAgICAgICAgdGhpcy5jb25maWdTZXJ2aWNlLmdldDxzdHJpbmc+KFwiQVdTX0FDQ0VTU19LRVlfSURcIik7XG4gICAgICB0aGlzLmNvbmZpZy5zZWNyZXRBY2Nlc3NLZXkgPSB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oXG4gICAgICAgIFwiQVdTX1NFQ1JFVF9BQ0NFU1NfS0VZXCJcbiAgICAgICk7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coXG4gICAgICAgIGBBV1MgQ29uZmlnIGluaWNpYWxpemFkbyBwYXJhIGRlc2Fycm9sbG8gLSBSZWdpw7NuOiAke3RoaXMuY29uZmlnLnJlZ2lvbn1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRpZW5lIGxhIGNvbmZpZ3VyYWNpw7NuIGRlIEFXU1xuICAgKi9cbiAgZ2V0Q29uZmlnKCk6IEFXU0NvbmZpZyB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5jb25maWcgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhIHVuYSBpbnN0YW5jaWEgZGUgUzMgY29uIGxhIGNvbmZpZ3VyYWNpw7NuXG4gICAqL1xuICBjcmVhdGVTM0NsaWVudCgpOiBBV1MuUzMge1xuICAgIGNvbnN0IHMzQ29uZmlnOiBBV1MuUzMuQ2xpZW50Q29uZmlndXJhdGlvbiA9IHtcbiAgICAgIHJlZ2lvbjogdGhpcy5jb25maWcucmVnaW9uLFxuICAgICAgZW5kcG9pbnQ6IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPihcIlMzX0VORFBPSU5UX1VSTFwiKSxcbiAgICAgIHMzRm9yY2VQYXRoU3R5bGU6IHRydWUsXG4gICAgICBzaWduYXR1cmVWZXJzaW9uOiBcInY0XCIsXG4gICAgICBodHRwT3B0aW9uczoge1xuICAgICAgICB0aW1lb3V0OiAxNTAwMCxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGlmIChcbiAgICAgICF0aGlzLmlzTGFtYmRhICYmXG4gICAgICB0aGlzLmNvbmZpZy5hY2Nlc3NLZXlJZCAmJlxuICAgICAgdGhpcy5jb25maWcuc2VjcmV0QWNjZXNzS2V5XG4gICAgKSB7XG4gICAgICBzM0NvbmZpZy5hY2Nlc3NLZXlJZCA9IHRoaXMuY29uZmlnLmFjY2Vzc0tleUlkO1xuICAgICAgczNDb25maWcuc2VjcmV0QWNjZXNzS2V5ID0gdGhpcy5jb25maWcuc2VjcmV0QWNjZXNzS2V5O1xuICAgICAgdGhpcy5sb2dnZXIubG9nKFxuICAgICAgICBcIlVzYW5kbyBjcmVkZW5jaWFsZXMgZXhwbMOtY2l0YXMgcGFyYSBTMyAoZW50b3JubyBsb2NhbC9kZXNhcnJvbGxvKVwiXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5pc0xhbWJkYSkge1xuICAgICAgdGhpcy5sb2dnZXIubG9nKFwiVXNhbmRvIElBTSByb2xlIHBhcmEgUzMgKGVudG9ybm8gTGFtYmRhKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sb2dnZXIubG9nKFxuICAgICAgICBcIlVzYW5kbyBjcmVkZW5jaWFsZXMgcG9yIGRlZmVjdG8gZGVsIGVudG9ybm8gKElBTSByb2xlIG8gY3JlZGVuY2lhbGVzIGRlbCBzaXN0ZW1hKVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQVdTLlMzKHMzQ29uZmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhIHVuYSBpbnN0YW5jaWEgZGUgU1FTIGNvbiBsYSBjb25maWd1cmFjacOzblxuICAgKi9cbiAgY3JlYXRlU1FTQ2xpZW50KCk6IFNRU0NsaWVudCB7XG4gICAgY29uc3QgcmVzb2x2ZWRFbmRwb2ludCA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPihcIlNRU19FTkRQT0lOVF9VUkxcIik7XG5cbiAgICBjb25zdCBzcXNDb25maWc6IGFueSA9IHtcbiAgICAgIHJlZ2lvbjogdGhpcy5jb25maWcucmVnaW9uLFxuICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgIG1heFJldHJpZXM6IDMsXG4gICAgfTtcblxuICAgIGlmIChyZXNvbHZlZEVuZHBvaW50KSB7XG4gICAgICBzcXNDb25maWcuZW5kcG9pbnQgPSByZXNvbHZlZEVuZHBvaW50O1xuICAgICAgdGhpcy5sb2dnZXIubG9nKGBTUVM6IHVzYW5kbyBWUEMgZW5kcG9pbnQgcHJpdmFkbzogJHtyZXNvbHZlZEVuZHBvaW50fWApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coYFNRUzogdXNhbmRvIGVuZHBvaW50IHDDumJsaWNvIGRlIFNRUyAoc3FzLiR7dGhpcy5jb25maWcucmVnaW9ufS5hbWF6b25hd3MuY29tKWApO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5pc0xhbWJkYSkge1xuICAgICAgaWYgKHRoaXMuY29uZmlnLmFjY2Vzc0tleUlkICYmIHRoaXMuY29uZmlnLnNlY3JldEFjY2Vzc0tleSkge1xuICAgICAgICBzcXNDb25maWcuY3JlZGVudGlhbHMgPSB7XG4gICAgICAgICAgYWNjZXNzS2V5SWQ6IHRoaXMuY29uZmlnLmFjY2Vzc0tleUlkLFxuICAgICAgICAgIHNlY3JldEFjY2Vzc0tleTogdGhpcy5jb25maWcuc2VjcmV0QWNjZXNzS2V5LFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2coJ1NRUzogdXNhbmRvIGNyZWRlbmNpYWxlcyBleHBsw61jaXRhcyAobG9jYWwpJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci5sb2coJ1NRUzogdXNhbmRvIGNyZWRlbmNpYWxlcyBwb3IgZGVmZWN0byBkZWwgc2lzdGVtYScpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coJ1NRUzogdXNhbmRvIElBTSBSb2xlIGVuIExhbWJkYScpO1xuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmxvZyhgU1FTIENvbmZpZyBmaW5hbCAtIFJlZ2lvbjogJHtzcXNDb25maWcucmVnaW9ufSwgRW5kcG9pbnQ6ICR7c3FzQ29uZmlnLmVuZHBvaW50IHx8ICdkZWZhdWx0J31gKTtcbiAgICBcbiAgICByZXR1cm4gbmV3IFNRU0NsaWVudChzcXNDb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWEgdW5hIGluc3RhbmNpYSBkZSBEeW5hbW9EQiBEb2N1bWVudENsaWVudCBjb24gbGEgY29uZmlndXJhY2nDs25cbiAgICovXG4gIGNyZWF0ZUR5bmFtb0RCQ2xpZW50KCk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudCB7XG4gICAgY29uc3QgZHluYW1vQ29uZmlnOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuRG9jdW1lbnRDbGllbnRPcHRpb25zICYgQVdTLkR5bmFtb0RCLlR5cGVzLkNsaWVudENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICByZWdpb246IHRoaXMuY29uZmlnLnJlZ2lvbixcbiAgICAgIGVuZHBvaW50OiB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oXCJEWU5BTU9EQl9FTkRQT0lOVF9VUkxcIiksXG4gICAgfTtcblxuICAgIGlmIChcbiAgICAgICF0aGlzLmlzTGFtYmRhICYmXG4gICAgICB0aGlzLmNvbmZpZy5hY2Nlc3NLZXlJZCAmJlxuICAgICAgdGhpcy5jb25maWcuc2VjcmV0QWNjZXNzS2V5XG4gICAgKSB7XG4gICAgICBkeW5hbW9Db25maWcuYWNjZXNzS2V5SWQgPSB0aGlzLmNvbmZpZy5hY2Nlc3NLZXlJZDtcbiAgICAgIGR5bmFtb0NvbmZpZy5zZWNyZXRBY2Nlc3NLZXkgPSB0aGlzLmNvbmZpZy5zZWNyZXRBY2Nlc3NLZXk7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coXG4gICAgICAgIFwiVXNhbmRvIGNyZWRlbmNpYWxlcyBleHBsw61jaXRhcyBwYXJhIER5bmFtb0RCIChlbnRvcm5vIGxvY2FsL2Rlc2Fycm9sbG8pXCJcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmlzTGFtYmRhKSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coXCJVc2FuZG8gSUFNIHJvbGUgcGFyYSBEeW5hbW9EQiAoZW50b3JubyBMYW1iZGEpXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5sb2coXG4gICAgICAgIFwiVXNhbmRvIGNyZWRlbmNpYWxlcyBwb3IgZGVmZWN0byBkZWwgZW50b3JubyBwYXJhIER5bmFtb0RCXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQoZHluYW1vQ29uZmlnKTtcbiAgfVxufVxuIl19