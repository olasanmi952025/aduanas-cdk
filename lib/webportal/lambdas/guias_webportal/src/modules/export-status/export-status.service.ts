import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AWSConfigService } from "../aws";
import * as AWS from "aws-sdk";
import { ExportStatusRecord } from "./interfaces/export.status";

@Injectable()
export class ExportStatusService {
  private readonly logger = new Logger(ExportStatusService.name);
  private readonly dynamoDB: AWS.DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsConfigService: AWSConfigService,
  ) {
    this.tableName =
      this.configService.get<string>("DYNAMODB_TABLE_NAME") || "";

    this.dynamoDB = this.awsConfigService.createDynamoDBClient();

    if (!this.tableName) {
      this.logger.warn("DYNAMODB_TABLE_NAME not configured.");
    } else {
      this.logger.log(
        `ExportStatusService initialized for table: ${this.tableName}`
      );
    }
  }

  /**
   * Obtiene el estado de una exportación por su requestId
   */
  async getStatus(requestId: string): Promise<ExportStatusRecord | null> {
    if (!this.tableName) {
      throw new Error("DYNAMODB_TABLE_NAME is not configured");
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
      if (error.code === "ResourceNotFoundException") {
        const errorMessage = `DynamoDB table "${this.tableName}" not found. Please create the table first.`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      this.logger.error(`Error getting status: ${error.message}`, error.stack);
      throw error;
    }
  }
}

