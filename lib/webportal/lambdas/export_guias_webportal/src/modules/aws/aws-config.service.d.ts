import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { SQSClient } from "@aws-sdk/client-sqs";
import { S3Client } from "@aws-sdk/client-s3";
export interface AWSConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
export declare class AWSConfigService {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private readonly isLambda;
    constructor(configService: ConfigService);
    getConfig(): AWSConfig;
    createS3Client(): S3Client;
    /**
     * Crea una instancia de SQS con la configuración
     */
    createSQSClient(): SQSClient;
    createDynamoDBClient(): AWS.DynamoDB.DocumentClient;
}
