import { SQSConsumerService } from './sqs-consumer.service';
export declare class SQSConsumerController {
    private readonly sqsConsumer;
    constructor(sqsConsumer: SQSConsumerService);
    consumeMessage(): Promise<{
        success: boolean;
        message: string;
        hasMessage: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        hasMessage?: undefined;
    }>;
    startListener(): Promise<{
        success: boolean;
        message: string;
    }>;
    stopListener(): {
        success: boolean;
        message: string;
    };
    getStatus(): {
        queueUrl: string;
        isListening: boolean;
        success: boolean;
    };
}
