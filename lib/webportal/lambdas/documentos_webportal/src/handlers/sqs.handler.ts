import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { Logger } from '@nestjs/common';
import { SQSMessage, SQSProcessingResult, TypedSQSMessage } from '../interfaces/sqs-message.interface';

const logger = new Logger('SQSHandler');

export class SQSMessageHandler {
  private static instance: SQSMessageHandler;

  static getInstance(): SQSMessageHandler {
    if (!SQSMessageHandler.instance) {
      SQSMessageHandler.instance = new SQSMessageHandler();
    }
    return SQSMessageHandler.instance;
  }

  async processSQSEvent(event: SQSEvent, context: Context): Promise<void> {
    logger.log(`Processing ${event.Records.length} SQS messages`);

    const results: SQSProcessingResult[] = [];

    for (const record of event.Records) {
      try {
        const result = await this.processRecord(record);
        results.push(result);
        
        if (result.success) {
          logger.log(`Message ${result.messageId} processed successfully`);
        } else {
          logger.error(`Message ${result.messageId} failed: ${result.error}`);
        }
      } catch (error) {
        logger.error(`Error processing record ${record.messageId}:`, error);
        results.push({
          success: false,
          messageId: record.messageId,
          processedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
          retryable: true
        });
      }
    }

    // Log summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    logger.log(`SQS processing complete: ${successCount} success, ${failureCount} failures`);

    // If any message failed and is retryable, throw error to trigger retry
    const retryableFailures = results.filter(r => !r.success && r.retryable);
    if (retryableFailures.length > 0) {
      throw new Error(`${retryableFailures.length} messages failed and are retryable`);
    }
  }

  private async processRecord(record: SQSRecord): Promise<SQSProcessingResult> {
    const messageId = record.messageId;
    const processedAt = new Date().toISOString();

    try {
      // Parse message body
      const message: SQSMessage = JSON.parse(record.body);
      
      logger.log(`Processing message ${messageId} of type ${message.type}`);

      // Validate message structure
      this.validateMessage(message);

      // Route message based on type
      const result = await this.routeMessage(message);
      
      return {
        success: true,
        messageId,
        processedAt,
        ...result
      };
    } catch (error) {
      logger.error(`Failed to process message ${messageId}:`, error);
      
      return {
        success: false,
        messageId,
        processedAt,
        error: error instanceof Error ? error.message : String(error),
        retryable: this.isRetryableError(error)
      };
    }
  }

  private validateMessage(message: SQSMessage): void {
    if (!message.id || !message.type || !message.payload || !message.timestamp) {
      throw new Error('Invalid message structure: missing required fields');
    }

    // Validate timestamp format
    if (isNaN(Date.parse(message.timestamp))) {
      throw new Error('Invalid timestamp format');
    }

    // Validate message type
    const validTypes = ['sample.create', 'sample.update', 'sample.delete', 'notification.send', 'audit.log'];
    if (!validTypes.includes(message.type)) {
      throw new Error(`Invalid message type: ${message.type}`);
    }
  }

  private async routeMessage(message: SQSMessage): Promise<Partial<SQSProcessingResult>> {
    switch (message.type) {
      case 'sample.create':
        return await this.handleSampleCreate(message);
      case 'sample.update':
        return await this.handleSampleUpdate(message);
      case 'sample.delete':
        return await this.handleSampleDelete(message);
      case 'notification.send':
        return await this.handleNotificationSend(message);
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleSampleCreate(message: SQSMessage): Promise<Partial<SQSProcessingResult>> {
    logger.log(`Handling sample creation: ${JSON.stringify(message.payload)}`);
    
    // Here you would integrate with your NestJS services
    // For now, we'll simulate processing
    await this.simulateProcessing();
    
    return { success: true };
  }

  private async handleSampleUpdate(message: SQSMessage): Promise<Partial<SQSProcessingResult>> {
    logger.log(`Handling sample update: ${JSON.stringify(message.payload)}`);
    
    await this.simulateProcessing();
    
    return { success: true };
  }

  private async handleSampleDelete(message: SQSMessage): Promise<Partial<SQSProcessingResult>> {
    logger.log(`Handling sample deletion: ${JSON.stringify(message.payload)}`);
    
    await this.simulateProcessing();
    
    return { success: true };
  }

  private async handleNotificationSend(message: SQSMessage): Promise<Partial<SQSProcessingResult>> {
    logger.log(`Handling notification: ${JSON.stringify(message.payload)}`);
    
    await this.simulateProcessing();
    
    return { success: true };
  }

  private async simulateProcessing(): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private isRetryableError(error: any): boolean {
    // Define which errors should trigger retry
    const retryableErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'Database connection failed',
      'Service temporarily unavailable'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }
}

// Export handler function for Lambda
export const sqsHandler = async (event: SQSEvent, context: Context): Promise<void> => {
  const handler = SQSMessageHandler.getInstance();
  return handler.processSQSEvent(event, context);
};
