import { SQSEvent, Context } from 'aws-lambda';
export declare class SQSMessageHandler {
    private static instance;
    static getInstance(): SQSMessageHandler;
    processSQSEvent(event: SQSEvent, context: Context): Promise<void>;
    private processRecord;
    private validateMessage;
    private routeMessage;
    private handleSampleCreate;
    private handleSampleUpdate;
    private handleSampleDelete;
    private handleNotificationSend;
    private simulateProcessing;
    private isRetryableError;
}
export declare const sqsHandler: (event: SQSEvent, context: Context) => Promise<void>;
