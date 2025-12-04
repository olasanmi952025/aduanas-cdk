import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
/**
 * Handler principal de la lambda
 */
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
