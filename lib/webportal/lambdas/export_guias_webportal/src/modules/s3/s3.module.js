"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Module = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const s3_service_1 = require("./s3.service");
const aws_1 = require("../aws");
let S3Module = class S3Module {
};
exports.S3Module = S3Module;
exports.S3Module = S3Module = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, aws_1.AWSModule],
        providers: [s3_service_1.S3Service],
        exports: [s3_service_1.S3Service],
    })
], S3Module);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiczMubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDJDQUF3QztBQUN4QywyQ0FBOEM7QUFDOUMsNkNBQXlDO0FBQ3pDLGdDQUFtQztBQU81QixJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVE7Q0FBRyxDQUFBO0FBQVgsNEJBQVE7bUJBQVIsUUFBUTtJQUxwQixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRSxDQUFDLHFCQUFZLEVBQUUsZUFBUyxDQUFDO1FBQ2xDLFNBQVMsRUFBRSxDQUFDLHNCQUFTLENBQUM7UUFDdEIsT0FBTyxFQUFFLENBQUMsc0JBQVMsQ0FBQztLQUNyQixDQUFDO0dBQ1csUUFBUSxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBDb25maWdNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IFMzU2VydmljZSB9IGZyb20gJy4vczMuc2VydmljZSc7XHJcbmltcG9ydCB7IEFXU01vZHVsZSB9IGZyb20gJy4uL2F3cyc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbQ29uZmlnTW9kdWxlLCBBV1NNb2R1bGVdLFxyXG4gIHByb3ZpZGVyczogW1MzU2VydmljZV0sXHJcbiAgZXhwb3J0czogW1MzU2VydmljZV0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBTM01vZHVsZSB7fVxyXG5cclxuIl19