"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
// import * as helmet from 'helmet';
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
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
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Server http://localhost:${port}`);
    logger.log(`Docs   http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsdUNBQTJDO0FBQzNDLDJDQUF3RDtBQUN4RCxvQ0FBb0M7QUFDcEMsOERBQXNDO0FBQ3RDLG9EQUE0QjtBQUM1Qiw2Q0FBaUU7QUFDakUsNkNBQXlDO0FBSXpDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUVqQyxLQUFLLFVBQVUsU0FBUztJQUN0QixNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFTLENBQUMsQ0FBQztJQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV2QyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHFCQUFXLEdBQUUsQ0FBQyxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSxnQkFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFFNUIsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHVCQUFjLENBQUM7UUFDcEMsU0FBUyxFQUFFLElBQUk7UUFDZixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLFNBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUMsQ0FBQyxDQUFDO0lBRUosR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUNiLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxHQUFHO1FBQ3RDLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDO1FBQzdELGNBQWMsRUFBRSxDQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLENBQUM7S0FDdEUsQ0FBQyxDQUFDO0lBRUgsdUNBQXVDO0lBQ3ZDLE1BQU0sYUFBYSxHQUFHLElBQUkseUJBQWUsRUFBRTtTQUN4QyxRQUFRLENBQUMsaUJBQWlCLENBQUM7U0FDM0IsY0FBYyxDQUFDLGlEQUFpRCxDQUFDO1NBQ2pFLFVBQVUsQ0FBQyxPQUFPLENBQUM7U0FDbkIsYUFBYSxFQUFFO1NBQ2YsS0FBSyxFQUFFLENBQUM7SUFDWCxNQUFNLFVBQVUsR0FBRyx1QkFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDcEUsdUJBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUU7UUFDL0MsY0FBYyxFQUFFO1lBQ2Qsb0JBQW9CLEVBQUUsSUFBSTtZQUMxQixLQUFLLEVBQUUsS0FBSyxFQUFFLHFCQUFxQjtTQUNwQztRQUNELGVBQWUsRUFBRSwwQkFBMEI7S0FDNUMsQ0FBQyxDQUFDO0lBRUgsU0FBUztJQUNULEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBUSxFQUFFLEdBQVEsRUFBRSxFQUFFO1FBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztJQUN0QyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBYyxDQUFDLENBQUM7SUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM5QyxNQUFNLENBQUMsR0FBRyxDQUFDLDJCQUEyQixJQUFJLFdBQVcsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRCxTQUFTLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XHJcbmltcG9ydCB7IE5lc3RGYWN0b3J5IH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcclxuaW1wb3J0IHsgVmFsaWRhdGlvblBpcGUsIExvZ2dlciB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuLy8gaW1wb3J0ICogYXMgaGVsbWV0IGZyb20gJ2hlbG1ldCc7XHJcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICdjb21wcmVzc2lvbic7XHJcbmltcG9ydCBtb3JnYW4gZnJvbSAnbW9yZ2FuJztcclxuaW1wb3J0IHsgU3dhZ2dlck1vZHVsZSwgRG9jdW1lbnRCdWlsZGVyIH0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcclxuaW1wb3J0IHsgQXBwTW9kdWxlIH0gZnJvbSAnLi9hcHAubW9kdWxlJztcclxuXHJcblxyXG5cclxuY29uc3QgaGVsbWV0ID0gcmVxdWlyZSgnaGVsbWV0Jyk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBib290c3RyYXAoKSB7XHJcbiAgY29uc3QgYXBwID0gYXdhaXQgTmVzdEZhY3RvcnkuY3JlYXRlKEFwcE1vZHVsZSk7XHJcbiAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignQm9vdHN0cmFwJyk7XHJcblxyXG4gIGFwcC51c2UoaGVsbWV0KCkpO1xyXG4gIGFwcC51c2UoY29tcHJlc3Npb24oKSk7XHJcbiAgYXBwLnVzZShtb3JnYW4oJ2NvbWJpbmVkJykpO1xyXG5cclxuICBhcHAudXNlR2xvYmFsUGlwZXMobmV3IFZhbGlkYXRpb25QaXBlKHtcclxuICAgIHdoaXRlbGlzdDogdHJ1ZSxcclxuICAgIGZvcmJpZE5vbldoaXRlbGlzdGVkOiB0cnVlLFxyXG4gICAgdHJhbnNmb3JtOiB0cnVlLFxyXG4gIH0pKTtcclxuXHJcbiAgYXBwLmVuYWJsZUNvcnMoe1xyXG4gICAgb3JpZ2luOiBwcm9jZXNzLmVudi5DT1JTX09SSUdJTiB8fCAnKicsXHJcbiAgICBjcmVkZW50aWFsczogdHJ1ZSxcclxuICAgIG1ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnUFVUJywgJ0RFTEVURScsICdQQVRDSCcsICdPUFRJT05TJ10sXHJcbiAgICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdYLVJlcXVlc3RlZC1XaXRoJ10sXHJcbiAgfSk7XHJcblxyXG4gIC8vIFN3YWdnZXIgKHY0LCBjb21wYXRpYmxlIGNvbiBOZXN0IHY3KVxyXG4gIGNvbnN0IHN3YWdnZXJDb25maWcgPSBuZXcgRG9jdW1lbnRCdWlsZGVyKClcclxuICAgIC5zZXRUaXRsZSgnQWR1YW5hcyBTZXJ2aWNlJylcclxuICAgIC5zZXREZXNjcmlwdGlvbignTWljcm9zZXJ2aWNpbyBOZXN0SlMgY29uIFR5cGVPUk0sIEpXVCB5IFN3YWdnZXInKVxyXG4gICAgLnNldFZlcnNpb24oJzEuMC4wJylcclxuICAgIC5hZGRCZWFyZXJBdXRoKClcclxuICAgIC5idWlsZCgpO1xyXG4gIGNvbnN0IHN3YWdnZXJEb2MgPSBTd2FnZ2VyTW9kdWxlLmNyZWF0ZURvY3VtZW50KGFwcCwgc3dhZ2dlckNvbmZpZyk7XHJcbiAgU3dhZ2dlck1vZHVsZS5zZXR1cCgnYXBpL2RvY3MnLCBhcHAsIHN3YWdnZXJEb2MsIHtcclxuICAgIHN3YWdnZXJPcHRpb25zOiB7XHJcbiAgICAgIHBlcnNpc3RBdXRob3JpemF0aW9uOiB0cnVlLFxyXG4gICAgICBjYWNoZTogZmFsc2UsIC8vIERlc2hhYmlsaXRhciBjYWNoZVxyXG4gICAgfSxcclxuICAgIGN1c3RvbVNpdGVUaXRsZTogJ0FkdWFuYXMgU2VydmljZSBBUEkgRG9jcycsXHJcbiAgfSk7XHJcblxyXG4gIC8vIEhlYWx0aFxyXG4gIGFwcC51c2UoJy9hcGkvaGVhbHRoJywgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gICAgcmVzLmpzb24oeyBzdGF0dXM6ICdPSycsIHRzOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XHJcbiAgYXdhaXQgYXBwLmxpc3Rlbihwb3J0IGFzIG51bWJlcik7XHJcbiAgbG9nZ2VyLmxvZyhgU2VydmVyIGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWApO1xyXG4gIGxvZ2dlci5sb2coYERvY3MgICBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vYXBpL2RvY3NgKTtcclxufVxyXG5cclxuYm9vdHN0cmFwKCk7Il19