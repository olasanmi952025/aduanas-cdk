import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSConsumerService } from './modules/sqs';
export declare class AppModule implements OnModuleInit {
    private readonly sqsConsumer;
    private readonly configService;
    constructor(sqsConsumer: SQSConsumerService, configService: ConfigService);
    onModuleInit(): Promise<void>;
}
