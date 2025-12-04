import { SQSService } from '../service/sqs.service';
import { TypedSQSMessage } from '../interfaces/sqs-message.interface';
export declare class SQSController {
    private readonly sqsService;
    constructor(sqsService: SQSService);
    getHealth(): Promise<import("../interfaces/sqs-message.interface").SQSHealthCheck>;
    getMetrics(): import("../interfaces/sqs-message.interface").SQSMetrics;
    testMessage(message: TypedSQSMessage): Promise<import("../interfaces/sqs-message.interface").SQSProcessingResult>;
    resetMetrics(): {
        message: string;
    };
}
