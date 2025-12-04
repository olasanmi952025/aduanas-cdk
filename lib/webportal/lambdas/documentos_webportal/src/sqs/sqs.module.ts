import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SQSService } from '../service/sqs.service';
import { ServiceModule } from '../service/service.module';
import { SQSController } from './sqs.controller';

@Module({
  imports: [
    ConfigModule,
    ServiceModule,
  ],
  providers: [SQSService],
  controllers: [SQSController],
  exports: [SQSService],
})
export class SQSModule {}

