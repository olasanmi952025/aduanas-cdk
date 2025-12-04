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
const client_s3_1 = require("@aws-sdk/client-s3");
let AWSConfigService = AWSConfigService_1 = class AWSConfigService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AWSConfigService_1.name);
        this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        this.config = {
            region: this.configService.get('AWS_REGION') || 'us-east-1',
        };
        this.logger.log(`AWS Config initialized for region: ${this.config.region}`);
    }
    getConfig() {
        return { ...this.config };
    }
    createS3Client() {
        const config = {
            region: this.config.region,
        };
        return new client_s3_1.S3Client(config);
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
        this.logger.log(`SQS Config final - Region: ${sqsConfig.region}, Endpoint: ${sqsConfig.endpoint || 'default'}`);
        return new client_sqs_1.SQSClient(sqsConfig);
    }
    createDynamoDBClient() {
        const dynamoEndpoint = this.configService.get('DYNAMODB_ENDPOINT_URL');
        const dynamoConfig = {
            region: this.config.region,
            endpoint: dynamoEndpoint,
        };
        // Solo agregar endpoint si existe (para desarrollo local con LocalStack)
        // En Lambda con Gateway VPC Endpoint, NO es necesario especificarlo
        if (dynamoEndpoint) {
            dynamoConfig.endpoint = dynamoEndpoint;
            this.logger.log(`DynamoDB: usando endpoint personalizado: ${dynamoEndpoint}`);
        }
        else if (this.isLambda) {
            this.logger.log(`DynamoDB: usando Gateway VPC Endpoint automático (route table)`);
        }
        else {
            this.logger.log(`DynamoDB: usando endpoint público (dynamodb.${this.config.region}.amazonaws.com)`);
        }
        // Credenciales (solo para desarrollo local)
        return new AWS.DynamoDB.DocumentClient(dynamoConfig);
    }
};
exports.AWSConfigService = AWSConfigService;
exports.AWSConfigService = AWSConfigService = AWSConfigService_1 = __decorate([
    (0, common_1.Injectable)()
], AWSConfigService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWNvbmZpZy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLWNvbmZpZy5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQsNkNBQStCO0FBQy9CLG9EQUFnRDtBQUNoRCxrREFBOEM7QUFTdkMsSUFBTSxnQkFBZ0Isd0JBQXRCLE1BQU0sZ0JBQWdCO0lBSzNCLFlBQTZCLGFBQTRCO1FBQTVCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBSnhDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxrQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUsxRCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDO1FBQ3ZELElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsWUFBWSxDQUFDLElBQUksV0FBVztTQUNwRSxDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsU0FBUztRQUNQLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsY0FBYztRQUNaLE1BQU0sTUFBTSxHQUFRO1lBQ2xCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07U0FDM0IsQ0FBQztRQUVGLE9BQU8sSUFBSSxvQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7UUFDYixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLGtCQUFrQixDQUFDLENBQUM7UUFFNUUsTUFBTSxTQUFTLEdBQVE7WUFDckIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUMxQixPQUFPLEVBQUUsSUFBSTtZQUNiLFVBQVUsRUFBRSxDQUFDO1NBQ2QsQ0FBQztRQUVGLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUNyQixTQUFTLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDO1lBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFDM0UsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0Q0FBNEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixDQUFDLENBQUM7UUFDbkcsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDhCQUE4QixTQUFTLENBQUMsTUFBTSxlQUFlLFNBQVMsQ0FBQyxRQUFRLElBQUksU0FBUyxFQUFFLENBQUMsQ0FBQztRQUVoSCxPQUFPLElBQUksc0JBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQsb0JBQW9CO1FBQ2xCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFTLHVCQUF1QixDQUFDLENBQUM7UUFFL0UsTUFBTSxZQUFZLEdBQStGO1lBQy9HLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDMUIsUUFBUSxFQUFFLGNBQWM7U0FDekIsQ0FBQztRQUVGLHlFQUF5RTtRQUN6RSxvRUFBb0U7UUFDcEUsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNuQixZQUFZLENBQUMsUUFBUSxHQUFHLGNBQWMsQ0FBQztZQUN2QyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyw0Q0FBNEMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztRQUNwRixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLCtDQUErQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0saUJBQWlCLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsNENBQTRDO1FBQzVDLE9BQU8sSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0YsQ0FBQTtBQXhFWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixJQUFBLG1CQUFVLEdBQUU7R0FDQSxnQkFBZ0IsQ0F3RTVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgKiBhcyBBV1MgZnJvbSAnYXdzLXNkayc7XHJcbmltcG9ydCB7IFNRU0NsaWVudCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc3FzXCI7XHJcbmltcG9ydCB7IFMzQ2xpZW50IH0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1zM1wiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBV1NDb25maWcge1xyXG4gIHJlZ2lvbjogc3RyaW5nO1xyXG4gIGFjY2Vzc0tleUlkPzogc3RyaW5nO1xyXG4gIHNlY3JldEFjY2Vzc0tleT86IHN0cmluZztcclxufVxyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgQVdTQ29uZmlnU2VydmljZSB7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKEFXU0NvbmZpZ1NlcnZpY2UubmFtZSk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBjb25maWc6IEFXU0NvbmZpZztcclxuICBwcml2YXRlIHJlYWRvbmx5IGlzTGFtYmRhOiBib29sZWFuO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZ1NlcnZpY2U6IENvbmZpZ1NlcnZpY2UpIHtcclxuICAgIHRoaXMuaXNMYW1iZGEgPSAhIXByb2Nlc3MuZW52LkFXU19MQU1CREFfRlVOQ1RJT05fTkFNRTtcclxuICAgIHRoaXMuY29uZmlnID0ge1xyXG4gICAgICByZWdpb246IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignQVdTX1JFR0lPTicpIHx8ICd1cy1lYXN0LTEnLFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYEFXUyBDb25maWcgaW5pdGlhbGl6ZWQgZm9yIHJlZ2lvbjogJHt0aGlzLmNvbmZpZy5yZWdpb259YCk7XHJcbiAgfVxyXG5cclxuICBnZXRDb25maWcoKTogQVdTQ29uZmlnIHtcclxuICAgIHJldHVybiB7IC4uLnRoaXMuY29uZmlnIH07XHJcbiAgfVxyXG5cclxuICBjcmVhdGVTM0NsaWVudCgpIHtcclxuICAgIGNvbnN0IGNvbmZpZzogYW55ID0ge1xyXG4gICAgICByZWdpb246IHRoaXMuY29uZmlnLnJlZ2lvbixcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG5ldyBTM0NsaWVudChjb25maWcpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYSB1bmEgaW5zdGFuY2lhIGRlIFNRUyBjb24gbGEgY29uZmlndXJhY2nDs25cclxuICAgKi9cclxuICBjcmVhdGVTUVNDbGllbnQoKTogU1FTQ2xpZW50IHtcclxuICAgIGNvbnN0IHJlc29sdmVkRW5kcG9pbnQgPSB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oXCJTUVNfRU5EUE9JTlRfVVJMXCIpO1xyXG5cclxuICAgIGNvbnN0IHNxc0NvbmZpZzogYW55ID0ge1xyXG4gICAgICByZWdpb246IHRoaXMuY29uZmlnLnJlZ2lvbixcclxuICAgICAgdGltZW91dDogNTAwMCxcclxuICAgICAgbWF4UmV0cmllczogMyxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHJlc29sdmVkRW5kcG9pbnQpIHtcclxuICAgICAgc3FzQ29uZmlnLmVuZHBvaW50ID0gcmVzb2x2ZWRFbmRwb2ludDtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBTUVM6IHVzYW5kbyBWUEMgZW5kcG9pbnQgcHJpdmFkbzogJHtyZXNvbHZlZEVuZHBvaW50fWApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBTUVM6IHVzYW5kbyBlbmRwb2ludCBww7pibGljbyBkZSBTUVMgKHNxcy4ke3RoaXMuY29uZmlnLnJlZ2lvbn0uYW1hem9uYXdzLmNvbSlgKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFNRUyBDb25maWcgZmluYWwgLSBSZWdpb246ICR7c3FzQ29uZmlnLnJlZ2lvbn0sIEVuZHBvaW50OiAke3Nxc0NvbmZpZy5lbmRwb2ludCB8fCAnZGVmYXVsdCd9YCk7XHJcbiAgICBcclxuICAgIHJldHVybiBuZXcgU1FTQ2xpZW50KHNxc0NvbmZpZyk7XHJcbiAgfVxyXG5cclxuICBjcmVhdGVEeW5hbW9EQkNsaWVudCgpOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQge1xyXG4gICAgY29uc3QgZHluYW1vRW5kcG9pbnQgPSB0aGlzLmNvbmZpZ1NlcnZpY2UuZ2V0PHN0cmluZz4oJ0RZTkFNT0RCX0VORFBPSU5UX1VSTCcpO1xyXG4gICAgXHJcbiAgICBjb25zdCBkeW5hbW9Db25maWc6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5Eb2N1bWVudENsaWVudE9wdGlvbnMgJiBBV1MuRHluYW1vREIuVHlwZXMuQ2xpZW50Q29uZmlndXJhdGlvbiA9IHtcclxuICAgICAgcmVnaW9uOiB0aGlzLmNvbmZpZy5yZWdpb24sXHJcbiAgICAgIGVuZHBvaW50OiBkeW5hbW9FbmRwb2ludCxcclxuICAgIH07XHJcblxyXG4gICAgLy8gU29sbyBhZ3JlZ2FyIGVuZHBvaW50IHNpIGV4aXN0ZSAocGFyYSBkZXNhcnJvbGxvIGxvY2FsIGNvbiBMb2NhbFN0YWNrKVxyXG4gICAgLy8gRW4gTGFtYmRhIGNvbiBHYXRld2F5IFZQQyBFbmRwb2ludCwgTk8gZXMgbmVjZXNhcmlvIGVzcGVjaWZpY2FybG9cclxuICAgIGlmIChkeW5hbW9FbmRwb2ludCkge1xyXG4gICAgICBkeW5hbW9Db25maWcuZW5kcG9pbnQgPSBkeW5hbW9FbmRwb2ludDtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBEeW5hbW9EQjogdXNhbmRvIGVuZHBvaW50IHBlcnNvbmFsaXphZG86ICR7ZHluYW1vRW5kcG9pbnR9YCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNMYW1iZGEpIHtcclxuICAgICAgdGhpcy5sb2dnZXIubG9nKGBEeW5hbW9EQjogdXNhbmRvIEdhdGV3YXkgVlBDIEVuZHBvaW50IGF1dG9tw6F0aWNvIChyb3V0ZSB0YWJsZSlgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgRHluYW1vREI6IHVzYW5kbyBlbmRwb2ludCBww7pibGljbyAoZHluYW1vZGIuJHt0aGlzLmNvbmZpZy5yZWdpb259LmFtYXpvbmF3cy5jb20pYCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlZGVuY2lhbGVzIChzb2xvIHBhcmEgZGVzYXJyb2xsbyBsb2NhbClcclxuICAgIHJldHVybiBuZXcgQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50KGR5bmFtb0NvbmZpZyk7XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=