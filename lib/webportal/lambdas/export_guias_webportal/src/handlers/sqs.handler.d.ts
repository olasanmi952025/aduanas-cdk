import { SQSEvent, Context } from 'aws-lambda';
export declare const sqsHandler: (event: SQSEvent, context: Context) => Promise<void>;
