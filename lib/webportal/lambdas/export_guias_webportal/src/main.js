"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const morgan_1 = __importDefault(require("morgan"));
const app_module_1 = require("./app.module");
const compression_1 = __importDefault(require("compression"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet = require('helmet');
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    app.use(helmet());
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)('combined'));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    // Swagger (v4, compatible con Nest v7)
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Aduanas Service')
        .setDescription('Microservicio NestJS con TypeORM, JWT y Swagger')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const swaggerDoc = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, swaggerDoc, {
        swaggerOptions: {
            persistAuthorization: true,
            cache: false, // Deshabilitar cache
        },
        customSiteTitle: 'Aduanas Service API Docs',
    });
    // Health
    app.use('/api/health', (req, res) => {
        res.json({ status: 'OK', ts: new Date().toISOString() });
    });
    const port = process.env.PORT || 3002;
    await app.listen(port);
    logger.log(`Server http://localhost:${port}`);
    logger.log(`Docs   http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsb0RBQTRCO0FBQzVCLDZDQUF5QztBQUN6Qyw4REFBc0M7QUFDdEMsdUNBQTJDO0FBQzNDLDJDQUF3RDtBQUN4RCw2Q0FBaUU7QUFFakUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLEtBQUssVUFBVSxTQUFTO0lBQ3RCLE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQVMsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXZDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNsQixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUEscUJBQVcsR0FBRSxDQUFDLENBQUM7SUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGdCQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUU1QixHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksdUJBQWMsQ0FBQztRQUNwQyxTQUFTLEVBQUUsSUFBSTtRQUNmLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsU0FBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQyxDQUFDLENBQUM7SUFFSixHQUFHLENBQUMsVUFBVSxDQUFDO1FBQ2IsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUc7UUFDdEMsV0FBVyxFQUFFLElBQUk7UUFDakIsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDN0QsY0FBYyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQztLQUN0RSxDQUFDLENBQUM7SUFFSCx1Q0FBdUM7SUFDdkMsTUFBTSxhQUFhLEdBQUcsSUFBSSx5QkFBZSxFQUFFO1NBQ3hDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztTQUMzQixjQUFjLENBQUMsaURBQWlELENBQUM7U0FDakUsVUFBVSxDQUFDLE9BQU8sQ0FBQztTQUNuQixhQUFhLEVBQUU7U0FDZixLQUFLLEVBQUUsQ0FBQztJQUNYLE1BQU0sVUFBVSxHQUFHLHVCQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNwRSx1QkFBYSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRTtRQUMvQyxjQUFjLEVBQUU7WUFDZCxvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLEtBQUssRUFBRSxLQUFLLEVBQUUscUJBQXFCO1NBQ3BDO1FBQ0QsZUFBZSxFQUFFLDBCQUEwQjtLQUM1QyxDQUFDLENBQUM7SUFFSCxTQUFTO0lBQ1QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFRLEVBQUUsR0FBUSxFQUFFLEVBQUU7UUFDNUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFjLENBQUMsQ0FBQztJQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLDJCQUEyQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLElBQUksV0FBVyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVELFNBQVMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCBtb3JnYW4gZnJvbSAnbW9yZ2FuJztcbmltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwLm1vZHVsZSc7XG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSAnY29tcHJlc3Npb24nO1xuaW1wb3J0IHsgTmVzdEZhY3RvcnkgfSBmcm9tICdAbmVzdGpzL2NvcmUnO1xuaW1wb3J0IHsgVmFsaWRhdGlvblBpcGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7IFN3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlciB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5cbmNvbnN0IGhlbG1ldCA9IHJlcXVpcmUoJ2hlbG1ldCcpO1xuXG5hc3luYyBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gIGNvbnN0IGFwcCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZShBcHBNb2R1bGUpO1xuICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdCb290c3RyYXAnKTtcblxuICBhcHAudXNlKGhlbG1ldCgpKTtcbiAgYXBwLnVzZShjb21wcmVzc2lvbigpKTtcbiAgYXBwLnVzZShtb3JnYW4oJ2NvbWJpbmVkJykpO1xuXG4gIGFwcC51c2VHbG9iYWxQaXBlcyhuZXcgVmFsaWRhdGlvblBpcGUoe1xuICAgIHdoaXRlbGlzdDogdHJ1ZSxcbiAgICBmb3JiaWROb25XaGl0ZWxpc3RlZDogdHJ1ZSxcbiAgICB0cmFuc2Zvcm06IHRydWUsXG4gIH0pKTtcblxuICBhcHAuZW5hYmxlQ29ycyh7XG4gICAgb3JpZ2luOiBwcm9jZXNzLmVudi5DT1JTX09SSUdJTiB8fCAnKicsXG4gICAgY3JlZGVudGlhbHM6IHRydWUsXG4gICAgbWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ1BBVENIJywgJ09QVElPTlMnXSxcbiAgICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdYLVJlcXVlc3RlZC1XaXRoJ10sXG4gIH0pO1xuXG4gIC8vIFN3YWdnZXIgKHY0LCBjb21wYXRpYmxlIGNvbiBOZXN0IHY3KVxuICBjb25zdCBzd2FnZ2VyQ29uZmlnID0gbmV3IERvY3VtZW50QnVpbGRlcigpXG4gICAgLnNldFRpdGxlKCdBZHVhbmFzIFNlcnZpY2UnKVxuICAgIC5zZXREZXNjcmlwdGlvbignTWljcm9zZXJ2aWNpbyBOZXN0SlMgY29uIFR5cGVPUk0sIEpXVCB5IFN3YWdnZXInKVxuICAgIC5zZXRWZXJzaW9uKCcxLjAuMCcpXG4gICAgLmFkZEJlYXJlckF1dGgoKVxuICAgIC5idWlsZCgpO1xuICBjb25zdCBzd2FnZ2VyRG9jID0gU3dhZ2dlck1vZHVsZS5jcmVhdGVEb2N1bWVudChhcHAsIHN3YWdnZXJDb25maWcpO1xuICBTd2FnZ2VyTW9kdWxlLnNldHVwKCdhcGkvZG9jcycsIGFwcCwgc3dhZ2dlckRvYywge1xuICAgIHN3YWdnZXJPcHRpb25zOiB7XG4gICAgICBwZXJzaXN0QXV0aG9yaXphdGlvbjogdHJ1ZSxcbiAgICAgIGNhY2hlOiBmYWxzZSwgLy8gRGVzaGFiaWxpdGFyIGNhY2hlXG4gICAgfSxcbiAgICBjdXN0b21TaXRlVGl0bGU6ICdBZHVhbmFzIFNlcnZpY2UgQVBJIERvY3MnLFxuICB9KTtcblxuICAvLyBIZWFsdGhcbiAgYXBwLnVzZSgnL2FwaS9oZWFsdGgnLCAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgcmVzLmpzb24oeyBzdGF0dXM6ICdPSycsIHRzOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDI7XG4gIGF3YWl0IGFwcC5saXN0ZW4ocG9ydCBhcyBudW1iZXIpO1xuICBsb2dnZXIubG9nKGBTZXJ2ZXIgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YCk7XG4gIGxvZ2dlci5sb2coYERvY3MgICBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vYXBpL2RvY3NgKTtcbn1cblxuYm9vdHN0cmFwKCk7Il19