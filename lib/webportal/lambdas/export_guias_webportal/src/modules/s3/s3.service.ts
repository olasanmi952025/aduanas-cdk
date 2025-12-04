import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// SDK v3
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { AWSConfigService } from '../aws';

export interface S3UploadOptions {
  buffer: Buffer;
  key: string;
  contentType: string;
  encryption?: 'AES256' | 'aws:kms';
}

export interface S3SignedUrlOptions {
  key: string;
  expiresIn?: number;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsConfigService: AWSConfigService,
  ) {
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') ||
      'pweb-ms-export-guias';

    // Ahora es S3Client v3
    this.s3 = this.awsConfigService.createS3Client();

    this.logger.log(`S3 Service (SDK v3) initialized for bucket: ${this.bucketName}`);
  }

  // ==================================================
  // UPLOAD FILE (SDK v3)
  // ==================================================
  async uploadFile(options: S3UploadOptions): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: options.key,
        Body: options.buffer,
        ContentType: options.contentType,
        ServerSideEncryption: options.encryption || 'AES256',
      });

      await this.s3.send(command);

      const location = `s3://${this.bucketName}/${options.key}`;
      this.logger.log(`File uploaded to S3: ${location}`);

      return location;
    } catch (error: any) {
      this.logger.error(
        `Error uploading file to S3: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error uploading file to S3: ${error.message}`);
    }
  }

  // ==================================================
  // SIGNED URL (SDK v3)
  // ==================================================
  async getSignedUrl(options: S3SignedUrlOptions): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: options.key,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: options.expiresIn || 3600,
      });

      this.logger.debug(`Signed URL generated for: ${options.key}`);
      return url;
    } catch (error: any) {
      this.logger.error(
        `Error generating signed URL: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error generating signed URL: ${error.message}`);
    }
  }

  // ==================================================
  // DELETE FILE (SDK v3)
  // ==================================================
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error: any) {
      this.logger.error(
        `Error deleting file from S3: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error deleting file from S3: ${error.message}`);
    }
  }
}
