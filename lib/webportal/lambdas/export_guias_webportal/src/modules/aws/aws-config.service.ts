import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { SQSClient } from "@aws-sdk/client-sqs";
import { S3Client } from "@aws-sdk/client-s3";

export interface AWSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

@Injectable()
export class AWSConfigService {
  private readonly logger = new Logger(AWSConfigService.name);
  private readonly config: AWSConfig;
  private readonly isLambda: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.config = {
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
    };

    this.logger.log(`AWS Config initialized for region: ${this.config.region}`);
  }

  getConfig(): AWSConfig {
    return { ...this.config };
  }

  createS3Client() {
    const config: any = {
      region: this.config.region,
    };

    return new S3Client(config);
  }

  /**
   * Crea una instancia de SQS con la configuración
   */
  createSQSClient(): SQSClient {
    const resolvedEndpoint = this.configService.get<string>("SQS_ENDPOINT_URL");

    const sqsConfig: any = {
      region: this.config.region,
      timeout: 5000,
      maxRetries: 3,
    };

    if (resolvedEndpoint) {
      sqsConfig.endpoint = resolvedEndpoint;
      this.logger.log(`SQS: usando VPC endpoint privado: ${resolvedEndpoint}`);
    } else {
      this.logger.log(`SQS: usando endpoint público de SQS (sqs.${this.config.region}.amazonaws.com)`);
    }

    this.logger.log(`SQS Config final - Region: ${sqsConfig.region}, Endpoint: ${sqsConfig.endpoint || 'default'}`);
    
    return new SQSClient(sqsConfig);
  }

  createDynamoDBClient(): AWS.DynamoDB.DocumentClient {
    const dynamoEndpoint = this.configService.get<string>('DYNAMODB_ENDPOINT_URL');
    
    const dynamoConfig: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {
      region: this.config.region,
      endpoint: dynamoEndpoint,
    };

    // Solo agregar endpoint si existe (para desarrollo local con LocalStack)
    // En Lambda con Gateway VPC Endpoint, NO es necesario especificarlo
    if (dynamoEndpoint) {
      dynamoConfig.endpoint = dynamoEndpoint;
      this.logger.log(`DynamoDB: usando endpoint personalizado: ${dynamoEndpoint}`);
    } else if (this.isLambda) {
      this.logger.log(`DynamoDB: usando Gateway VPC Endpoint automático (route table)`);
    } else {
      this.logger.log(`DynamoDB: usando endpoint público (dynamodb.${this.config.region}.amazonaws.com)`);
    }

    // Credenciales (solo para desarrollo local)
    return new AWS.DynamoDB.DocumentClient(dynamoConfig);
  }
}

