"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModule = void 0;
const common_1 = require("@nestjs/common");
const service_controller_1 = require("./service.controller");
const service_service_1 = require("./service.service");
const health_controller_1 = require("./health.controller");
let ServiceModule = class ServiceModule {
};
exports.ServiceModule = ServiceModule;
exports.ServiceModule = ServiceModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [service_controller_1.ServiceController, health_controller_1.HealthController],
        providers: [service_service_1.ServiceService],
        exports: [service_service_1.ServiceService], // Exportar servicios para uso en otros módulos
    })
], ServiceModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXJ2aWNlLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMsNkRBQXlEO0FBQ3pELHVEQUFtRDtBQUNuRCwyREFBdUQ7QUFRaEQsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYTtDQUFHLENBQUE7QUFBaEIsc0NBQWE7d0JBQWIsYUFBYTtJQU56QixJQUFBLGVBQU0sRUFBQztRQUNOLE9BQU8sRUFBRSxFQUFFO1FBQ1gsV0FBVyxFQUFFLENBQUMsc0NBQWlCLEVBQUUsb0NBQWdCLENBQUM7UUFDbEQsU0FBUyxFQUFFLENBQUMsZ0NBQWMsQ0FBQztRQUMzQixPQUFPLEVBQUUsQ0FBQyxnQ0FBYyxDQUFDLEVBQUUsK0NBQStDO0tBQzNFLENBQUM7R0FDVyxhQUFhLENBQUciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IFNlcnZpY2VDb250cm9sbGVyIH0gZnJvbSAnLi9zZXJ2aWNlLmNvbnRyb2xsZXInO1xyXG5pbXBvcnQgeyBTZXJ2aWNlU2VydmljZSB9IGZyb20gJy4vc2VydmljZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgSGVhbHRoQ29udHJvbGxlciB9IGZyb20gJy4vaGVhbHRoLmNvbnRyb2xsZXInO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW10sXHJcbiAgY29udHJvbGxlcnM6IFtTZXJ2aWNlQ29udHJvbGxlciwgSGVhbHRoQ29udHJvbGxlcl0sXHJcbiAgcHJvdmlkZXJzOiBbU2VydmljZVNlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtTZXJ2aWNlU2VydmljZV0sIC8vIEV4cG9ydGFyIHNlcnZpY2lvcyBwYXJhIHVzbyBlbiBvdHJvcyBtw7NkdWxvc1xyXG59KVxyXG5leHBvcnQgY2xhc3MgU2VydmljZU1vZHVsZSB7fVxyXG5cclxuXHJcbiJdfQ==