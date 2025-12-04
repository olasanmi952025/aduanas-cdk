import { AWSModule } from '../aws';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SQSProducerService } from './sqs-producer.service';

@Module({
  imports: [
    ConfigModule,
    AWSModule,
  ],
  providers: [SQSProducerService],
  exports: [SQSProducerService],
})
export class SQSModule {}

