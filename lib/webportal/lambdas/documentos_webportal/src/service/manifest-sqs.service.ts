import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

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

@Injectable()
export class ManifestSQSService {
  private readonly logger = new Logger(ManifestSQSService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const resolvedEndpoint = this.configService.get<string>("SQS_ENDPOINT_URL");

    // Configurar SQS Client con credenciales si están disponibles (solo para desarrollo local)
    const sqsConfig: any = {
      endpoint: resolvedEndpoint,
      region,
    };

    // Solo agregar credenciales explícitas si NO estamos en Lambda y están configuradas
    if (!isLambda && accessKeyId && secretAccessKey) {
      sqsConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
      this.logger.log('SQS: usando credenciales explícitas (desarrollo local)');
    } else if (isLambda) {
      this.logger.log('SQS: usando IAM Role en Lambda');
    } else {
      this.logger.log('SQS: usando credenciales por defecto del sistema (~/.aws/credentials o variables de entorno)');
    }

    this.sqsClient = new SQSClient(sqsConfig);
    
    // Usar SQS_QUEUE_URL que es la misma cola que usa el polling process
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || 
                    this.configService.get<string>('MANIFEST_CLOSE_QUEUE_URL') || '';
    
    if (!this.queueUrl) {
      this.logger.warn('SQS_QUEUE_URL or MANIFEST_CLOSE_QUEUE_URL not configured. SQS messages will not be sent.');
    } else {
      this.logger.log(`ManifestSQSService initialized for queue: ${this.queueUrl}`);
    }
  }

  /**
   * Envía un mensaje de cierre de manifiesto directamente a SQS
   * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
   */
  async sendManifestCloseMessage(
    documentoId: number,
    userId?: string,
    delaySeconds?: number
  ): Promise<SendManifestCloseResult> {
    if (!this.queueUrl) {
      return {
        success: false,
        error: 'SQS_QUEUE_URL not configured',
      };
    }

    try {
      const requestId = uuidv4();
      const messageId = uuidv4();

      // Formato compatible con el polling process
      const message = {
        id: messageId,
        type: 'close.manifest',
        payload: {
          requestId,
          documentoId,
          userId,
          delaySeconds: delaySeconds || 2,
        },
        timestamp: new Date().toISOString(),
        source: 'pweb_ms_documentos',
        correlationId: requestId,
      };

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageType: {
            DataType: 'String',
            StringValue: 'close.manifest',
          },
          RequestId: {
            DataType: 'String',
            StringValue: requestId,
          },
          DocumentoId: {
            DataType: 'Number',
            StringValue: documentoId.toString(),
          },
        },
      });

      const result = await this.sqsClient.send(command);

      this.logger.log(
        `Manifest close message sent to SQS. MessageId: ${result.MessageId}, RequestId: ${requestId}, DocumentoId: ${documentoId}`
      );

      return {
        success: true,
        requestId,
        messageId: result.MessageId || messageId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send manifest close message. DocumentoId: ${documentoId}, Error: ${error.message}`,
        error.stack
      );

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Envía un mensaje de exportación XML directamente a SQS
   * Formato compatible con el polling process (marcos/minimis_pweb_polling_process)
   */
  async sendXmlExportMessage(
    filters: Record<string, any>,
    fileName?: string
  ): Promise<SendXmlExportResult> {
    if (!this.queueUrl) {
      return {
        success: false,
        error: 'SQS_QUEUE_URL not configured',
      };
    }

    try {
      const requestId = uuidv4();
      const messageId = uuidv4();

      // Formato compatible con el polling process
      const message = {
        id: messageId,
        type: 'xml.export',
        payload: {
          requestId,
          filters,
          fileName,
        },
        timestamp: new Date().toISOString(),
        source: 'pweb_ms_documentos',
        correlationId: requestId,
      };

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          MessageType: {
            DataType: 'String',
            StringValue: 'xml.export',
          },
          RequestId: {
            DataType: 'String',
            StringValue: requestId,
          },
        },
      });

      const result = await this.sqsClient.send(command);

      this.logger.log(
        `XML export message sent to SQS. MessageId: ${result.MessageId}, RequestId: ${requestId}`
      );

      return {
        success: true,
        requestId,
        messageId: result.MessageId || messageId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send XML export message. Error: ${error.message}`,
        error.stack
      );

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}