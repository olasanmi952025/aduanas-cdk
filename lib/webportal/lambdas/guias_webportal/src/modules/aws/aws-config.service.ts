import { Injectable, Logger } from "@nestjs/common";
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
@Injectable()
export class AWSConfigService {
  private readonly logger = new Logger(AWSConfigService.name);
  private readonly config: AWSConfig;
  private readonly isLambda: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    this.config = {
      region: this.configService.get<string>("AWS_REGION") || "us-east-1",
      sqsEndpointUrl: this.configService.get<string>("SQS_ENDPOINT_URL"),
    };

    if (this.isLambda) {
      this.logger.log(
        `AWS Config inicializado para Lambda - Región: ${this.config.region} - Usando IAM Role`
      );
    } else {
      this.config.accessKeyId =
        this.configService.get<string>("AWS_ACCESS_KEY_ID");
      this.config.secretAccessKey = this.configService.get<string>(
        "AWS_SECRET_ACCESS_KEY"
      );
      this.logger.log(
        `AWS Config inicializado para desarrollo - Región: ${this.config.region}`
      );
    }
  }

  /**
   * Obtiene la configuración de AWS
   */
  getConfig(): AWSConfig {
    return { ...this.config };
  }

  /**
   * Crea una instancia de S3 con la configuración
   */
  createS3Client(): AWS.S3 {
    const s3Config: AWS.S3.ClientConfiguration = {
      region: this.config.region,
      endpoint: this.configService.get<string>("S3_ENDPOINT_URL"),
      s3ForcePathStyle: true,
      signatureVersion: "v4",
      httpOptions: {
        timeout: 15000,
      },
    };

    if (
      !this.isLambda &&
      this.config.accessKeyId &&
      this.config.secretAccessKey
    ) {
      s3Config.accessKeyId = this.config.accessKeyId;
      s3Config.secretAccessKey = this.config.secretAccessKey;
      this.logger.log(
        "Usando credenciales explícitas para S3 (entorno local/desarrollo)"
      );
    } else if (this.isLambda) {
      this.logger.log("Usando IAM role para S3 (entorno Lambda)");
    } else {
      this.logger.log(
        "Usando credenciales por defecto del entorno (IAM role o credenciales del sistema)"
      );
    }

    return new AWS.S3(s3Config);
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

    if (!this.isLambda) {
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        sqsConfig.credentials = {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        };
        this.logger.log('SQS: usando credenciales explícitas (local)');
      } else {
        this.logger.log('SQS: usando credenciales por defecto del sistema');
      }
    } else {
      this.logger.log('SQS: usando IAM Role en Lambda');
    }

    this.logger.log(`SQS Config final - Region: ${sqsConfig.region}, Endpoint: ${sqsConfig.endpoint || 'default'}`);
    
    return new SQSClient(sqsConfig);
  }

  /**
   * Crea una instancia de DynamoDB DocumentClient con la configuración
   */
  createDynamoDBClient(): AWS.DynamoDB.DocumentClient {
    const dynamoConfig: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {
      region: this.config.region,
      endpoint: this.configService.get<string>("DYNAMODB_ENDPOINT_URL"),
    };

    if (
      !this.isLambda &&
      this.config.accessKeyId &&
      this.config.secretAccessKey
    ) {
      dynamoConfig.accessKeyId = this.config.accessKeyId;
      dynamoConfig.secretAccessKey = this.config.secretAccessKey;
      this.logger.log(
        "Usando credenciales explícitas para DynamoDB (entorno local/desarrollo)"
      );
    } else if (this.isLambda) {
      this.logger.log("Usando IAM role para DynamoDB (entorno Lambda)");
    } else {
      this.logger.log(
        "Usando credenciales por defecto del entorno para DynamoDB"
      );
    }

    return new AWS.DynamoDB.DocumentClient(dynamoConfig);
  }
}
