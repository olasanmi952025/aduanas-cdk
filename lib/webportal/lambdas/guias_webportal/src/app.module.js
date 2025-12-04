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
const jwt_auth_module_1 = require("./auth/jwt-auth.module");
const service_module_1 = require("./service/service.module");
const aws_1 = require("./modules/aws");
const sqs_1 = require("./modules/sqs");
const documentos_module_1 = require("./modules/documentos/documentos.module");
const typeorm_config_1 = require("./config/typeorm.config");
const validation_schema_1 = require("./config/validation.schema");
let AppModule = class AppModule {
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
            sqs_1.SQSModule,
            jwt_auth_module_1.JwtAuthModule,
            service_module_1.ServiceModule,
            documentos_module_1.DocumentosModule,
        ],
    })
], AppModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLDZDQUFnRDtBQUNoRCwyQ0FBNkQ7QUFDN0QsNERBQXVEO0FBQ3ZELDZEQUF5RDtBQUN6RCx1Q0FBMEM7QUFDMUMsdUNBQTBDO0FBQzFDLDhFQUEwRTtBQUMxRSw0REFBMkQ7QUFDM0Qsa0VBQThEO0FBcUJ2RCxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVM7Q0FBRyxDQUFBO0FBQVosOEJBQVM7b0JBQVQsU0FBUztJQW5CckIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUU7WUFDUCxxQkFBWSxDQUFDLE9BQU8sQ0FBQztnQkFDbkIsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsZ0JBQWdCLEVBQWhCLG9DQUFnQjtnQkFDaEIsaUJBQWlCLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7YUFDNUQsQ0FBQztZQUNGLHVCQUFhLENBQUMsWUFBWSxDQUFDO2dCQUN6QixPQUFPLEVBQUUsQ0FBQyxxQkFBWSxDQUFDO2dCQUN2QixVQUFVLEVBQUUsaUNBQWdCO2dCQUM1QixNQUFNLEVBQUUsQ0FBQyxzQkFBYSxDQUFDO2FBQ3hCLENBQUM7WUFDRixlQUFTO1lBQ1QsZUFBUztZQUNULCtCQUFhO1lBQ2IsOEJBQWE7WUFDYixvQ0FBZ0I7U0FDakI7S0FDRixDQUFDO0dBQ1csU0FBUyxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBUeXBlT3JtTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy90eXBlb3JtJztcclxuaW1wb3J0IHsgQ29uZmlnTW9kdWxlLCBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgeyBKd3RBdXRoTW9kdWxlIH0gZnJvbSAnLi9hdXRoL2p3dC1hdXRoLm1vZHVsZSc7XHJcbmltcG9ydCB7IFNlcnZpY2VNb2R1bGUgfSBmcm9tICcuL3NlcnZpY2Uvc2VydmljZS5tb2R1bGUnO1xyXG5pbXBvcnQgeyBBV1NNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvYXdzJztcclxuaW1wb3J0IHsgU1FTTW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL3Nxcyc7XHJcbmltcG9ydCB7IERvY3VtZW50b3NNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvZG9jdW1lbnRvcy9kb2N1bWVudG9zLm1vZHVsZSc7XHJcbmltcG9ydCB7IGdldFR5cGVPcm1Db25maWcgfSBmcm9tICcuL2NvbmZpZy90eXBlb3JtLmNvbmZpZyc7XHJcbmltcG9ydCB7IHZhbGlkYXRpb25TY2hlbWEgfSBmcm9tICcuL2NvbmZpZy92YWxpZGF0aW9uLnNjaGVtYSc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbXHJcbiAgICBDb25maWdNb2R1bGUuZm9yUm9vdCh7XHJcbiAgICAgIGlzR2xvYmFsOiB0cnVlLFxyXG4gICAgICB2YWxpZGF0aW9uU2NoZW1hLFxyXG4gICAgICB2YWxpZGF0aW9uT3B0aW9uczogeyBhbGxvd1Vua25vd246IHRydWUsIGFib3J0RWFybHk6IHRydWUgfSxcclxuICAgIH0pLFxyXG4gICAgVHlwZU9ybU1vZHVsZS5mb3JSb290QXN5bmMoe1xyXG4gICAgICBpbXBvcnRzOiBbQ29uZmlnTW9kdWxlXSxcclxuICAgICAgdXNlRmFjdG9yeTogZ2V0VHlwZU9ybUNvbmZpZyxcclxuICAgICAgaW5qZWN0OiBbQ29uZmlnU2VydmljZV0sXHJcbiAgICB9KSxcclxuICAgIEFXU01vZHVsZSxcclxuICAgIFNRU01vZHVsZSxcclxuICAgIEp3dEF1dGhNb2R1bGUsXHJcbiAgICBTZXJ2aWNlTW9kdWxlLFxyXG4gICAgRG9jdW1lbnRvc01vZHVsZSxcclxuICBdLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgQXBwTW9kdWxlIHt9Il19