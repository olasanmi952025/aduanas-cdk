import { ConfigService } from '@nestjs/config';
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
export declare class S3Service {
    private readonly configService;
    private readonly awsConfigService;
    private readonly logger;
    private readonly s3;
    private readonly bucketName;
    constructor(configService: ConfigService, awsConfigService: AWSConfigService);
    uploadFile(options: S3UploadOptions): Promise<string>;
    getSignedUrl(options: S3SignedUrlOptions): Promise<string>;
    deleteFile(key: string): Promise<void>;
}
