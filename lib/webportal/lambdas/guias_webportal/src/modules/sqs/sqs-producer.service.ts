import { v4 as uuidv4 } from 'uuid';
import { AWSConfigService } from '../aws';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { ExcelExportPayload, PdfExportPayload } from '../../interfaces/sqs-message.interface';
import { SendMessageCommand, SQSClient, SendMessageCommandInput } from '@aws-sdk/client-sqs';

export interface SendMessageResult {
  messageId: string;
  requestId: string;
}

@Injectable()
export class SQSProducerService {
  private readonly logger = new Logger(SQSProducerService.name);
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsConfigService: AWSConfigService,
  ) {
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || '';
    this.sqs = this.awsConfigService.createSQSClient();

    if (!this.queueUrl) {
      this.logger.warn('SQS_QUEUE_URL no configurado. Los mensajes no se enviarán.');
    }
    
    this.logger.log(`SQS Producer inicializado - QueueUrl: ${this.queueUrl}`);
  }

  /**
   * Envía un mensaje a la cola SQS para exportar Excel
   */
  async sendExcelExportMessage(
    filters: Record<string, any>,
    userId?: number,
  ): Promise<SendMessageResult> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL no está configurado');
    }

    const requestId = uuidv4();
    const messageId = uuidv4();

    const payload: ExcelExportPayload = {
      filters,
      userId,
      requestId,
    };

    const message: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({
        id: messageId,
        type: 'excel.export',
        payload,
        timestamp: new Date().toISOString(),
        source: 'pweb_ms_guias',
        correlationId: requestId,
      }),
      MessageAttributes: {
        MessageType: {
          DataType: 'String',
          StringValue: 'excel.export',
        },
        RequestId: {
          DataType: 'String',
          StringValue: requestId,
        },
      },
    };

    try {
      this.logger.log(
        `Intentando enviar mensaje a SQS. QueueUrl: ${this.queueUrl}, RequestId: ${requestId}`,
      );
      
      const startTime = Date.now();
      const result = await this.sqs?.send(
        new SendMessageCommand(message)
      );
      this.logger.log(`Resultado: ${JSON.stringify(result)}`);

      if (!result) {
        throw new Error('No se pudo enviar el mensaje a SQS');
      }
      const duration = Date.now() - startTime;
      
      const finalMessageId = result.MessageId || messageId;
      
      this.logger.log(
        `Mensaje enviado a SQS exitosamente. MessageId: ${finalMessageId}, RequestId: ${requestId}, Duración: ${duration}ms`,
      );

      return {
        messageId: finalMessageId,
        requestId,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      const errorCode = error.code || 'UNKNOWN';
      const isTimeout = errorMessage.includes('timeout') || errorCode === 'TimeoutError' || errorCode === 'ETIMEDOUT';
      
      this.logger.error(
        `Error al enviar mensaje a SQS. QueueUrl: ${message.QueueUrl}, RequestId: ${requestId}, Error: ${errorMessage}, Code: ${errorCode}`,
        error.stack,
      );
      
      if (isTimeout) {
        this.logger.error(
          `Timeout al enviar mensaje a SQS. Verificar: 1) Permisos IAM de la Lambda, 2) Configuración de VPC, 3) Conectividad de red`,
        );
      }
      
      this.logger.error(`Error completo: ${JSON.stringify(error, null, 2)}`);
      throw new Error(`Error al enviar mensaje a SQS: ${errorMessage}`);
    }
  }

  /**
   * Envía un mensaje a la cola SQS para exportar PDF
   */
  async sendPdfExportMessage(
    guideIds: number[],
    userId?: number,
  ): Promise<SendMessageResult> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL no está configurado');
    }

    const requestId = uuidv4();
    const messageId = uuidv4();

    const payload: PdfExportPayload = {
      guideIds,
      userId,
      requestId,
    };

    const message: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({
        id: messageId,
        type: 'pdf.export',
        payload,
        timestamp: new Date().toISOString(),
        source: 'pweb_ms_guias',
        correlationId: requestId,
      }),
      MessageAttributes: {
        MessageType: {
          DataType: 'String',
          StringValue: 'pdf.export',
        },
        RequestId: {
          DataType: 'String',
          StringValue: requestId,
        },
      },
    };

    try {
      this.logger.log(
        `Intentando enviar mensaje PDF a SQS. QueueUrl: ${this.queueUrl}, RequestId: ${requestId}, GuideIds: ${guideIds.join(', ')}`,
      );
      
      const startTime = Date.now();
      const result = await this.sqs?.send(
        new SendMessageCommand(message)
      );
      this.logger.log(`Resultado: ${JSON.stringify(result)}`);

      if (!result) {
        throw new Error('No se pudo enviar el mensaje a SQS');
      }
      const duration = Date.now() - startTime;
      
      const finalMessageId = result.MessageId || messageId;
      
      this.logger.log(
        `Mensaje PDF enviado a SQS exitosamente. MessageId: ${finalMessageId}, RequestId: ${requestId}, Duración: ${duration}ms`,
      );

      return {
        messageId: finalMessageId,
        requestId,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido';
      const errorCode = error.code || 'UNKNOWN';
      const isTimeout = errorMessage.includes('timeout') || errorCode === 'TimeoutError' || errorCode === 'ETIMEDOUT';
      
      this.logger.error(
        `Error al enviar mensaje PDF a SQS. QueueUrl: ${message.QueueUrl}, RequestId: ${requestId}, Error: ${errorMessage}, Code: ${errorCode}`,
        error.stack,
      );
      
      if (isTimeout) {
        this.logger.error(
          `Timeout al enviar mensaje a SQS. Verificar: 1) Permisos IAM de la Lambda, 2) Configuración de VPC, 3) Conectividad de red`,
        );
      }
      
      this.logger.error(`Error completo: ${JSON.stringify(error, null, 2)}`);
      throw new Error(`Error al enviar mensaje PDF a SQS: ${errorMessage}`);
    }
  }
}

