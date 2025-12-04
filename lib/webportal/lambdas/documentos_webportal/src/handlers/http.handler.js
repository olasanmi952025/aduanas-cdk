"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpHandler = exports.HTTPMessageHandler = void 0;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('HTTPHandler');
class HTTPMessageHandler {
    static getInstance() {
        if (!HTTPMessageHandler.instance) {
            HTTPMessageHandler.instance = new HTTPMessageHandler();
        }
        return HTTPMessageHandler.instance;
    }
    async setAwsLambdaHandler(handler) {
        this.awsLambdaHandler = handler;
    }
    async processHTTPEvent(event, context) {
        logger.log(`Processing HTTP request: ${event.httpMethod} ${event.path}`);
        try {
            if (!this.awsLambdaHandler) {
                throw new Error('AWS Lambda handler not initialized');
            }
            const result = await this.awsLambdaHandler(event, context);
            logger.log(`HTTP request processed successfully: ${result.statusCode}`);
            return result;
        }
        catch (error) {
            logger.error(`HTTP request failed:`, error);
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
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
}
exports.HTTPMessageHandler = HTTPMessageHandler;
// Export handler function for Lambda
const httpHandler = async (event, context) => {
    const handler = HTTPMessageHandler.getInstance();
    return handler.processHTTPEvent(event, context);
};
exports.httpHandler = httpHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cC5oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUF3QztBQUV4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUV6QyxNQUFhLGtCQUFrQjtJQUk3QixNQUFNLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakMsa0JBQWtCLENBQUMsUUFBUSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUN6RCxDQUFDO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7SUFDckMsQ0FBQztJQUVELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUFZO1FBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7SUFDbEMsQ0FBQztJQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUEyQixFQUFFLE9BQWdCO1FBQ2xFLE1BQU0sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFFekUsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUV4RSxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUMsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztvQkFDbEMsOEJBQThCLEVBQUUsNkJBQTZCO29CQUM3RCw4QkFBOEIsRUFBRSxpQ0FBaUM7aUJBQ2xFO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQixLQUFLLEVBQUUsdUJBQXVCO29CQUM5QixPQUFPLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztvQkFDL0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2lCQUNwQyxDQUFDO2FBQ0gsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUE5Q0QsZ0RBOENDO0FBRUQscUNBQXFDO0FBQzlCLE1BQU0sV0FBVyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFFLE9BQWdCLEVBQWtDLEVBQUU7SUFDakgsTUFBTSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDakQsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2xELENBQUMsQ0FBQztBQUhXLFFBQUEsV0FBVyxlQUd0QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQsIENvbnRleHQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5cclxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignSFRUUEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIVFRQTWVzc2FnZUhhbmRsZXIge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBIVFRQTWVzc2FnZUhhbmRsZXI7XHJcbiAgcHJpdmF0ZSBhd3NMYW1iZGFIYW5kbGVyOiBhbnk7XHJcblxyXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBIVFRQTWVzc2FnZUhhbmRsZXIge1xyXG4gICAgaWYgKCFIVFRQTWVzc2FnZUhhbmRsZXIuaW5zdGFuY2UpIHtcclxuICAgICAgSFRUUE1lc3NhZ2VIYW5kbGVyLmluc3RhbmNlID0gbmV3IEhUVFBNZXNzYWdlSGFuZGxlcigpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEhUVFBNZXNzYWdlSGFuZGxlci5pbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHNldEF3c0xhbWJkYUhhbmRsZXIoaGFuZGxlcjogYW55KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0aGlzLmF3c0xhbWJkYUhhbmRsZXIgPSBoYW5kbGVyO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgcHJvY2Vzc0hUVFBFdmVudChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xyXG4gICAgbG9nZ2VyLmxvZyhgUHJvY2Vzc2luZyBIVFRQIHJlcXVlc3Q6ICR7ZXZlbnQuaHR0cE1ldGhvZH0gJHtldmVudC5wYXRofWApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGlmICghdGhpcy5hd3NMYW1iZGFIYW5kbGVyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBV1MgTGFtYmRhIGhhbmRsZXIgbm90IGluaXRpYWxpemVkJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXdzTGFtYmRhSGFuZGxlcihldmVudCwgY29udGV4dCk7XHJcbiAgICAgIGxvZ2dlci5sb2coYEhUVFAgcmVxdWVzdCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5OiAke3Jlc3VsdC5zdGF0dXNDb2RlfWApO1xyXG4gICAgICBcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGxvZ2dlci5lcnJvcihgSFRUUCByZXF1ZXN0IGZhaWxlZDpgLCBlcnJvcik7XHJcbiAgICAgIFxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcclxuICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXHJcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgZXJyb3I6ICdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InLFxyXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxyXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICB9KVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy8gRXhwb3J0IGhhbmRsZXIgZnVuY3Rpb24gZm9yIExhbWJkYVxyXG5leHBvcnQgY29uc3QgaHR0cEhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcclxuICBjb25zdCBoYW5kbGVyID0gSFRUUE1lc3NhZ2VIYW5kbGVyLmdldEluc3RhbmNlKCk7XHJcbiAgcmV0dXJuIGhhbmRsZXIucHJvY2Vzc0hUVFBFdmVudChldmVudCwgY29udGV4dCk7XHJcbn07XHJcbiJdfQ==