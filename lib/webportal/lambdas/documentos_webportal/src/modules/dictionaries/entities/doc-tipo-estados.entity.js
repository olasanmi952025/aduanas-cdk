"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocStatusType = void 0;
const typeorm_1 = require("typeorm");
let DocStatusType = class DocStatusType {
};
exports.DocStatusType = DocStatusType;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'TIPODOCUMENTO', length: 10 })
], DocStatusType.prototype, "document_type", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'CODIGO', length: 10 })
], DocStatusType.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NOMBRE', length: 30 })
], DocStatusType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'DESCRIPCION', length: 255 })
], DocStatusType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA', length: 1 })
], DocStatusType.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocStatusType.prototype, "active_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocStatusType.prototype, "inactive_date", void 0);
exports.DocStatusType = DocStatusType = __decorate([
    (0, typeorm_1.Entity)('DOCTIPOESTADO')
], DocStatusType);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLXRpcG8tZXN0YWRvcy5lbnRpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2MtdGlwby1lc3RhZG9zLmVudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxxQ0FBd0Q7QUFHakQsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYTtDQXFCekIsQ0FBQTtBQXJCWSxzQ0FBYTtBQUV4QjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDO29EQUMvQjtBQUd0QjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDOzJDQUNqQztBQUdiO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUM7MkNBQzFCO0FBR2I7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztrREFDekI7QUFHcEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQzs2Q0FDdkI7QUFHZjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO2tEQUM1QjtBQUdsQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztvREFDNUM7d0JBcEJWLGFBQWE7SUFEekIsSUFBQSxnQkFBTSxFQUFDLGVBQWUsQ0FBQztHQUNYLGFBQWEsQ0FxQnpCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5LCBDb2x1bW4sIFByaW1hcnlDb2x1bW4gfSBmcm9tICd0eXBlb3JtJztcclxuXHJcbkBFbnRpdHkoJ0RPQ1RJUE9FU1RBRE8nKVxyXG5leHBvcnQgY2xhc3MgRG9jU3RhdHVzVHlwZSB7XHJcbiAgQFByaW1hcnlDb2x1bW4oeyBuYW1lOiAnVElQT0RPQ1VNRU5UTycsIGxlbmd0aDogMTAgfSlcclxuICBkb2N1bWVudF90eXBlOiBzdHJpbmc7XHJcblxyXG4gIEBQcmltYXJ5Q29sdW1uKHsgbmFtZTogJ0NPRElHTycsIGxlbmd0aDogMTAgfSlcclxuICBjb2RlOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnTk9NQlJFJywgbGVuZ3RoOiAzMCB9KVxyXG4gIG5hbWU6IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdERVNDUklQQ0lPTicsIGxlbmd0aDogMjU1IH0pXHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdBQ1RJVkEnLCBsZW5ndGg6IDEgfSlcclxuICBhY3RpdmU6IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQUFDVElWQScsIHR5cGU6ICdkYXRlJyB9KVxyXG4gIGFjdGl2ZV9kYXRlOiBEYXRlO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0ZFQ0hBREVTQUNUSVZBJywgdHlwZTogJ2RhdGUnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGluYWN0aXZlX2RhdGU/OiBEYXRlO1xyXG59Il19