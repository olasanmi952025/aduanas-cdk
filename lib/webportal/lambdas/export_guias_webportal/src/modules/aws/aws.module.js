"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const aws_config_service_1 = require("./aws-config.service");
let AWSModule = class AWSModule {
};
exports.AWSModule = AWSModule;
exports.AWSModule = AWSModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [aws_config_service_1.AWSConfigService],
        exports: [aws_config_service_1.AWSConfigService],
    })
], AWSModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF3cy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLDJDQUE4QztBQUM5Qyw2REFBd0Q7QUFPakQsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFTO0NBQUcsQ0FBQTtBQUFaLDhCQUFTO29CQUFULFNBQVM7SUFMckIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUUsQ0FBQyxxQkFBWSxDQUFDO1FBQ3ZCLFNBQVMsRUFBRSxDQUFDLHFDQUFnQixDQUFDO1FBQzdCLE9BQU8sRUFBRSxDQUFDLHFDQUFnQixDQUFDO0tBQzVCLENBQUM7R0FDVyxTQUFTLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ01vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgQVdTQ29uZmlnU2VydmljZSB9IGZyb20gJy4vYXdzLWNvbmZpZy5zZXJ2aWNlJztcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtDb25maWdNb2R1bGVdLFxyXG4gIHByb3ZpZGVyczogW0FXU0NvbmZpZ1NlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtBV1NDb25maWdTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIEFXU01vZHVsZSB7fVxyXG5cclxuIl19