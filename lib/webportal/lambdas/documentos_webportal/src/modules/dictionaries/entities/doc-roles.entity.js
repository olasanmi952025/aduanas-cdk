"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocRoles = void 0;
const typeorm_1 = require("typeorm");
let DocRoles = class DocRoles {
};
exports.DocRoles = DocRoles;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'CODIGO' })
], DocRoles.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'DESCRIPCION' })
], DocRoles.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVA' })
], DocRoles.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAACTIVA', type: 'date' })
], DocRoles.prototype, "fechaActiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHADESACTIVA', type: 'date', nullable: true })
], DocRoles.prototype, "fechaDesactiva", void 0);
exports.DocRoles = DocRoles = __decorate([
    (0, typeorm_1.Entity)('DOCROLES')
], DocRoles);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLXJvbGVzLmVudGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRvYy1yb2xlcy5lbnRpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUNBQXdEO0FBR2pELElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtDQWVwQixDQUFBO0FBZlksNEJBQVE7QUFFbkI7SUFEQyxJQUFBLHVCQUFhLEVBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7d0NBQ25CO0FBR2Y7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUM7NkNBQ1o7QUFHcEI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7d0NBQ1o7QUFHZjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDOzZDQUM1QjtBQUdsQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnREFDM0M7bUJBZFgsUUFBUTtJQURwQixJQUFBLGdCQUFNLEVBQUMsVUFBVSxDQUFDO0dBQ04sUUFBUSxDQWVwQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVudGl0eSwgQ29sdW1uLCBQcmltYXJ5Q29sdW1uIH0gZnJvbSAndHlwZW9ybSc7XHJcblxyXG5ARW50aXR5KCdET0NST0xFUycpXHJcbmV4cG9ydCBjbGFzcyBEb2NSb2xlcyB7XHJcbiAgQFByaW1hcnlDb2x1bW4oeyBuYW1lOiAnQ09ESUdPJyB9KVxyXG4gIGNvZGlnbzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0RFU0NSSVBDSU9OJyB9KVxyXG4gIGRlc2NyaXBjaW9uOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnQUNUSVZBJyB9KVxyXG4gIGFjdGl2YTogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0ZFQ0hBQUNUSVZBJywgdHlwZTogJ2RhdGUnIH0pXHJcbiAgZmVjaGFBY3RpdmE6IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSEFERVNBQ1RJVkEnLCB0eXBlOiAnZGF0ZScsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgZmVjaGFEZXNhY3RpdmE/OiBEYXRlO1xyXG59XHJcblxyXG4iXX0=