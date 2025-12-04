"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqsHandler = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const sqs_1 = require("../modules/sqs");
const logger = new common_1.Logger('SQSHandler');
let appContext = null;
const sqsHandler = async (event, context) => {
    logger.log(`Processing ${event.Records.length} SQS messages`);
    try {
        if (!appContext) {
            logger.log('Creating NestJS application context...');
            appContext = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
            logger.log('NestJS application context created successfully');
        }
        const sqsConsumer = appContext.get(sqs_1.SQSConsumerService);
        if (!sqsConsumer) {
            throw new Error('SQSConsumerService not found in application context');
        }
        for (const record of event.Records) {
            try {
                logger.log(`Processing message ${record.messageId}`);
                await sqsConsumer.processMessage(record);
                logger.log(`Message ${record.messageId} processed successfully`);
            }
            catch (error) {
                logger.error(`Error processing message ${record.messageId}: ${error.message}`, error.stack);
                throw error;
            }
        }
        logger.log(`SQS processing complete: ${event.Records.length} messages processed`);
    }
    catch (error) {
        logger.error(`Error in SQS handler: ${error.message}`, error.stack);
        throw error;
    }
};
exports.sqsHandler = sqsHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLmhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcXMuaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwyQ0FBd0M7QUFDeEMsdUNBQTJDO0FBQzNDLDhDQUEwQztBQUMxQyx3Q0FBb0Q7QUFFcEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFeEMsSUFBSSxVQUFVLEdBQVEsSUFBSSxDQUFDO0FBRXBCLE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxLQUFlLEVBQUUsT0FBZ0IsRUFBaUIsRUFBRTtJQUNuRixNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLGVBQWUsQ0FBQyxDQUFDO0lBRTlELElBQUksQ0FBQztRQUNILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDckQsVUFBVSxHQUFHLE1BQU0sa0JBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBUyxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLHdCQUFrQixDQUFDLENBQUM7UUFFdkQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDO2dCQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxNQUFNLENBQUMsU0FBUyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO2dCQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixNQUFNLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVGLE1BQU0sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0scUJBQXFCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixNQUFNLENBQUMsS0FBSyxDQUFDLHlCQUF5QixLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sS0FBSyxDQUFDO0lBQ2QsQ0FBQztBQUNILENBQUMsQ0FBQztBQWhDVyxRQUFBLFVBQVUsY0FnQ3JCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU1FTRXZlbnQsIENvbnRleHQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBOZXN0RmFjdG9yeSB9IGZyb20gJ0BuZXN0anMvY29yZSc7XHJcbmltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4uL2FwcC5tb2R1bGUnO1xyXG5pbXBvcnQgeyBTUVNDb25zdW1lclNlcnZpY2UgfSBmcm9tICcuLi9tb2R1bGVzL3Nxcyc7XHJcblxyXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdTUVNIYW5kbGVyJyk7XHJcblxyXG5sZXQgYXBwQ29udGV4dDogYW55ID0gbnVsbDtcclxuXHJcbmV4cG9ydCBjb25zdCBzcXNIYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBTUVNFdmVudCwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8dm9pZD4gPT4ge1xyXG4gIGxvZ2dlci5sb2coYFByb2Nlc3NpbmcgJHtldmVudC5SZWNvcmRzLmxlbmd0aH0gU1FTIG1lc3NhZ2VzYCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBpZiAoIWFwcENvbnRleHQpIHtcclxuICAgICAgbG9nZ2VyLmxvZygnQ3JlYXRpbmcgTmVzdEpTIGFwcGxpY2F0aW9uIGNvbnRleHQuLi4nKTtcclxuICAgICAgYXBwQ29udGV4dCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZUFwcGxpY2F0aW9uQ29udGV4dChBcHBNb2R1bGUpO1xyXG4gICAgICBsb2dnZXIubG9nKCdOZXN0SlMgYXBwbGljYXRpb24gY29udGV4dCBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNxc0NvbnN1bWVyID0gYXBwQ29udGV4dC5nZXQoU1FTQ29uc3VtZXJTZXJ2aWNlKTtcclxuXHJcbiAgICBpZiAoIXNxc0NvbnN1bWVyKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU1FTQ29uc3VtZXJTZXJ2aWNlIG5vdCBmb3VuZCBpbiBhcHBsaWNhdGlvbiBjb250ZXh0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGxvZ2dlci5sb2coYFByb2Nlc3NpbmcgbWVzc2FnZSAke3JlY29yZC5tZXNzYWdlSWR9YCk7XHJcbiAgICAgICAgYXdhaXQgc3FzQ29uc3VtZXIucHJvY2Vzc01lc3NhZ2UocmVjb3JkKTtcclxuICAgICAgICBsb2dnZXIubG9nKGBNZXNzYWdlICR7cmVjb3JkLm1lc3NhZ2VJZH0gcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseWApO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgbG9nZ2VyLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIG1lc3NhZ2UgJHtyZWNvcmQubWVzc2FnZUlkfTogJHtlcnJvci5tZXNzYWdlfWAsIGVycm9yLnN0YWNrKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxvZ2dlci5sb2coYFNRUyBwcm9jZXNzaW5nIGNvbXBsZXRlOiAke2V2ZW50LlJlY29yZHMubGVuZ3RofSBtZXNzYWdlcyBwcm9jZXNzZWRgKTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBsb2dnZXIuZXJyb3IoYEVycm9yIGluIFNRUyBoYW5kbGVyOiAke2Vycm9yLm1lc3NhZ2V9YCwgZXJyb3Iuc3RhY2spO1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfVxyXG59O1xyXG4iXX0=