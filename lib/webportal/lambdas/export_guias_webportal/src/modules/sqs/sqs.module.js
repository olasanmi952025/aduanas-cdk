"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSModule = void 0;
const s3_1 = require("../s3");
const aws_1 = require("../aws");
const excel_1 = require("../excel");
const pdf_1 = require("../pdf");
const xml_1 = require("../xml");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const export_status_1 = require("../export-status");
const manifiesto_1 = require("../manifiesto");
const sqs_consumer_service_1 = require("./sqs-consumer.service");
const sqs_consumer_controller_1 = require("./sqs-consumer.controller");
let SQSModule = class SQSModule {
};
exports.SQSModule = SQSModule;
exports.SQSModule = SQSModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            aws_1.AWSModule,
            excel_1.ExcelModule,
            pdf_1.PdfModule,
            xml_1.XmlModule,
            export_status_1.ExportStatusModule,
            s3_1.S3Module,
            manifiesto_1.ManifiestoModule,
        ],
        controllers: [sqs_consumer_controller_1.SQSConsumerController],
        providers: [sqs_consumer_service_1.SQSConsumerService],
        exports: [sqs_consumer_service_1.SQSConsumerService],
    })
], SQSModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNxcy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsOEJBQWlDO0FBQ2pDLGdDQUFtQztBQUNuQyxvQ0FBdUM7QUFDdkMsZ0NBQW1DO0FBQ25DLGdDQUFtQztBQUNuQywyQ0FBd0M7QUFDeEMsMkNBQThDO0FBQzlDLG9EQUFzRDtBQUN0RCw4Q0FBaUQ7QUFDakQsaUVBQTREO0FBQzVELHVFQUFrRTtBQWlCM0QsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFTO0NBQUcsQ0FBQTtBQUFaLDhCQUFTO29CQUFULFNBQVM7SUFmckIsSUFBQSxlQUFNLEVBQUM7UUFDTixPQUFPLEVBQUU7WUFDUCxxQkFBWTtZQUNaLGVBQVM7WUFDVCxtQkFBVztZQUNYLGVBQVM7WUFDVCxlQUFTO1lBQ1Qsa0NBQWtCO1lBQ2xCLGFBQVE7WUFDUiw2QkFBZ0I7U0FDakI7UUFDRCxXQUFXLEVBQUUsQ0FBQywrQ0FBcUIsQ0FBQztRQUNwQyxTQUFTLEVBQUUsQ0FBQyx5Q0FBa0IsQ0FBQztRQUMvQixPQUFPLEVBQUUsQ0FBQyx5Q0FBa0IsQ0FBQztLQUM5QixDQUFDO0dBQ1csU0FBUyxDQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUzNNb2R1bGUgfSBmcm9tICcuLi9zMyc7XHJcbmltcG9ydCB7IEFXU01vZHVsZSB9IGZyb20gJy4uL2F3cyc7XHJcbmltcG9ydCB7IEV4Y2VsTW9kdWxlIH0gZnJvbSAnLi4vZXhjZWwnO1xyXG5pbXBvcnQgeyBQZGZNb2R1bGUgfSBmcm9tICcuLi9wZGYnO1xyXG5pbXBvcnQgeyBYbWxNb2R1bGUgfSBmcm9tICcuLi94bWwnO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENvbmZpZ01vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29uZmlnJztcclxuaW1wb3J0IHsgRXhwb3J0U3RhdHVzTW9kdWxlIH0gZnJvbSAnLi4vZXhwb3J0LXN0YXR1cyc7XHJcbmltcG9ydCB7IE1hbmlmaWVzdG9Nb2R1bGUgfSBmcm9tICcuLi9tYW5pZmllc3RvJztcclxuaW1wb3J0IHsgU1FTQ29uc3VtZXJTZXJ2aWNlIH0gZnJvbSAnLi9zcXMtY29uc3VtZXIuc2VydmljZSc7XHJcbmltcG9ydCB7IFNRU0NvbnN1bWVyQ29udHJvbGxlciB9IGZyb20gJy4vc3FzLWNvbnN1bWVyLmNvbnRyb2xsZXInO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgaW1wb3J0czogW1xyXG4gICAgQ29uZmlnTW9kdWxlLFxyXG4gICAgQVdTTW9kdWxlLFxyXG4gICAgRXhjZWxNb2R1bGUsXHJcbiAgICBQZGZNb2R1bGUsXHJcbiAgICBYbWxNb2R1bGUsXHJcbiAgICBFeHBvcnRTdGF0dXNNb2R1bGUsXHJcbiAgICBTM01vZHVsZSxcclxuICAgIE1hbmlmaWVzdG9Nb2R1bGUsXHJcbiAgXSxcclxuICBjb250cm9sbGVyczogW1NRU0NvbnN1bWVyQ29udHJvbGxlcl0sXHJcbiAgcHJvdmlkZXJzOiBbU1FTQ29uc3VtZXJTZXJ2aWNlXSxcclxuICBleHBvcnRzOiBbU1FTQ29uc3VtZXJTZXJ2aWNlXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIFNRU01vZHVsZSB7fVxyXG4iXX0=