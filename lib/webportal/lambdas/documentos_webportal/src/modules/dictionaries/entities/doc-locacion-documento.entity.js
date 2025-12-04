"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocLocacionDocumento = void 0;
const typeorm_1 = require("typeorm");
let DocLocacionDocumento = class DocLocacionDocumento {
};
exports.DocLocacionDocumento = DocLocacionDocumento;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'DOCUMENTO', type: 'number' })
], DocLocacionDocumento.prototype, "documento", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'TIPOLOCACION' })
], DocLocacionDocumento.prototype, "tipoLocacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'IDLOCACION', type: 'number' })
], DocLocacionDocumento.prototype, "idLocacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'CODIGOLOCACION' })
], DocLocacionDocumento.prototype, "codigoLocacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'LOCACION' })
], DocLocacionDocumento.prototype, "locacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA' })
], DocLocacionDocumento.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocLocacionDocumento.prototype, "fechaActiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocLocacionDocumento.prototype, "fechaDesactiva", void 0);
exports.DocLocacionDocumento = DocLocacionDocumento = __decorate([
    (0, typeorm_1.Entity)('DOCLOCACIONDOCUMENTO')
], DocLocacionDocumento);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLWxvY2FjaW9uLWRvY3VtZW50by5lbnRpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2MtbG9jYWNpb24tZG9jdW1lbnRvLmVudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxxQ0FBd0Q7QUFHakQsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7Q0F3QmhDLENBQUE7QUF4Qlksb0RBQW9CO0FBRS9CO0lBREMsSUFBQSx1QkFBYSxFQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7dURBQ25DO0FBR2xCO0lBREMsSUFBQSx1QkFBYSxFQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxDQUFDOzBEQUNuQjtBQUdyQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO3dEQUM1QjtBQUduQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxDQUFDOzREQUNaO0FBR3ZCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDO3NEQUNaO0FBR2pCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO29EQUNaO0FBR2Y7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQzt5REFDNUI7QUFHbEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7NERBQzNDOytCQXZCWCxvQkFBb0I7SUFEaEMsSUFBQSxnQkFBTSxFQUFDLHNCQUFzQixDQUFDO0dBQ2xCLG9CQUFvQixDQXdCaEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHksIENvbHVtbiwgUHJpbWFyeUNvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSgnRE9DTE9DQUNJT05ET0NVTUVOVE8nKVxyXG5leHBvcnQgY2xhc3MgRG9jTG9jYWNpb25Eb2N1bWVudG8ge1xyXG4gIEBQcmltYXJ5Q29sdW1uKHsgbmFtZTogJ0RPQ1VNRU5UTycsIHR5cGU6ICdudW1iZXInIH0pXHJcbiAgZG9jdW1lbnRvOiBudW1iZXI7XHJcblxyXG4gIEBQcmltYXJ5Q29sdW1uKHsgbmFtZTogJ1RJUE9MT0NBQ0lPTicgfSlcclxuICB0aXBvTG9jYWNpb246IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdJRExPQ0FDSU9OJywgdHlwZTogJ251bWJlcicgfSlcclxuICBpZExvY2FjaW9uOiBudW1iZXI7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnQ09ESUdPTE9DQUNJT04nIH0pXHJcbiAgY29kaWdvTG9jYWNpb246IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdMT0NBQ0lPTicgfSlcclxuICBsb2NhY2lvbjogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0FDVElWQScgfSlcclxuICBhY3RpdmE6IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQUFDVElWQScsIHR5cGU6ICdkYXRlJyB9KVxyXG4gIGZlY2hhQWN0aXZhOiBEYXRlO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0ZFQ0hBREVTQUNUSVZBJywgdHlwZTogJ2RhdGUnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGZlY2hhRGVzYWN0aXZhPzogRGF0ZTtcclxufVxyXG5cclxuIl19