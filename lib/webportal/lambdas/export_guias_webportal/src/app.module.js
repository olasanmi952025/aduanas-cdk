"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_config_1 = require("./config/typeorm.config");
const validation_schema_1 = require("./config/validation.schema");
const aws_1 = require("./modules/aws");
const s3_1 = require("./modules/s3");
const sqs_1 = require("./modules/sqs");
const excel_1 = require("./modules/excel");
const xml_1 = require("./modules/xml");
const documentos_module_1 = require("./modules/documentos/documentos.module");
const export_status_1 = require("./modules/export-status");
let AppModule = class AppModule {
    constructor(sqsConsumer, configService) {
        this.sqsConsumer = sqsConsumer;
        this.configService = configService;
    }
    async onModuleInit() {
        const enableLocalConsumer = this.configService.get('ENABLE_LOCAL_SQS_CONSUMER') === 'true';
        if (enableLocalConsumer) {
            this.sqsConsumer.listen().catch((error) => {
                console.error('Error starting SQS consumer:', error);
            });
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: validation_schema_1.validationSchema,
                validationOptions: { allowUnknown: true, abortEarly: true },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: typeorm_config_1.getTypeOrmConfig,
                inject: [config_1.ConfigService],
            }),
            aws_1.AWSModule,
            s3_1.S3Module,
            sqs_1.SQSModule,
            documentos_module_1.DocumentosModule,
            excel_1.ExcelModule,
            xml_1.XmlModule,
            export_status_1.ExportStatusModule,
        ],
    })
], AppModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXNEO0FBQ3RELDZDQUFnRDtBQUNoRCwyQ0FBNkQ7QUFDN0QsNERBQTJEO0FBQzNELGtFQUE4RDtBQUM5RCx1Q0FBMEM7QUFDMUMscUNBQXdDO0FBQ3hDLHVDQUE4RDtBQUM5RCwyQ0FBOEM7QUFDOUMsdUNBQTBDO0FBQzFDLDhFQUEwRTtBQUMxRSwyREFBNkQ7QUF1QnRELElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBUztJQUNwQixZQUNtQixXQUErQixFQUMvQixhQUE0QjtRQUQ1QixnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7UUFDL0Isa0JBQWEsR0FBYixhQUFhLENBQWU7SUFDNUMsQ0FBQztJQUVKLEtBQUssQ0FBQyxZQUFZO1FBQ2hCLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQVMsMkJBQTJCLENBQUMsS0FBSyxNQUFNLENBQUM7UUFFbkcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztDQUNGLENBQUE7QUFmWSw4QkFBUztvQkFBVCxTQUFTO0lBckJyQixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRTtZQUNQLHFCQUFZLENBQUMsT0FBTyxDQUFDO2dCQUNuQixRQUFRLEVBQUUsSUFBSTtnQkFDZCxnQkFBZ0IsRUFBaEIsb0NBQWdCO2dCQUNoQixpQkFBaUIsRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTthQUM1RCxDQUFDO1lBQ0YsdUJBQWEsQ0FBQyxZQUFZLENBQUM7Z0JBQ3pCLE9BQU8sRUFBRSxDQUFDLHFCQUFZLENBQUM7Z0JBQ3ZCLFVBQVUsRUFBRSxpQ0FBZ0I7Z0JBQzVCLE1BQU0sRUFBRSxDQUFDLHNCQUFhLENBQUM7YUFDeEIsQ0FBQztZQUNGLGVBQVM7WUFDVCxhQUFRO1lBQ1IsZUFBUztZQUNULG9DQUFnQjtZQUNoQixtQkFBVztZQUNYLGVBQVM7WUFDVCxrQ0FBa0I7U0FDbkI7S0FDRixDQUFDO0dBQ1csU0FBUyxDQWVyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSwgT25Nb2R1bGVJbml0IH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBUeXBlT3JtTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy90eXBlb3JtJztcclxuaW1wb3J0IHsgQ29uZmlnTW9kdWxlLCBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgeyBnZXRUeXBlT3JtQ29uZmlnIH0gZnJvbSAnLi9jb25maWcvdHlwZW9ybS5jb25maWcnO1xyXG5pbXBvcnQgeyB2YWxpZGF0aW9uU2NoZW1hIH0gZnJvbSAnLi9jb25maWcvdmFsaWRhdGlvbi5zY2hlbWEnO1xyXG5pbXBvcnQgeyBBV1NNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvYXdzJztcclxuaW1wb3J0IHsgUzNNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvczMnO1xyXG5pbXBvcnQgeyBTUVNNb2R1bGUsIFNRU0NvbnN1bWVyU2VydmljZSB9IGZyb20gJy4vbW9kdWxlcy9zcXMnO1xyXG5pbXBvcnQgeyBFeGNlbE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy9leGNlbCc7XHJcbmltcG9ydCB7IFhtbE1vZHVsZSB9IGZyb20gJy4vbW9kdWxlcy94bWwnO1xyXG5pbXBvcnQgeyBEb2N1bWVudG9zTW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL2RvY3VtZW50b3MvZG9jdW1lbnRvcy5tb2R1bGUnO1xyXG5pbXBvcnQgeyBFeHBvcnRTdGF0dXNNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvZXhwb3J0LXN0YXR1cyc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbXHJcbiAgICBDb25maWdNb2R1bGUuZm9yUm9vdCh7XHJcbiAgICAgIGlzR2xvYmFsOiB0cnVlLFxyXG4gICAgICB2YWxpZGF0aW9uU2NoZW1hLFxyXG4gICAgICB2YWxpZGF0aW9uT3B0aW9uczogeyBhbGxvd1Vua25vd246IHRydWUsIGFib3J0RWFybHk6IHRydWUgfSxcclxuICAgIH0pLFxyXG4gICAgVHlwZU9ybU1vZHVsZS5mb3JSb290QXN5bmMoe1xyXG4gICAgICBpbXBvcnRzOiBbQ29uZmlnTW9kdWxlXSxcclxuICAgICAgdXNlRmFjdG9yeTogZ2V0VHlwZU9ybUNvbmZpZyxcclxuICAgICAgaW5qZWN0OiBbQ29uZmlnU2VydmljZV0sXHJcbiAgICB9KSxcclxuICAgIEFXU01vZHVsZSxcclxuICAgIFMzTW9kdWxlLFxyXG4gICAgU1FTTW9kdWxlLFxyXG4gICAgRG9jdW1lbnRvc01vZHVsZSxcclxuICAgIEV4Y2VsTW9kdWxlLFxyXG4gICAgWG1sTW9kdWxlLFxyXG4gICAgRXhwb3J0U3RhdHVzTW9kdWxlLFxyXG4gIF0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBBcHBNb2R1bGUgaW1wbGVtZW50cyBPbk1vZHVsZUluaXQge1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzcXNDb25zdW1lcjogU1FTQ29uc3VtZXJTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBjb25maWdTZXJ2aWNlOiBDb25maWdTZXJ2aWNlLFxyXG4gICkge31cclxuXHJcbiAgYXN5bmMgb25Nb2R1bGVJbml0KCkge1xyXG4gICAgY29uc3QgZW5hYmxlTG9jYWxDb25zdW1lciA9IHRoaXMuY29uZmlnU2VydmljZS5nZXQ8c3RyaW5nPignRU5BQkxFX0xPQ0FMX1NRU19DT05TVU1FUicpID09PSAndHJ1ZSc7XHJcbiAgICBcclxuICAgIGlmIChlbmFibGVMb2NhbENvbnN1bWVyKSB7XHJcbiAgICAgIHRoaXMuc3FzQ29uc3VtZXIubGlzdGVuKCkuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhcnRpbmcgU1FTIGNvbnN1bWVyOicsIGVycm9yKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59Il19