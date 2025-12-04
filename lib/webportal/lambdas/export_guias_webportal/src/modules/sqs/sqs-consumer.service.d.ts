import { ModuleRef } from '@nestjs/core';
import { AWSConfigService } from '../aws';
import { ConfigService } from '@nestjs/config';
import { ExportStatusService } from '../export-status';
import { S3Service } from '../s3';
import { CloseManifestService } from '../manifiesto';
import { Message } from '@aws-sdk/client-sqs';
export declare class SQSConsumerService {
    private readonly configService;
    private readonly awsConfigService;
    private readonly moduleRef;
    private readonly exportStatusService;
    private readonly s3Service;
    private readonly closeManifestService;
    private readonly logger;
    private readonly sqs;
    private readonly queueUrl;
    private isListening;
    constructor(configService: ConfigService, awsConfigService: AWSConfigService, moduleRef: ModuleRef, exportStatusService: ExportStatusService, s3Service: S3Service, closeManifestService: CloseManifestService);
    processMessage(message: Message): Promise<void>;
    private deleteMessage;
    /**
     * Procesa un mensaje de exportación Excel
     * Actualiza el estado a processing, genera el Excel, crea URL firmada y actualiza a completed
     */
    private processExcelExportMessage;
    /**
     * Procesa un mensaje de exportación PDF
     * Actualiza el estado a processing, genera el PDF(s), crea URL firmada y actualiza a completed
     */
    private processPdfExportMessage;
    /**
     * Procesa un mensaje de cierre de manifiesto
     * Actualiza el estado a processing, ejecuta el proceso simulado y actualiza a completed/failed
     */
    private processCloseManifestMessage;
    /**
     * Procesa un mensaje de exportación XML
     * Actualiza el estado a processing, genera el XML, crea URL firmada y actualiza a completed
     */
    private processXmlExportMessage;
    /**
     * Consume y procesa un mensaje de la cola SQS
     * @param waitTimeSeconds Tiempo de espera para long polling (0 = no esperar)
     */
    consumeAndProcessMessage(waitTimeSeconds?: number): Promise<boolean>;
    /**
     * Inicia el listener continuo para consumir mensajes de SQS
     * Usa long polling con waitTimeSeconds de 10 segundos
     */
    listen(): Promise<void>;
    /**
     * Detiene el listener de SQS
     */
    stop(): void;
    getStatus(): {
        queueUrl: string;
        isListening: boolean;
    };
}
