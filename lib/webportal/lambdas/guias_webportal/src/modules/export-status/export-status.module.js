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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXR1cy5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHBvcnQtc3RhdHVzLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMsMkNBQThDO0FBQzlDLG1FQUE4RDtBQUM5RCxnQ0FBbUM7QUFPNUIsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7Q0FBRyxDQUFBO0FBQXJCLGdEQUFrQjs2QkFBbEIsa0JBQWtCO0lBTDlCLElBQUEsZUFBTSxFQUFDO1FBQ04sT0FBTyxFQUFFLENBQUMscUJBQVksRUFBRSxlQUFTLENBQUM7UUFDbEMsU0FBUyxFQUFFLENBQUMsMkNBQW1CLENBQUM7UUFDaEMsT0FBTyxFQUFFLENBQUMsMkNBQW1CLENBQUM7S0FDL0IsQ0FBQztHQUNXLGtCQUFrQixDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIkBuZXN0anMvY29tbW9uXCI7XHJcbmltcG9ydCB7IENvbmZpZ01vZHVsZSB9IGZyb20gXCJAbmVzdGpzL2NvbmZpZ1wiO1xyXG5pbXBvcnQgeyBFeHBvcnRTdGF0dXNTZXJ2aWNlIH0gZnJvbSBcIi4vZXhwb3J0LXN0YXR1cy5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IEFXU01vZHVsZSB9IGZyb20gXCIuLi9hd3NcIjtcclxuXHJcbkBNb2R1bGUoe1xyXG4gIGltcG9ydHM6IFtDb25maWdNb2R1bGUsIEFXU01vZHVsZV0sXHJcbiAgcHJvdmlkZXJzOiBbRXhwb3J0U3RhdHVzU2VydmljZV0sXHJcbiAgZXhwb3J0czogW0V4cG9ydFN0YXR1c1NlcnZpY2VdLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgRXhwb3J0U3RhdHVzTW9kdWxlIHt9XHJcblxyXG4iXX0=