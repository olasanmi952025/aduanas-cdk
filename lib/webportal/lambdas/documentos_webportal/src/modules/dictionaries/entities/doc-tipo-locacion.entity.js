"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocTipoLocacion = void 0;
const typeorm_1 = require("typeorm");
let DocTipoLocacion = class DocTipoLocacion {
};
exports.DocTipoLocacion = DocTipoLocacion;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'CODIGO' })
], DocTipoLocacion.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'DESCRIPCION' })
], DocTipoLocacion.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA' })
], DocTipoLocacion.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocTipoLocacion.prototype, "fechaActiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocTipoLocacion.prototype, "fechaDesactiva", void 0);
exports.DocTipoLocacion = DocTipoLocacion = __decorate([
    (0, typeorm_1.Entity)('DOCTIPOLOCACION')
], DocTipoLocacion);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLXRpcG8tbG9jYWNpb24uZW50aXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jLXRpcG8tbG9jYWNpb24uZW50aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHFDQUF3RDtBQUdqRCxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO0NBZTNCLENBQUE7QUFmWSwwQ0FBZTtBQUUxQjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQzsrQ0FDbkI7QUFHZjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsQ0FBQztvREFDWjtBQUdwQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQzsrQ0FDWjtBQUdmO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7b0RBQzVCO0FBR2xCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3VEQUMzQzswQkFkWCxlQUFlO0lBRDNCLElBQUEsZ0JBQU0sRUFBQyxpQkFBaUIsQ0FBQztHQUNiLGVBQWUsQ0FlM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHksIENvbHVtbiwgUHJpbWFyeUNvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSgnRE9DVElQT0xPQ0FDSU9OJylcclxuZXhwb3J0IGNsYXNzIERvY1RpcG9Mb2NhY2lvbiB7XHJcbiAgQFByaW1hcnlDb2x1bW4oeyBuYW1lOiAnQ09ESUdPJyB9KVxyXG4gIGNvZGlnbzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0RFU0NSSVBDSU9OJyB9KVxyXG4gIGRlc2NyaXBjaW9uOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnQUNUSVZBJyB9KVxyXG4gIGFjdGl2YTogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0ZFQ0hBQUNUSVZBJywgdHlwZTogJ2RhdGUnIH0pXHJcbiAgZmVjaGFBY3RpdmE6IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSEFERVNBQ1RJVkEnLCB0eXBlOiAnZGF0ZScsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgZmVjaGFEZXNhY3RpdmE/OiBEYXRlO1xyXG59XHJcblxyXG4iXX0=