import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare class HTTPMessageHandler {
    private static instance;
    private awsLambdaHandler;
    static getInstance(): HTTPMessageHandler;
    setAwsLambdaHandler(handler: any): Promise<void>;
    processHTTPEvent(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>;
}
export declare const httpHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
