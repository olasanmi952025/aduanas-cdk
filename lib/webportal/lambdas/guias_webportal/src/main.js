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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsb0RBQTRCO0FBQzVCLDZDQUF5QztBQUN6Qyw4REFBc0M7QUFDdEMsdUNBQTJDO0FBQzNDLDJDQUF3RDtBQUN4RCw2Q0FBaUU7QUFFakUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLEtBQUssVUFBVSxTQUFTO0lBQ3RCLE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQVMsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXZDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNsQixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUEscUJBQVcsR0FBRSxDQUFDLENBQUM7SUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGdCQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUU1QixHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksdUJBQWMsQ0FBQztRQUNwQyxTQUFTLEVBQUUsSUFBSTtRQUNmLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsU0FBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQyxDQUFDLENBQUM7SUFFSixHQUFHLENBQUMsVUFBVSxDQUFDO1FBQ2IsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEdBQUc7UUFDdEMsV0FBVyxFQUFFLElBQUk7UUFDakIsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDN0QsY0FBYyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQztLQUN0RSxDQUFDLENBQUM7SUFFSCx1Q0FBdUM7SUFDdkMsTUFBTSxhQUFhLEdBQUcsSUFBSSx5QkFBZSxFQUFFO1NBQ3hDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztTQUMzQixjQUFjLENBQUMsaURBQWlELENBQUM7U0FDakUsVUFBVSxDQUFDLE9BQU8sQ0FBQztTQUNuQixhQUFhLEVBQUU7U0FDZixLQUFLLEVBQUUsQ0FBQztJQUNYLE1BQU0sVUFBVSxHQUFHLHVCQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNwRSx1QkFBYSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRTtRQUMvQyxjQUFjLEVBQUU7WUFDZCxvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLEtBQUssRUFBRSxLQUFLLEVBQUUscUJBQXFCO1NBQ3BDO1FBQ0QsZUFBZSxFQUFFLDBCQUEwQjtLQUM1QyxDQUFDLENBQUM7SUFFSCxTQUFTO0lBQ1QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFRLEVBQUUsR0FBUSxFQUFFLEVBQUU7UUFDNUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFjLENBQUMsQ0FBQztJQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLDJCQUEyQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLElBQUksV0FBVyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVELFNBQVMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcclxuaW1wb3J0IG1vcmdhbiBmcm9tICdtb3JnYW4nO1xyXG5pbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC5tb2R1bGUnO1xyXG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSAnY29tcHJlc3Npb24nO1xyXG5pbXBvcnQgeyBOZXN0RmFjdG9yeSB9IGZyb20gJ0BuZXN0anMvY29yZSc7XHJcbmltcG9ydCB7IFZhbGlkYXRpb25QaXBlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFN3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlciB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XHJcblxyXG5jb25zdCBoZWxtZXQgPSByZXF1aXJlKCdoZWxtZXQnKTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcclxuICBjb25zdCBhcHAgPSBhd2FpdCBOZXN0RmFjdG9yeS5jcmVhdGUoQXBwTW9kdWxlKTtcclxuICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdCb290c3RyYXAnKTtcclxuXHJcbiAgYXBwLnVzZShoZWxtZXQoKSk7XHJcbiAgYXBwLnVzZShjb21wcmVzc2lvbigpKTtcclxuICBhcHAudXNlKG1vcmdhbignY29tYmluZWQnKSk7XHJcblxyXG4gIGFwcC51c2VHbG9iYWxQaXBlcyhuZXcgVmFsaWRhdGlvblBpcGUoe1xyXG4gICAgd2hpdGVsaXN0OiB0cnVlLFxyXG4gICAgZm9yYmlkTm9uV2hpdGVsaXN0ZWQ6IHRydWUsXHJcbiAgICB0cmFuc2Zvcm06IHRydWUsXHJcbiAgfSkpO1xyXG5cclxuICBhcHAuZW5hYmxlQ29ycyh7XHJcbiAgICBvcmlnaW46IHByb2Nlc3MuZW52LkNPUlNfT1JJR0lOIHx8ICcqJyxcclxuICAgIGNyZWRlbnRpYWxzOiB0cnVlLFxyXG4gICAgbWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ1BBVENIJywgJ09QVElPTlMnXSxcclxuICAgIGFsbG93ZWRIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtUmVxdWVzdGVkLVdpdGgnXSxcclxuICB9KTtcclxuXHJcbiAgLy8gU3dhZ2dlciAodjQsIGNvbXBhdGlibGUgY29uIE5lc3QgdjcpXHJcbiAgY29uc3Qgc3dhZ2dlckNvbmZpZyA9IG5ldyBEb2N1bWVudEJ1aWxkZXIoKVxyXG4gICAgLnNldFRpdGxlKCdBZHVhbmFzIFNlcnZpY2UnKVxyXG4gICAgLnNldERlc2NyaXB0aW9uKCdNaWNyb3NlcnZpY2lvIE5lc3RKUyBjb24gVHlwZU9STSwgSldUIHkgU3dhZ2dlcicpXHJcbiAgICAuc2V0VmVyc2lvbignMS4wLjAnKVxyXG4gICAgLmFkZEJlYXJlckF1dGgoKVxyXG4gICAgLmJ1aWxkKCk7XHJcbiAgY29uc3Qgc3dhZ2dlckRvYyA9IFN3YWdnZXJNb2R1bGUuY3JlYXRlRG9jdW1lbnQoYXBwLCBzd2FnZ2VyQ29uZmlnKTtcclxuICBTd2FnZ2VyTW9kdWxlLnNldHVwKCdhcGkvZG9jcycsIGFwcCwgc3dhZ2dlckRvYywge1xyXG4gICAgc3dhZ2dlck9wdGlvbnM6IHtcclxuICAgICAgcGVyc2lzdEF1dGhvcml6YXRpb246IHRydWUsXHJcbiAgICAgIGNhY2hlOiBmYWxzZSwgLy8gRGVzaGFiaWxpdGFyIGNhY2hlXHJcbiAgICB9LFxyXG4gICAgY3VzdG9tU2l0ZVRpdGxlOiAnQWR1YW5hcyBTZXJ2aWNlIEFQSSBEb2NzJyxcclxuICB9KTtcclxuXHJcbiAgLy8gSGVhbHRoXHJcbiAgYXBwLnVzZSgnL2FwaS9oZWFsdGgnLCAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgICByZXMuanNvbih7IHN0YXR1czogJ09LJywgdHM6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KTtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMjtcclxuICBhd2FpdCBhcHAubGlzdGVuKHBvcnQgYXMgbnVtYmVyKTtcclxuICBsb2dnZXIubG9nKGBTZXJ2ZXIgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YCk7XHJcbiAgbG9nZ2VyLmxvZyhgRG9jcyAgIGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9hcGkvZG9jc2ApO1xyXG59XHJcblxyXG5ib290c3RyYXAoKTsiXX0=