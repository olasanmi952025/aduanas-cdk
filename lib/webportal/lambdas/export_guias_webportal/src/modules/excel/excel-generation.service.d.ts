import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3';
import { DocumentsQueryService } from '../documentos/documents-query.service';
export declare class ExcelGenerationService {
    private readonly s3Service;
    private readonly configService;
    private readonly documentsQueryService;
    private readonly logger;
    constructor(s3Service: S3Service, configService: ConfigService, documentsQueryService: DocumentsQueryService);
    generateExcel(filters: Record<string, any>, requestId: string, fileName?: string, userId?: number): Promise<{
        filePath: string;
        s3Key: string;
        s3Url: string;
    }>;
    private convertToGuideFiltersDto;
    private createExcelBuffer;
}
