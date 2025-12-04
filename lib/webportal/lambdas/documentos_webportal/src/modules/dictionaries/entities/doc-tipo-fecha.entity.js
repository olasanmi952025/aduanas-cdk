"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocTipoFecha = void 0;
const typeorm_1 = require("typeorm");
let DocTipoFecha = class DocTipoFecha {
};
exports.DocTipoFecha = DocTipoFecha;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'CODIGO', length: 10 })
], DocTipoFecha.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'DESCRIPCION', length: 30 })
], DocTipoFecha.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA' })
], DocTipoFecha.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocTipoFecha.prototype, "fechaActiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocTipoFecha.prototype, "fechaDesactiva", void 0);
exports.DocTipoFecha = DocTipoFecha = __decorate([
    (0, typeorm_1.Entity)('DOCTIPOFECHA')
], DocTipoFecha);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLXRpcG8tZmVjaGEuZW50aXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jLXRpcG8tZmVjaGEuZW50aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHFDQUF3RDtBQUdqRCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO0NBZXhCLENBQUE7QUFmWSxvQ0FBWTtBQUV2QjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRDQUM5QjtBQUdmO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUM7aURBQ3hCO0FBR3BCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDOzRDQUNaO0FBR2Y7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztpREFDNUI7QUFHbEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7b0RBQzNDO3VCQWRYLFlBQVk7SUFEeEIsSUFBQSxnQkFBTSxFQUFDLGNBQWMsQ0FBQztHQUNWLFlBQVksQ0FleEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHksIENvbHVtbiwgUHJpbWFyeUNvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSgnRE9DVElQT0ZFQ0hBJylcclxuZXhwb3J0IGNsYXNzIERvY1RpcG9GZWNoYSB7XHJcbiAgQFByaW1hcnlDb2x1bW4oeyBuYW1lOiAnQ09ESUdPJyxsZW5ndGg6IDEwIH0pXHJcbiAgY29kaWdvOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnREVTQ1JJUENJT04nLCBsZW5ndGg6IDMwIH0pXHJcbiAgZGVzY3JpcGNpb246IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdBQ1RJVkEnIH0pXHJcbiAgYWN0aXZhOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSEFBQ1RJVkEnLCB0eXBlOiAnZGF0ZScgfSlcclxuICBmZWNoYUFjdGl2YTogRGF0ZTtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQURFU0FDVElWQScsIHR5cGU6ICdkYXRlJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBmZWNoYURlc2FjdGl2YT86IERhdGU7XHJcbn0iXX0=