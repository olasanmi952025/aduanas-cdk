import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ExportStatusRecord {
  requestId: string;
  status: ExportStatus;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
  signedUrl?: string;
  fileName?: string;
  error?: string;
}

@Injectable()
export class ExportStatusService {
  private readonly logger = new Logger(ExportStatusService.name);
  private readonly dynamoDB: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';

    const client = new DynamoDBClient({
      region,
      endpoint: this.configService.get<string>("DYNAMODB_ENDPOINT_URL"),
    });
    this.dynamoDB = DynamoDBDocumentClient.from(client);
    
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME') || 'export-status';

    if (!this.tableName) {
      this.logger.warn('DYNAMODB_TABLE_NAME not configured.');
    } else {
      this.logger.log(`ExportStatusService initialized for table: ${this.tableName}`);
    }
  }

  /**
   * Obtiene el estado de un proceso por su requestId desde DynamoDB
   */
  async getStatus(requestId: string): Promise<ExportStatusRecord | null> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    try {
      const result = await this.dynamoDB.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { requestId },
        })
      );

      return (result.Item as ExportStatusRecord) || null;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error getting status: ${error.message}`, error.stack);
      throw error;
    }
  }
}

