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
const sqs_module_1 = require("./sqs/sqs.module");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_auth_module_1 = require("./auth/jwt-auth.module");
const service_module_1 = require("./service/service.module");
const typeorm_config_1 = require("./config/typeorm.config");
const config_1 = require("@nestjs/config");
const validation_schema_1 = require("./config/validation.schema");
const documentos_module_1 = require("./modules/documentos/documentos.module");
const dictionaries_module_1 = require("./modules/dictionaries/dictionaries.module");
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
            // Configuración TypeORM para Oracle
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: typeorm_config_1.getTypeOrmConfig,
                inject: [config_1.ConfigService],
            }),
            sqs_module_1.SQSModule,
            jwt_auth_module_1.JwtAuthModule,
            service_module_1.ServiceModule,
            documentos_module_1.DocumentosModule,
            dictionaries_module_1.DictionariesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLGlEQUE2QztBQUM3Qyw2Q0FBZ0Q7QUFDaEQsNERBQXVEO0FBQ3ZELDZEQUF5RDtBQUN6RCw0REFBMkQ7QUFDM0QsMkNBQTZEO0FBQzdELGtFQUE4RDtBQUM5RCw4RUFBMEU7QUFDMUUsb0ZBQWdGO0FBc0J6RSxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVM7Q0FBRyxDQUFBO0FBQVosOEJBQVM7b0JBQVQsU0FBUztJQXBCckIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUU7WUFDUCxxQkFBWSxDQUFDLE9BQU8sQ0FBQztnQkFDbkIsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsZ0JBQWdCLEVBQWhCLG9DQUFnQjtnQkFDaEIsaUJBQWlCLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7YUFDNUQsQ0FBQztZQUNGLG9DQUFvQztZQUNwQyx1QkFBYSxDQUFDLFlBQVksQ0FBQztnQkFDekIsT0FBTyxFQUFFLENBQUMscUJBQVksQ0FBQztnQkFDdkIsVUFBVSxFQUFFLGlDQUFnQjtnQkFDNUIsTUFBTSxFQUFFLENBQUMsc0JBQWEsQ0FBQzthQUN4QixDQUFDO1lBQ0Ysc0JBQVM7WUFDVCwrQkFBYTtZQUNiLDhCQUFhO1lBQ2Isb0NBQWdCO1lBQ2hCLHdDQUFrQjtTQUNuQjtLQUNGLENBQUM7R0FDVyxTQUFTLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFNRU01vZHVsZSB9IGZyb20gJy4vc3FzL3Nxcy5tb2R1bGUnO1xyXG5pbXBvcnQgeyBUeXBlT3JtTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy90eXBlb3JtJztcclxuaW1wb3J0IHsgSnd0QXV0aE1vZHVsZSB9IGZyb20gJy4vYXV0aC9qd3QtYXV0aC5tb2R1bGUnO1xyXG5pbXBvcnQgeyBTZXJ2aWNlTW9kdWxlIH0gZnJvbSAnLi9zZXJ2aWNlL3NlcnZpY2UubW9kdWxlJztcclxuaW1wb3J0IHsgZ2V0VHlwZU9ybUNvbmZpZyB9IGZyb20gJy4vY29uZmlnL3R5cGVvcm0uY29uZmlnJztcclxuaW1wb3J0IHsgQ29uZmlnTW9kdWxlLCBDb25maWdTZXJ2aWNlIH0gZnJvbSAnQG5lc3Rqcy9jb25maWcnO1xyXG5pbXBvcnQgeyB2YWxpZGF0aW9uU2NoZW1hIH0gZnJvbSAnLi9jb25maWcvdmFsaWRhdGlvbi5zY2hlbWEnO1xyXG5pbXBvcnQgeyBEb2N1bWVudG9zTW9kdWxlIH0gZnJvbSAnLi9tb2R1bGVzL2RvY3VtZW50b3MvZG9jdW1lbnRvcy5tb2R1bGUnO1xyXG5pbXBvcnQgeyBEaWN0aW9uYXJpZXNNb2R1bGUgfSBmcm9tICcuL21vZHVsZXMvZGljdGlvbmFyaWVzL2RpY3Rpb25hcmllcy5tb2R1bGUnO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW1xyXG4gICAgQ29uZmlnTW9kdWxlLmZvclJvb3Qoe1xyXG4gICAgICBpc0dsb2JhbDogdHJ1ZSxcclxuICAgICAgdmFsaWRhdGlvblNjaGVtYSxcclxuICAgICAgdmFsaWRhdGlvbk9wdGlvbnM6IHsgYWxsb3dVbmtub3duOiB0cnVlLCBhYm9ydEVhcmx5OiB0cnVlIH0sXHJcbiAgICB9KSxcclxuICAgIC8vIENvbmZpZ3VyYWNpw7NuIFR5cGVPUk0gcGFyYSBPcmFjbGVcclxuICAgIFR5cGVPcm1Nb2R1bGUuZm9yUm9vdEFzeW5jKHtcclxuICAgICAgaW1wb3J0czogW0NvbmZpZ01vZHVsZV0sXHJcbiAgICAgIHVzZUZhY3Rvcnk6IGdldFR5cGVPcm1Db25maWcsXHJcbiAgICAgIGluamVjdDogW0NvbmZpZ1NlcnZpY2VdLFxyXG4gICAgfSksXHJcbiAgICBTUVNNb2R1bGUsXHJcbiAgICBKd3RBdXRoTW9kdWxlLFxyXG4gICAgU2VydmljZU1vZHVsZSxcclxuICAgIERvY3VtZW50b3NNb2R1bGUsXHJcbiAgICBEaWN0aW9uYXJpZXNNb2R1bGUsXHJcbiAgXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIEFwcE1vZHVsZSB7fSJdfQ==