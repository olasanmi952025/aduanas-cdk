import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { Repository } from 'typeorm';
import { DocDocumentoBase } from '../documentos/entities';
export declare class XmlGenerationService {
    private readonly s3Service;
    private readonly configService;
    private readonly documentoBaseRepository;
    private readonly logger;
    constructor(s3Service: S3Service, configService: ConfigService, documentoBaseRepository: Repository<DocDocumentoBase>);
    generateXml(filters: Record<string, any>, requestId: string, fileName?: string): Promise<{
        filePath: string;
        s3Key: string;
        s3Url: string;
    }>;
}
