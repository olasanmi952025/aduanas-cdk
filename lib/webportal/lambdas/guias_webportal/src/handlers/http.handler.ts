import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@nestjs/common';

const logger = new Logger('HTTPHandler');

export class HTTPMessageHandler {
  private static instance: HTTPMessageHandler;
  private awsLambdaHandler: any;

  static getInstance(): HTTPMessageHandler {
    if (!HTTPMessageHandler.instance) {
      HTTPMessageHandler.instance = new HTTPMessageHandler();
    }
    return HTTPMessageHandler.instance;
  }

  async setAwsLambdaHandler(handler: any): Promise<void> {
    this.awsLambdaHandler = handler;
  }

  async processHTTPEvent(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    logger.log(`Processing HTTP request: ${event.httpMethod} ${event.path}`);

    try {
      if (!this.awsLambdaHandler) {
        throw new Error('AWS Lambda handler not initialized');
      }

      const result = await this.awsLambdaHandler(event, context);
      logger.log(`HTTP request processed successfully: ${result.statusCode}`);
      
      return result;
    } catch (error) {
      logger.error(`HTTP request failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: errorMessage,
          timestamp: new Date().toISOString()
        })
      };
    }
  }
}

// Export handler function for Lambda
export const httpHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const handler = HTTPMessageHandler.getInstance();
  return handler.processHTTPEvent(event, context);
};
