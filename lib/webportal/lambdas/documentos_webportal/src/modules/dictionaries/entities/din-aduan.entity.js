"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DinAduan = void 0;
const typeorm_1 = require("typeorm");
let DinAduan = class DinAduan {
};
exports.DinAduan = DinAduan;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'CODADU' })
], DinAduan.prototype, "codAdu", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'GLOADU', nullable: true })
], DinAduan.prototype, "gloAdu", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'AUTORI', nullable: true })
], DinAduan.prototype, "autori", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECINI', type: 'date', nullable: true })
], DinAduan.prototype, "fecIni", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECFIN', type: 'date', nullable: true })
], DinAduan.prototype, "fecFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'SIGLA', nullable: true })
], DinAduan.prototype, "sigla", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FILTROWEB', nullable: true })
], DinAduan.prototype, "filtroWeb", void 0);
exports.DinAduan = DinAduan = __decorate([
    (0, typeorm_1.Entity)({ name: 'ADUAN', schema: 'DIN' })
], DinAduan);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGluLWFkdWFuLmVudGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpbi1hZHVhbi5lbnRpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUNBQXdEO0FBR2pELElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtDQXFCcEIsQ0FBQTtBQXJCWSw0QkFBUTtBQUVuQjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQzt3Q0FDbkI7QUFHZjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3dDQUMzQjtBQUdoQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3dDQUMzQjtBQUdoQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7d0NBQzNDO0FBR2Q7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3dDQUMzQztBQUdkO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7dUNBQzNCO0FBR2Y7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzsyQ0FDM0I7bUJBcEJSLFFBQVE7SUFEcEIsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7R0FDNUIsUUFBUSxDQXFCcEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbnRpdHksIENvbHVtbiwgUHJpbWFyeUNvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSh7IG5hbWU6ICdBRFVBTicsIHNjaGVtYTogJ0RJTicgfSlcclxuZXhwb3J0IGNsYXNzIERpbkFkdWFuIHtcclxuICBAUHJpbWFyeUNvbHVtbih7IG5hbWU6ICdDT0RBRFUnIH0pXHJcbiAgY29kQWR1OiBudW1iZXI7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnR0xPQURVJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBnbG9BZHU/OiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnQVVUT1JJJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBhdXRvcmk/OiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSU5JJywgdHlwZTogJ2RhdGUnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGZlY0luaT86IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDRklOJywgdHlwZTogJ2RhdGUnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGZlY0Zpbj86IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnU0lHTEEnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIHNpZ2xhPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0ZJTFRST1dFQicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgZmlsdHJvV2ViPzogc3RyaW5nO1xyXG59XHJcblxyXG4iXX0=