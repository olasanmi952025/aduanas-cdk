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
const health_controller_1 = require("./health.controller");
let ServiceModule = class ServiceModule {
};
exports.ServiceModule = ServiceModule;
exports.ServiceModule = ServiceModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [health_controller_1.HealthController],
        providers: [],
        exports: [],
    })
], ServiceModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXJ2aWNlLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMsMkRBQXVEO0FBUWhELElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7Q0FBRyxDQUFBO0FBQWhCLHNDQUFhO3dCQUFiLGFBQWE7SUFOekIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUUsRUFBRTtRQUNYLFdBQVcsRUFBRSxDQUFDLG9DQUFnQixDQUFDO1FBQy9CLFNBQVMsRUFBRSxFQUFFO1FBQ2IsT0FBTyxFQUFFLEVBQUU7S0FDWixDQUFDO0dBQ1csYUFBYSxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBIZWFsdGhDb250cm9sbGVyIH0gZnJvbSAnLi9oZWFsdGguY29udHJvbGxlcic7XHJcblxyXG5ATW9kdWxlKHtcclxuICBpbXBvcnRzOiBbXSxcclxuICBjb250cm9sbGVyczogW0hlYWx0aENvbnRyb2xsZXJdLFxyXG4gIHByb3ZpZGVyczogW10sXHJcbiAgZXhwb3J0czogW10sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBTZXJ2aWNlTW9kdWxlIHt9XHJcblxyXG5cclxuIl19