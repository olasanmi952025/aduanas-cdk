"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocParticipacion = void 0;
const typeorm_1 = require("typeorm");
let DocParticipacion = class DocParticipacion {
};
exports.DocParticipacion = DocParticipacion;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'DOCUMENTO', type: 'number' })
], DocParticipacion.prototype, "documento", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'ROL' })
], DocParticipacion.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'IDPERSONAPARTICIPANTE', type: 'number', nullable: true })
], DocParticipacion.prototype, "idPersonaParticipante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NOMBREPARTICIPANTE', nullable: true })
], DocParticipacion.prototype, "nombreParticipante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'CODIGOPAIS', nullable: true })
], DocParticipacion.prototype, "codigoPais", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'TIPOID', nullable: true })
], DocParticipacion.prototype, "tipoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NACID', nullable: true })
], DocParticipacion.prototype, "nacId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NUMEROID', nullable: true })
], DocParticipacion.prototype, "numeroId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA' })
], DocParticipacion.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocParticipacion.prototype, "fechaActiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocParticipacion.prototype, "fechaDesactiva", void 0);
exports.DocParticipacion = DocParticipacion = __decorate([
    (0, typeorm_1.Entity)('DOCPARTICIPACION')
], DocParticipacion);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLXBhcnRpY2lwYWNpb24uZW50aXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jLXBhcnRpY2lwYWNpb24uZW50aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHFDQUF3RDtBQUdqRCxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtDQWlDNUIsQ0FBQTtBQWpDWSw0Q0FBZ0I7QUFFM0I7SUFEQyxJQUFBLHVCQUFhLEVBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQzttREFDbkM7QUFHbEI7SUFEQyxJQUFBLHVCQUFhLEVBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7NkNBQ25CO0FBR1o7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7K0RBQzNDO0FBRy9CO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzs0REFDM0I7QUFHNUI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztvREFDM0I7QUFHcEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnREFDM0I7QUFHaEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzsrQ0FDM0I7QUFHZjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2tEQUMzQjtBQUdsQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnREFDWjtBQUdmO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7cURBQzVCO0FBR2xCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3dEQUMzQzsyQkFoQ1gsZ0JBQWdCO0lBRDVCLElBQUEsZ0JBQU0sRUFBQyxrQkFBa0IsQ0FBQztHQUNkLGdCQUFnQixDQWlDNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHksIENvbHVtbiwgUHJpbWFyeUNvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSgnRE9DUEFSVElDSVBBQ0lPTicpXHJcbmV4cG9ydCBjbGFzcyBEb2NQYXJ0aWNpcGFjaW9uIHtcclxuICBAUHJpbWFyeUNvbHVtbih7IG5hbWU6ICdET0NVTUVOVE8nLCB0eXBlOiAnbnVtYmVyJyB9KVxyXG4gIGRvY3VtZW50bzogbnVtYmVyO1xyXG5cclxuICBAUHJpbWFyeUNvbHVtbih7IG5hbWU6ICdST0wnIH0pXHJcbiAgcm9sOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnSURQRVJTT05BUEFSVElDSVBBTlRFJywgdHlwZTogJ251bWJlcicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgaWRQZXJzb25hUGFydGljaXBhbnRlPzogbnVtYmVyO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ05PTUJSRVBBUlRJQ0lQQU5URScsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgbm9tYnJlUGFydGljaXBhbnRlPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0NPRElHT1BBSVMnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGNvZGlnb1BhaXM/OiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnVElQT0lEJywgbnVsbGFibGU6IHRydWUgfSlcclxuICB0aXBvSWQ/OiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnTkFDSUQnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIG5hY0lkPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ05VTUVST0lEJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBudW1lcm9JZD86IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdBQ1RJVkEnIH0pXHJcbiAgYWN0aXZhOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSEFBQ1RJVkEnLCB0eXBlOiAnZGF0ZScgfSlcclxuICBmZWNoYUFjdGl2YTogRGF0ZTtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQURFU0FDVElWQScsIHR5cGU6ICdkYXRlJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBmZWNoYURlc2FjdGl2YT86IERhdGU7XHJcbn1cclxuXHJcbiJdfQ==