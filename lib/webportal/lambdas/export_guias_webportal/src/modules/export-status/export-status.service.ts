import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AWSConfigService } from '../aws';
import * as AWS from 'aws-sdk';

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
  private readonly dynamoDB: AWS.DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsConfigService: AWSConfigService,
  ) {
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME') || 'export-status';
    this.dynamoDB = this.awsConfigService.createDynamoDBClient();

    if (!this.tableName) {
      this.logger.warn('DYNAMODB_TABLE_NAME not configured.');
    } else {
      this.logger.log(`ExportStatusService initialized for table: ${this.tableName}`);
    }
  }

  /**
   * Crea un registro con estado pendiente en DynamoDB
   * El TTL se establece a 15 minutos desde la creación
   */
  async createPendingStatus(requestId: string, fileName?: string): Promise<void> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    const now = new Date();
    // TTL en segundos Unix timestamp (15 minutos = 900 segundos)
    const ttl = Math.floor(now.getTime() / 1000) + 15 * 60;

    const record: ExportStatusRecord = {
      requestId,
      status: ExportStatus.PENDING,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ttl,
      fileName,
    };

    try {
      await this.dynamoDB
        .put({
          TableName: this.tableName,
          Item: record,
        })
        .promise();

      this.logger.log(`Created pending status for requestId: ${requestId}`);
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error creating pending status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualiza el estado a "processing" cuando el consumidor inicia el procesamiento
   */
  async updateToProcessing(requestId: string): Promise<void> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    try {
      await this.dynamoDB
        .update({
          TableName: this.tableName,
          Key: { requestId },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': ExportStatus.PROCESSING,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();

      this.logger.log(`Updated status to processing for requestId: ${requestId}`);
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error updating status to processing: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualiza el estado a "completed" con la URL firmada y el nombre del archivo
   * La URL firmada tiene una expiración de 1 hora
   */
  async updateToCompleted(
    requestId: string,
    signedUrl: string,
    fileName: string,
  ): Promise<void> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    try {
      await this.dynamoDB
        .update({
          TableName: this.tableName,
          Key: { requestId },
          UpdateExpression:
            'SET #status = :status, signedUrl = :signedUrl, fileName = :fileName, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': ExportStatus.COMPLETED,
            ':signedUrl': signedUrl,
            ':fileName': fileName,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();

      this.logger.log(`Updated status to completed for requestId: ${requestId}`);
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error updating status to completed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualiza el estado a "failed" con el mensaje de error
   */
  async updateToFailed(requestId: string, error: string): Promise<void> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    try {
      await this.dynamoDB
        .update({
          TableName: this.tableName,
          Key: { requestId },
          UpdateExpression: 'SET #status = :status, #error = :error, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#error': 'error',
          },
          ExpressionAttributeValues: {
            ':status': ExportStatus.FAILED,
            ':error': error,
            ':updatedAt': new Date().toISOString(),
          },
        })
        .promise();

      this.logger.log(`Updated status to failed for requestId: ${requestId}`);
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error updating status to failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtiene el estado de una exportación por su requestId
   */
  async getStatus(requestId: string): Promise<ExportStatusRecord | null> {
    if (!this.tableName) {
      throw new Error('DYNAMODB_TABLE_NAME is not configured');
    }

    try {
      const result = await this.dynamoDB
        .get({
          TableName: this.tableName,
          Key: { requestId },
        })
        .promise();

      return (result.Item as ExportStatusRecord) || null;
    } catch (error: any) {
      if (error.code === 'ResourceNotFoundException') {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first. See DYNAMODB_SETUP.md for instructions.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error getting status: ${error.message}`, error.stack);
      throw error;
    }
  }
}

