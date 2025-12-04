import { ConfigService } from "@nestjs/config";
import * as AWS from "aws-sdk";
import { SQSClient } from "@aws-sdk/client-sqs";
export interface AWSConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sqsEndpointUrl?: string;
}
/**
 * Servicio base para configuración de AWS
 * Centraliza la configuración común de servicios AWS
 */
export declare class AWSConfigService {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private readonly isLambda;
    constructor(configService: ConfigService);
    /**
     * Obtiene la configuración de AWS
     */
    getConfig(): AWSConfig;
    /**
     * Crea una instancia de S3 con la configuración
     */
    createS3Client(): AWS.S3;
    /**
     * Crea una instancia de SQS con la configuración
     */
    createSQSClient(): SQSClient;
    /**
     * Crea una instancia de DynamoDB DocumentClient con la configuración
     */
    createDynamoDBClient(): AWS.DynamoDB.DocumentClient;
}
