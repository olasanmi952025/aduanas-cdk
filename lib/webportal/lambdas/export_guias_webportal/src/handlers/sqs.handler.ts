import { SQSEvent, Context } from 'aws-lambda';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SQSConsumerService } from '../modules/sqs';

const logger = new Logger('SQSHandler');

let appContext: any = null;

export const sqsHandler = async (event: SQSEvent, context: Context): Promise<void> => {
  logger.log(`Processing ${event.Records.length} SQS messages`);

  try {
    if (!appContext) {
      logger.log('Creating NestJS application context...');
      appContext = await NestFactory.createApplicationContext(AppModule);
      logger.log('NestJS application context created successfully');
    }

    const sqsConsumer = appContext.get(SQSConsumerService);

    if (!sqsConsumer) {
      throw new Error('SQSConsumerService not found in application context');
    }

    for (const record of event.Records) {
      try {
        logger.log(`Processing message ${record.messageId}`);
        await sqsConsumer.processMessage(record);
        logger.log(`Message ${record.messageId} processed successfully`);
      } catch (error: any) {
        logger.error(`Error processing message ${record.messageId}: ${error.message}`, error.stack);
        throw error;
      }
    }

    logger.log(`SQS processing complete: ${event.Records.length} messages processed`);
  } catch (error: any) {
    logger.error(`Error in SQS handler: ${error.message}`, error.stack);
    throw error;
  }
};
