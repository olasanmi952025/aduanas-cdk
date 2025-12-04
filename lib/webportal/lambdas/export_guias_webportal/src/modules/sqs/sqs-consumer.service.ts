import { ModuleRef } from '@nestjs/core';
import { AWSConfigService } from '../aws';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { ExcelGenerationService } from '../excel/excel-generation.service';
import { PdfGenerationService } from '../pdf/pdf-generation.service';
import { XmlGenerationService } from '../xml/xml-generation.service';
import { ExcelExportMessage, PdfExportMessage, CloseManifestMessage, XmlExportMessage, SQSMessage } from '../../interfaces/sqs-message.interface';
import { ExportStatusService } from '../export-status';
import { S3Service } from '../s3';
import { CloseManifestService } from '../manifiesto';
import { SQSClient, DeleteMessageCommand, ReceiveMessageCommand, Message } from '@aws-sdk/client-sqs';

@Injectable()
export class SQSConsumerService {
  private readonly logger = new Logger(SQSConsumerService.name);
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;
  private isListening: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsConfigService: AWSConfigService,
    private readonly moduleRef: ModuleRef,
    private readonly exportStatusService: ExportStatusService,
    private readonly s3Service: S3Service,
    private readonly closeManifestService: CloseManifestService,
  ) {
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || '';
    this.sqs = this.awsConfigService.createSQSClient();

    if (!this.queueUrl) {
      this.logger.warn('SQS_QUEUE_URL not configured. Cannot consume messages.');
    } else {
      this.logger.log(`SQS Consumer Service initialized for queue: ${this.queueUrl}`);
    }
  }

  async processMessage(message: Message): Promise<void> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    const messageJson = JSON.stringify(message);
    const messageObject = JSON.parse(messageJson);
    console.log(messageObject.Body);
  
    try {
      // Validar body
      if (!messageObject.body && !messageObject.Body) {
        this.logger.warn('Message without Body received. Deleting...');
        await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
        return;
      }
  
      // Parse seguro del Body
      let messageBody: SQSMessage;
      try {
        messageBody = JSON.parse(messageObject.body || messageObject.Body);
      } catch (parseError) {
        this.logger.error('Invalid JSON body. Deleting message.', parseError);
        await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
        return;
      }
  
      // Validación de tipo
      if (!messageBody.type && !messageBody.Type) {
        this.logger.warn(`Message without type. Deleting...`);
        await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
        return;
      }
  
      // Procesar tipos de mensaje
      if (messageBody.type === 'excel.export') {
        await this.processExcelExportMessage(messageBody as ExcelExportMessage);
      } else if (messageBody.type === 'pdf.export') {
        await this.processPdfExportMessage(messageBody as PdfExportMessage);
      } else if(messageBody.type === 'close.manifest') {
        await this.processCloseManifestMessage(messageBody as CloseManifestMessage);
      } else if(messageBody.type === 'xml.export') {
        await this.processXmlExportMessage(messageBody as XmlExportMessage);
      } else {
        this.logger.warn(`Unsupported message type: ${messageBody.type || messageBody.Type }`);
        await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
        return;
      }
  
      // Eliminar mensaje exitosamente procesado
      await this.deleteMessage(messageObject.receiptHandle || messageObject.ReceiptHandle);
      this.logger.log(`Message processed and deleted. MessageId: ${messageObject.messageId || messageObject.MessageId }`);
    } catch (error: any) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      throw error;
    }
  }  

  private async deleteMessage(receiptHandle: string): Promise<void> {
    if (!receiptHandle) {
      this.logger.error('Missing ReceiptHandle. Cannot delete message.');
      return;
    }
  
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
  
    await this.sqs.send(command);
  }

  /**
   * Procesa un mensaje de exportación Excel
   * Actualiza el estado a processing, genera el Excel, crea URL firmada y actualiza a completed
   */
  private async processExcelExportMessage(message: ExcelExportMessage): Promise<void> {
    const { payload } = message;
    const { filters, requestId, fileName, userId } = payload;

    const excelGenerationService = this.moduleRef.get(ExcelGenerationService, { strict: false });

    try {
      this.logger.log(`Procesando exportación Excel. RequestId: ${requestId}`);
      
      // Actualizar estado a processing
      await this.exportStatusService.updateToProcessing(requestId);

      // Generar archivo Excel
      const result = await excelGenerationService.generateExcel(
        filters,
        requestId,
        fileName,
        Number(userId),
      );

      // Generar URL firmada con expiración de 1 hora (3600 segundos)
      const signedUrl = await this.s3Service.getSignedUrl({
        key: result.s3Key,
        expiresIn: 3600,
      });

      // Actualizar estado a completed con URL firmada
      await this.exportStatusService.updateToCompleted(
        requestId,
        signedUrl,
        result.filePath,
      );

      this.logger.log(
        `Exportación Excel completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`,
      );
    } catch (error: any) {
      this.logger.error(`Error procesando exportación Excel: ${error.message}`, error.stack);
      
      // Actualizar estado a failed en caso de error
      try {
        await this.exportStatusService.updateToFailed(
          requestId,
          error.message || 'Error desconocido',
        );
      } catch (statusError: any) {
        this.logger.error(
          `Error actualizando estado a failed: ${statusError.message}`,
          statusError.stack,
        );
      }
      
      throw error;
    }
  }

  /**
   * Procesa un mensaje de exportación PDF
   * Actualiza el estado a processing, genera el PDF(s), crea URL firmada y actualiza a completed
   */
  private async processPdfExportMessage(message: PdfExportMessage): Promise<void> {
    const { payload } = message;
    const { guideIds, requestId, fileName, userId } = payload;

    const pdfGenerationService = this.moduleRef.get(PdfGenerationService, { strict: false });

    try {
      this.logger.log(`Procesando exportación PDF. RequestId: ${requestId}, Guías: ${guideIds.join(', ')}`);
      
      // Actualizar estado a processing
      await this.exportStatusService.updateToProcessing(requestId);

      // Generar archivo(s) PDF
      const result = await pdfGenerationService.generatePdfForGuides(
        guideIds,
        requestId,
        fileName,
        userId,
      );

      // Generar URL firmada con expiración de 1 hora (3600 segundos)
      const signedUrl = await this.s3Service.getSignedUrl({
        key: result.s3Key,
        expiresIn: 3600,
      });

      // Actualizar estado a completed con URL firmada
      await this.exportStatusService.updateToCompleted(
        requestId,
        signedUrl,
        result.filePath,
      );

      this.logger.log(
        `Exportación PDF completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`,
      );
    } catch (error: any) {
      this.logger.error(`Error procesando exportación PDF: ${error.message}`, error.stack);
      
      // Actualizar estado a failed en caso de error
      try {
        await this.exportStatusService.updateToFailed(
          requestId,
          error.message || 'Error desconocido',
        );
      } catch (statusError: any) {
        this.logger.error(
          `Error actualizando estado a failed: ${statusError.message}`,
          statusError.stack,
        );
      }
      
      throw error;
    }
  }

  /**
   * Procesa un mensaje de cierre de manifiesto
   * Actualiza el estado a processing, ejecuta el proceso simulado y actualiza a completed/failed
   */
  private async processCloseManifestMessage(message: CloseManifestMessage): Promise<void> {
    const { payload } = message;
    const { requestId, documentoId, userId, delaySeconds = 2 } = payload;

    try {
      this.logger.log(`Procesando cierre de manifiesto. RequestId: ${requestId}, DocumentoId: ${documentoId}`);
      
      // Actualizar estado a processing
      await this.exportStatusService.updateToProcessing(requestId);

      // Aplicar delay configurado
      if (delaySeconds > 0) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }

      // Ejecutar lógica real de cierre de manifiesto
      await this.closeManifestService.closeManifest(documentoId as number);

      // Actualizar estado a completed
      // Nota: Para procesos que no generan archivos, usamos un mensaje como fileName
      await this.exportStatusService.updateToCompleted(
        requestId,
        'N/A', // No hay URL para este tipo de proceso
        `Manifest closed successfully - DocumentoId: ${documentoId || 'N/A'}`,
      );

      this.logger.log(
        `Cierre de manifiesto completado exitosamente. RequestId: ${requestId}`,
      );
    } catch (error: any) {
      this.logger.error(`Error procesando cierre de manifiesto: ${error.message}`, error.stack);
      
      // Actualizar estado a failed en caso de error
      try {
        await this.exportStatusService.updateToFailed(
          requestId,
          error.message || 'Error desconocido',
        );
      } catch (statusError: any) {
        this.logger.error(
          `Error actualizando estado a failed: ${statusError.message}`,
          statusError.stack,
        );
      }
      
      throw error;
    }
  }

  /**
   * Procesa un mensaje de exportación XML
   * Actualiza el estado a processing, genera el XML, crea URL firmada y actualiza a completed
   */
  private async processXmlExportMessage(message: XmlExportMessage): Promise<void> {
    const { payload } = message;
    const { filters, requestId, fileName } = payload;

    const xmlGenerationService = this.moduleRef.get(XmlGenerationService, { strict: false });

    try {
      this.logger.log(`Procesando exportación XML. RequestId: ${requestId}`);
      
      // Actualizar estado a processing
      await this.exportStatusService.updateToProcessing(requestId);

      // Generar archivo XML
      const result = await xmlGenerationService.generateXml(
        filters,
        requestId,
        fileName,
      );

      // Generar URL firmada con expiración de 1 hora (3600 segundos)
      const signedUrl = await this.s3Service.getSignedUrl({
        key: result.s3Key,
        expiresIn: 3600,
      });

      // Actualizar estado a completed con URL firmada
      await this.exportStatusService.updateToCompleted(
        requestId,
        signedUrl,
        result.filePath,
      );

      this.logger.log(
        `Exportación XML completada exitosamente. RequestId: ${requestId}, S3Url: ${result.s3Url}`,
      );
    } catch (error: any) {
      this.logger.error(`Error procesando exportación XML: ${error.message}`, error.stack);
      
      // Actualizar estado a failed en caso de error
      try {
        await this.exportStatusService.updateToFailed(
          requestId,
          error.message || 'Error desconocido',
        );
      } catch (statusError: any) {
        this.logger.error(
          `Error actualizando estado a failed: ${statusError.message}`,
          statusError.stack,
        );
      }
      
      throw error;
    }
  }

  /**
   * Consume y procesa un mensaje de la cola SQS
   * @param waitTimeSeconds Tiempo de espera para long polling (0 = no esperar)
   */
  async consumeAndProcessMessage(waitTimeSeconds: number = 0): Promise<boolean> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    try {
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ['All'],
      });

      const result = await this.sqs.send(receiveCommand);

      if (!result.Messages || result.Messages.length === 0) {
        this.logger.debug('No hay mensajes en la cola');
        return false;
      }

      const message = result.Messages[0];
      this.logger.log(`Mensaje recibido de SQS. MessageId: ${message.MessageId}`);

      try {
        await this.processMessage(message);
        return true;
      } catch (error: any) {
        this.logger.error(`Error processing message: ${error.message}`, error.stack);
        throw error;
      }
    } catch (error: any) {
      this.logger.error(`Error consuming message from SQS: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Inicia el listener continuo para consumir mensajes de SQS
   * Usa long polling con waitTimeSeconds de 10 segundos
   */
  async listen(): Promise<void> {
    if (!this.queueUrl) {
      this.logger.warn('SQS_QUEUE_URL no configurado. No se puede iniciar el listener.');
      return;
    }

    if (this.isListening) {
      this.logger.warn('El listener ya está ejecutándose.');
      return;
    }

    this.isListening = true;
    this.logger.log('Escuchando mensajes de SQS...');

    while (this.isListening) {
      try {
        const hasMessage = await this.consumeAndProcessMessage(10);
        if (!hasMessage) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        this.logger.error(`Error in listener loop: ${error.message}`, error.stack);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.logger.log('Listener detenido.');
  }

  /**
   * Detiene el listener de SQS
   */
  stop(): void {
    this.isListening = false;
    this.logger.log('Deteniendo listener...');
  }

  getStatus() {
    return {
      queueUrl: this.queueUrl || 'Not configured',
      isListening: this.isListening,
    };
  }
}

