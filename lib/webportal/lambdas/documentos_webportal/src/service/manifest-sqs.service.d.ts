import { ConfigService } from '@nestjs/config';
export interface SendManifestCloseResult {
    success: boolean;
    requestId?: string;
    messageId?: string;
    error?: string;
}
export interface SendXmlExportResult {
    success: boolean;
    requestId?: string;
    messageId?: string;
    error?: string;
}
export declare class ManifestSQSService {
    private readonly configService;
    private readonly logger;
    private readonly sqsClient;
    private readonly queueUrl;
    constructor(configService: ConfigService);
    /**
     * Envía un mensaje de cierre de manifiesto directamente a SQS
     * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
     */
    sendManifestCloseMessage(documentoId: number, userId?: string, delaySeconds?: number): Promise<SendManifestCloseResult>;
    /**
     * Envía un mensaje de exportación XML directamente a SQS
     * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
     */
    sendXmlExportMessage(filters: Record<string, any>, fileName?: string): Promise<SendXmlExportResult>;
}
