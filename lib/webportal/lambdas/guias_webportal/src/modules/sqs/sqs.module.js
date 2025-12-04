"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSModule = void 0;
const aws_1 = require("../aws");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sqs_producer_service_1 = require("./sqs-producer.service");
let SQSModule = class SQSModule {
};
exports.SQSModule = SQSModule;
exports.SQSModule = SQSModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            aws_1.AWSModule,
        ],
        providers: [sqs_producer_service_1.SQSProducerService],
        exports: [sqs_producer_service_1.SQSProducerService],
    })
], SQSModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNxcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsZ0NBQW1DO0FBQ25DLDJDQUF3QztBQUN4QywyQ0FBOEM7QUFDOUMsaUVBQTREO0FBVXJELElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBUztDQUFHLENBQUE7QUFBWiw4QkFBUztvQkFBVCxTQUFTO0lBUnJCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFO1lBQ1AscUJBQVk7WUFDWixlQUFTO1NBQ1Y7UUFDRCxTQUFTLEVBQUUsQ0FBQyx5Q0FBa0IsQ0FBQztRQUMvQixPQUFPLEVBQUUsQ0FBQyx5Q0FBa0IsQ0FBQztLQUM5QixDQUFDO0dBQ1csU0FBUyxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVdTTW9kdWxlIH0gZnJvbSAnLi4vYXdzJztcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBDb25maWdNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IFNRU1Byb2R1Y2VyU2VydmljZSB9IGZyb20gJy4vc3FzLXByb2R1Y2VyLnNlcnZpY2UnO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW1xyXG4gICAgQ29uZmlnTW9kdWxlLFxyXG4gICAgQVdTTW9kdWxlLFxyXG4gIF0sXHJcbiAgcHJvdmlkZXJzOiBbU1FTUHJvZHVjZXJTZXJ2aWNlXSxcclxuICBleHBvcnRzOiBbU1FTUHJvZHVjZXJTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFNRU01vZHVsZSB7fVxyXG5cclxuIl19