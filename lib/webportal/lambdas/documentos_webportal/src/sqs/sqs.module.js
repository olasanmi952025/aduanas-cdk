"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sqs_service_1 = require("../service/sqs.service");
const service_module_1 = require("../service/service.module");
const sqs_controller_1 = require("./sqs.controller");
let SQSModule = class SQSModule {
};
exports.SQSModule = SQSModule;
exports.SQSModule = SQSModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            service_module_1.ServiceModule,
        ],
        providers: [sqs_service_1.SQSService],
        controllers: [sqs_controller_1.SQSController],
        exports: [sqs_service_1.SQSService],
    })
], SQSModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNxcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLDJDQUE4QztBQUM5Qyx3REFBb0Q7QUFDcEQsOERBQTBEO0FBQzFELHFEQUFpRDtBQVcxQyxJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVM7Q0FBRyxDQUFBO0FBQVosOEJBQVM7b0JBQVQsU0FBUztJQVRyQixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRTtZQUNQLHFCQUFZO1lBQ1osOEJBQWE7U0FDZDtRQUNELFNBQVMsRUFBRSxDQUFDLHdCQUFVLENBQUM7UUFDdkIsV0FBVyxFQUFFLENBQUMsOEJBQWEsQ0FBQztRQUM1QixPQUFPLEVBQUUsQ0FBQyx3QkFBVSxDQUFDO0tBQ3RCLENBQUM7R0FDVyxTQUFTLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ01vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgU1FTU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2Uvc3FzLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBTZXJ2aWNlTW9kdWxlIH0gZnJvbSAnLi4vc2VydmljZS9zZXJ2aWNlLm1vZHVsZSc7XHJcbmltcG9ydCB7IFNRU0NvbnRyb2xsZXIgfSBmcm9tICcuL3Nxcy5jb250cm9sbGVyJztcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtcclxuICAgIENvbmZpZ01vZHVsZSxcclxuICAgIFNlcnZpY2VNb2R1bGUsXHJcbiAgXSxcclxuICBwcm92aWRlcnM6IFtTUVNTZXJ2aWNlXSxcclxuICBjb250cm9sbGVyczogW1NRU0NvbnRyb2xsZXJdLFxyXG4gIGV4cG9ydHM6IFtTUVNTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFNRU01vZHVsZSB7fVxyXG5cclxuIl19