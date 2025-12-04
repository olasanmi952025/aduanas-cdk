"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStatusModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const export_status_service_1 = require("./export-status.service");
const aws_1 = require("../aws");
let ExportStatusModule = class ExportStatusModule {
};
exports.ExportStatusModule = ExportStatusModule;
exports.ExportStatusModule = ExportStatusModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, aws_1.AWSModule],
        providers: [export_status_service_1.ExportStatusService],
        exports: [export_status_service_1.ExportStatusService],
    })
], ExportStatusModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXR1cy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHBvcnQtc3RhdHVzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMsMkNBQThDO0FBQzlDLG1FQUE4RDtBQUM5RCxnQ0FBbUM7QUFPNUIsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7Q0FBRyxDQUFBO0FBQXJCLGdEQUFrQjs2QkFBbEIsa0JBQWtCO0lBTDlCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFLENBQUMscUJBQVksRUFBRSxlQUFTLENBQUM7UUFDbEMsU0FBUyxFQUFFLENBQUMsMkNBQW1CLENBQUM7UUFDaEMsT0FBTyxFQUFFLENBQUMsMkNBQW1CLENBQUM7S0FDL0IsQ0FBQztHQUNXLGtCQUFrQixDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBDb25maWdNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbmZpZyc7XHJcbmltcG9ydCB7IEV4cG9ydFN0YXR1c1NlcnZpY2UgfSBmcm9tICcuL2V4cG9ydC1zdGF0dXMuc2VydmljZSc7XHJcbmltcG9ydCB7IEFXU01vZHVsZSB9IGZyb20gJy4uL2F3cyc7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbQ29uZmlnTW9kdWxlLCBBV1NNb2R1bGVdLFxyXG4gIHByb3ZpZGVyczogW0V4cG9ydFN0YXR1c1NlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtFeHBvcnRTdGF0dXNTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIEV4cG9ydFN0YXR1c01vZHVsZSB7fVxyXG5cclxuIl19