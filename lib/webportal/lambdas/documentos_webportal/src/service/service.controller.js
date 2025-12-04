"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/public.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
const sample_entity_1 = require("./sample.entity");
let ServiceController = class ServiceController {
    constructor(service) {
        this.service = service;
    }
    publicEndpoint() {
        return { message: 'public ok' };
    }
    findAll() {
        return this.service.findAll();
    }
    create(body) {
        return this.service.create(body.name);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, body) {
        return this.service.update(id, body.name);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.ServiceController = ServiceController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a public message' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns a public message.' })
], ServiceController.prototype, "publicEndpoint", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'user', 'viewer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all samples (requires viewer role or higher)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all samples.', type: [sample_entity_1.SampleEntity] })
], ServiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin', 'user'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new sample (requires user role or higher)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The sample has been successfully created.', type: sample_entity_1.SampleEntity }),
    __param(0, (0, common_1.Body)())
], ServiceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'user', 'viewer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a sample by ID (requires viewer role or higher)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns a single sample.', type: sample_entity_1.SampleEntity }),
    __param(0, (0, common_1.Param)('id'))
], ServiceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'user'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a sample (requires user role or higher)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The sample has been successfully updated.', type: sample_entity_1.SampleEntity }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)())
], ServiceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a sample (requires admin role)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'The sample has been successfully deleted.' }),
    __param(0, (0, common_1.Param)('id'))
], ServiceController.prototype, "remove", null);
exports.ServiceController = ServiceController = __decorate([
    (0, swagger_1.ApiTags)('samples'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('samples')
], ServiceController);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmljZS5jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUF1RztBQUN2Ryw2Q0FBb0Y7QUFDcEYsK0RBQWtEO0FBQ2xELDZEQUFnRDtBQUVoRCxtREFBK0M7QUFLeEMsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7SUFDNUIsWUFBNkIsT0FBdUI7UUFBdkIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0I7SUFBRyxDQUFDO0lBTXhELGNBQWM7UUFDWixPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFNRCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFNRCxNQUFNLENBQVMsSUFBc0I7UUFDbkMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQU1ELE9BQU8sQ0FBYyxFQUFVO1FBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQU1ELE1BQU0sQ0FBYyxFQUFVLEVBQVUsSUFBc0I7UUFDNUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFPRCxNQUFNLENBQWMsRUFBVTtRQUM1QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FDRixDQUFBO0FBbkRZLDhDQUFpQjtBQU81QjtJQUpDLElBQUEseUJBQU0sR0FBRTtJQUNSLElBQUEsWUFBRyxFQUFDLFFBQVEsQ0FBQztJQUNiLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxDQUFDO0lBQ2pELElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixFQUFFLENBQUM7dURBR3RFO0FBTUQ7SUFKQyxJQUFBLFlBQUcsR0FBRTtJQUNMLElBQUEsdUJBQUssRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQztJQUNoQyxJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUsa0RBQWtELEVBQUUsQ0FBQztJQUM3RSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyw0QkFBWSxDQUFDLEVBQUUsQ0FBQztnREFHdkY7QUFNRDtJQUpDLElBQUEsYUFBSSxHQUFFO0lBQ04sSUFBQSx1QkFBSyxFQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7SUFDdEIsSUFBQSxzQkFBWSxFQUFDLEVBQUUsT0FBTyxFQUFFLG9EQUFvRCxFQUFFLENBQUM7SUFDL0UsSUFBQSxxQkFBVyxFQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsMkNBQTJDLEVBQUUsSUFBSSxFQUFFLDRCQUFZLEVBQUUsQ0FBQztJQUNuRyxXQUFBLElBQUEsYUFBSSxHQUFFLENBQUE7K0NBRWI7QUFNRDtJQUpDLElBQUEsWUFBRyxFQUFDLEtBQUssQ0FBQztJQUNWLElBQUEsdUJBQUssRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQztJQUNoQyxJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUscURBQXFELEVBQUUsQ0FBQztJQUNoRixJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSwwQkFBMEIsRUFBRSxJQUFJLEVBQUUsNEJBQVksRUFBRSxDQUFDO0lBQ2pGLFdBQUEsSUFBQSxjQUFLLEVBQUMsSUFBSSxDQUFDLENBQUE7Z0RBRW5CO0FBTUQ7SUFKQyxJQUFBLFlBQUcsRUFBQyxLQUFLLENBQUM7SUFDVixJQUFBLHVCQUFLLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQztJQUN0QixJQUFBLHNCQUFZLEVBQUMsRUFBRSxPQUFPLEVBQUUsZ0RBQWdELEVBQUUsQ0FBQztJQUMzRSxJQUFBLHFCQUFXLEVBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSwyQ0FBMkMsRUFBRSxJQUFJLEVBQUUsNEJBQVksRUFBRSxDQUFDO0lBQ25HLFdBQUEsSUFBQSxjQUFLLEVBQUMsSUFBSSxDQUFDLENBQUE7SUFBYyxXQUFBLElBQUEsYUFBSSxHQUFFLENBQUE7K0NBRXRDO0FBT0Q7SUFMQyxJQUFBLGVBQU0sRUFBQyxLQUFLLENBQUM7SUFDYixJQUFBLHVCQUFLLEVBQUMsT0FBTyxDQUFDO0lBQ2QsSUFBQSxpQkFBUSxFQUFDLG1CQUFVLENBQUMsVUFBVSxDQUFDO0lBQy9CLElBQUEsc0JBQVksRUFBQyxFQUFFLE9BQU8sRUFBRSx1Q0FBdUMsRUFBRSxDQUFDO0lBQ2xFLElBQUEscUJBQVcsRUFBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLDJDQUEyQyxFQUFFLENBQUM7SUFDL0UsV0FBQSxJQUFBLGNBQUssRUFBQyxJQUFJLENBQUMsQ0FBQTsrQ0FFbEI7NEJBbERVLGlCQUFpQjtJQUg3QixJQUFBLGlCQUFPLEVBQUMsU0FBUyxDQUFDO0lBQ2xCLElBQUEsdUJBQWEsR0FBRTtJQUNmLElBQUEsbUJBQVUsRUFBQyxTQUFTLENBQUM7R0FDVCxpQkFBaUIsQ0FtRDdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udHJvbGxlciwgR2V0LCBQb3N0LCBCb2R5LCBQYXJhbSwgUHV0LCBEZWxldGUsIEh0dHBDb2RlLCBIdHRwU3RhdHVzIH0gZnJvbSAnQG5lc3Rqcy9jb21tb24nO1xyXG5pbXBvcnQgeyBBcGlCZWFyZXJBdXRoLCBBcGlUYWdzLCBBcGlPcGVyYXRpb24sIEFwaVJlc3BvbnNlIH0gZnJvbSAnQG5lc3Rqcy9zd2FnZ2VyJztcclxuaW1wb3J0IHsgUHVibGljIH0gZnJvbSAnLi4vYXV0aC9wdWJsaWMuZGVjb3JhdG9yJztcclxuaW1wb3J0IHsgUm9sZXMgfSBmcm9tICcuLi9hdXRoL3JvbGVzLmRlY29yYXRvcic7XHJcbmltcG9ydCB7IFNlcnZpY2VTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBTYW1wbGVFbnRpdHkgfSBmcm9tICcuL3NhbXBsZS5lbnRpdHknO1xyXG5cclxuQEFwaVRhZ3MoJ3NhbXBsZXMnKVxyXG5AQXBpQmVhcmVyQXV0aCgpXHJcbkBDb250cm9sbGVyKCdzYW1wbGVzJylcclxuZXhwb3J0IGNsYXNzIFNlcnZpY2VDb250cm9sbGVyIHtcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2U6IFNlcnZpY2VTZXJ2aWNlKSB7fVxyXG5cclxuICBAUHVibGljKClcclxuICBAR2V0KCdwdWJsaWMnKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnR2V0IGEgcHVibGljIG1lc3NhZ2UnIH0pXHJcbiAgQEFwaVJlc3BvbnNlKHsgc3RhdHVzOiAyMDAsIGRlc2NyaXB0aW9uOiAnUmV0dXJucyBhIHB1YmxpYyBtZXNzYWdlLicgfSlcclxuICBwdWJsaWNFbmRwb2ludCgpIHtcclxuICAgIHJldHVybiB7IG1lc3NhZ2U6ICdwdWJsaWMgb2snIH07XHJcbiAgfVxyXG5cclxuICBAR2V0KClcclxuICBAUm9sZXMoJ2FkbWluJywgJ3VzZXInLCAndmlld2VyJylcclxuICBAQXBpT3BlcmF0aW9uKHsgc3VtbWFyeTogJ0dldCBhbGwgc2FtcGxlcyAocmVxdWlyZXMgdmlld2VyIHJvbGUgb3IgaGlnaGVyKScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMCwgZGVzY3JpcHRpb246ICdSZXR1cm5zIGFsbCBzYW1wbGVzLicsIHR5cGU6IFtTYW1wbGVFbnRpdHldIH0pXHJcbiAgZmluZEFsbCgpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuZmluZEFsbCgpO1xyXG4gIH1cclxuXHJcbiAgQFBvc3QoKVxyXG4gIEBSb2xlcygnYWRtaW4nLCAndXNlcicpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6ICdDcmVhdGUgYSBuZXcgc2FtcGxlIChyZXF1aXJlcyB1c2VyIHJvbGUgb3IgaGlnaGVyKScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwMSwgZGVzY3JpcHRpb246ICdUaGUgc2FtcGxlIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBjcmVhdGVkLicsIHR5cGU6IFNhbXBsZUVudGl0eSB9KVxyXG4gIGNyZWF0ZShAQm9keSgpIGJvZHk6IHsgbmFtZTogc3RyaW5nIH0pIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuY3JlYXRlKGJvZHkubmFtZSk7XHJcbiAgfVxyXG5cclxuICBAR2V0KCc6aWQnKVxyXG4gIEBSb2xlcygnYWRtaW4nLCAndXNlcicsICd2aWV3ZXInKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnR2V0IGEgc2FtcGxlIGJ5IElEIChyZXF1aXJlcyB2aWV3ZXIgcm9sZSBvciBoaWdoZXIpJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ1JldHVybnMgYSBzaW5nbGUgc2FtcGxlLicsIHR5cGU6IFNhbXBsZUVudGl0eSB9KVxyXG4gIGZpbmRPbmUoQFBhcmFtKCdpZCcpIGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuZmluZE9uZShpZCk7XHJcbiAgfVxyXG5cclxuICBAUHV0KCc6aWQnKVxyXG4gIEBSb2xlcygnYWRtaW4nLCAndXNlcicpXHJcbiAgQEFwaU9wZXJhdGlvbih7IHN1bW1hcnk6ICdVcGRhdGUgYSBzYW1wbGUgKHJlcXVpcmVzIHVzZXIgcm9sZSBvciBoaWdoZXIpJyB9KVxyXG4gIEBBcGlSZXNwb25zZSh7IHN0YXR1czogMjAwLCBkZXNjcmlwdGlvbjogJ1RoZSBzYW1wbGUgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQuJywgdHlwZTogU2FtcGxlRW50aXR5IH0pXHJcbiAgdXBkYXRlKEBQYXJhbSgnaWQnKSBpZDogc3RyaW5nLCBAQm9keSgpIGJvZHk6IHsgbmFtZTogc3RyaW5nIH0pIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UudXBkYXRlKGlkLCBib2R5Lm5hbWUpO1xyXG4gIH1cclxuXHJcbiAgQERlbGV0ZSgnOmlkJylcclxuICBAUm9sZXMoJ2FkbWluJylcclxuICBASHR0cENvZGUoSHR0cFN0YXR1cy5OT19DT05URU5UKVxyXG4gIEBBcGlPcGVyYXRpb24oeyBzdW1tYXJ5OiAnRGVsZXRlIGEgc2FtcGxlIChyZXF1aXJlcyBhZG1pbiByb2xlKScgfSlcclxuICBAQXBpUmVzcG9uc2UoeyBzdGF0dXM6IDIwNCwgZGVzY3JpcHRpb246ICdUaGUgc2FtcGxlIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBkZWxldGVkLicgfSlcclxuICByZW1vdmUoQFBhcmFtKCdpZCcpIGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UucmVtb3ZlKGlkKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4iXX0=