import { AWSConfigService } from '../aws';
import { ConfigService } from '@nestjs/config';
export interface SendMessageResult {
    messageId: string;
    requestId: string;
}
export declare class SQSProducerService {
    private readonly configService;
    private readonly awsConfigService;
    private readonly logger;
    private readonly sqs;
    private readonly queueUrl;
    constructor(configService: ConfigService, awsConfigService: AWSConfigService);
    /**
     * Envía un mensaje a la cola SQS para exportar Excel
     */
    sendExcelExportMessage(filters: Record<string, any>, userId?: number): Promise<SendMessageResult>;
    /**
     * Envía un mensaje a la cola SQS para exportar PDF
     */
    sendPdfExportMessage(guideIds: number[], userId?: number): Promise<SendMessageResult>;
}
