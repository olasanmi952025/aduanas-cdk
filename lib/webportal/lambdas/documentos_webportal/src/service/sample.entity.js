"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleEntity = void 0;
const typeorm_1 = require("typeorm");
let SampleEntity = class SampleEntity {
};
exports.SampleEntity = SampleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid')
], SampleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 })
], SampleEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true })
], SampleEntity.prototype, "isActive", void 0);
exports.SampleEntity = SampleEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'samples' })
], SampleEntity);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FtcGxlLmVudGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNhbXBsZS5lbnRpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUNBQWlFO0FBRzFELElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7Q0FTeEIsQ0FBQTtBQVRZLG9DQUFZO0FBRXZCO0lBREMsSUFBQSxnQ0FBc0IsRUFBQyxNQUFNLENBQUM7d0NBQ25CO0FBR1o7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQzswQ0FDM0I7QUFHZDtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDOzhDQUN4Qjt1QkFSUixZQUFZO0lBRHhCLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztHQUNmLFlBQVksQ0FTeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2x1bW4sIEVudGl0eSwgUHJpbWFyeUdlbmVyYXRlZENvbHVtbiB9IGZyb20gJ3R5cGVvcm0nO1xyXG5cclxuQEVudGl0eSh7IG5hbWU6ICdzYW1wbGVzJyB9KVxyXG5leHBvcnQgY2xhc3MgU2FtcGxlRW50aXR5IHtcclxuICBAUHJpbWFyeUdlbmVyYXRlZENvbHVtbigndXVpZCcpXHJcbiAgaWQhOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyB0eXBlOiAndmFyY2hhcicsIGxlbmd0aDogMTIwIH0pXHJcbiAgbmFtZSE6IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogdHJ1ZSB9KVxyXG4gIGlzQWN0aXZlITogYm9vbGVhbjtcclxufVxyXG5cclxuXHJcbiJdfQ==