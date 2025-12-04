import { ConfigService } from '@nestjs/config';
export interface SubmitProcessResponse {
    jobId: string;
    status: string;
    message: string;
}
export interface ProcessStatusResponse {
    jobId: string;
    processType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
}
export declare class PollingProcessService {
    private readonly configService;
    private readonly logger;
    private readonly httpClient;
    private readonly pollingApiUrl;
    constructor(configService: ConfigService);
    /**
     * Envía un proceso al polling_process usando POST /process
     * @param processType Tipo de proceso (ej: 'manifest.close')
     * @param payload Payload del proceso
     * @returns Respuesta con jobId y estado
     */
    submitProcess(processType: string, payload?: any): Promise<SubmitProcessResponse>;
    /**
     * Consulta el estado de un proceso usando GET /process/:jobId
     * @param jobId ID del job
     * @returns Estado del proceso
     */
    getProcessStatus(jobId: string): Promise<ProcessStatusResponse>;
}
