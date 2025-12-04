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
                    message: error.message,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cC5oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUF3QztBQUV4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUV6QyxNQUFhLGtCQUFrQjtJQUk3QixNQUFNLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakMsa0JBQWtCLENBQUMsUUFBUSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUN6RCxDQUFDO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7SUFDckMsQ0FBQztJQUVELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUFZO1FBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7SUFDbEMsQ0FBQztJQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUEyQixFQUFFLE9BQWdCO1FBQ2xFLE1BQU0sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFFekUsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUV4RSxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE1BQU0sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUMsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtvQkFDbEMsNkJBQTZCLEVBQUUsR0FBRztvQkFDbEMsOEJBQThCLEVBQUUsNkJBQTZCO29CQUM3RCw4QkFBOEIsRUFBRSxpQ0FBaUM7aUJBQ2xFO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQixLQUFLLEVBQUUsdUJBQXVCO29CQUM5QixPQUFPLEVBQUcsS0FBYSxDQUFDLE9BQU87b0JBQy9CLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtpQkFDcEMsQ0FBQzthQUNILENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBOUNELGdEQThDQztBQUVELHFDQUFxQztBQUM5QixNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBRSxPQUFnQixFQUFrQyxFQUFFO0lBQ2pILE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2pELE9BQU8sT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUM7QUFIVyxRQUFBLFdBQVcsZUFHdEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0LCBDb250ZXh0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0hUVFBIYW5kbGVyJyk7XG5cbmV4cG9ydCBjbGFzcyBIVFRQTWVzc2FnZUhhbmRsZXIge1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSFRUUE1lc3NhZ2VIYW5kbGVyO1xuICBwcml2YXRlIGF3c0xhbWJkYUhhbmRsZXI6IGFueTtcblxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogSFRUUE1lc3NhZ2VIYW5kbGVyIHtcbiAgICBpZiAoIUhUVFBNZXNzYWdlSGFuZGxlci5pbnN0YW5jZSkge1xuICAgICAgSFRUUE1lc3NhZ2VIYW5kbGVyLmluc3RhbmNlID0gbmV3IEhUVFBNZXNzYWdlSGFuZGxlcigpO1xuICAgIH1cbiAgICByZXR1cm4gSFRUUE1lc3NhZ2VIYW5kbGVyLmluc3RhbmNlO1xuICB9XG5cbiAgYXN5bmMgc2V0QXdzTGFtYmRhSGFuZGxlcihoYW5kbGVyOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmF3c0xhbWJkYUhhbmRsZXIgPSBoYW5kbGVyO1xuICB9XG5cbiAgYXN5bmMgcHJvY2Vzc0hUVFBFdmVudChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICAgIGxvZ2dlci5sb2coYFByb2Nlc3NpbmcgSFRUUCByZXF1ZXN0OiAke2V2ZW50Lmh0dHBNZXRob2R9ICR7ZXZlbnQucGF0aH1gKTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuYXdzTGFtYmRhSGFuZGxlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FXUyBMYW1iZGEgaGFuZGxlciBub3QgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hd3NMYW1iZGFIYW5kbGVyKGV2ZW50LCBjb250ZXh0KTtcbiAgICAgIGxvZ2dlci5sb2coYEhUVFAgcmVxdWVzdCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5OiAke3Jlc3VsdC5zdGF0dXNDb2RlfWApO1xuICAgICAgXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoYEhUVFAgcmVxdWVzdCBmYWlsZWQ6YCwgZXJyb3IpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJ1xuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgZXJyb3I6ICdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6IChlcnJvciBhcyBhbnkpLm1lc3NhZ2UsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfSlcbiAgICAgIH07XG4gICAgfVxuICB9XG59XG5cbi8vIEV4cG9ydCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBMYW1iZGFcbmV4cG9ydCBjb25zdCBodHRwSGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICBjb25zdCBoYW5kbGVyID0gSFRUUE1lc3NhZ2VIYW5kbGVyLmdldEluc3RhbmNlKCk7XG4gIHJldHVybiBoYW5kbGVyLnByb2Nlc3NIVFRQRXZlbnQoZXZlbnQsIGNvbnRleHQpO1xufTtcbiJdfQ==