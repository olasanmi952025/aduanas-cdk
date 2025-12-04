"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestJobMapping = void 0;
const typeorm_1 = require("typeorm");
/**
 * Entidad para mapear documentoId -> jobId del polling_process
 * Permite consultar el estado de un proceso por documentoId
 */
let ManifestJobMapping = class ManifestJobMapping {
};
exports.ManifestJobMapping = ManifestJobMapping;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'DOCUMENTO_ID' })
], ManifestJobMapping.prototype, "documentoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'JOB_ID' })
], ManifestJobMapping.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'PROCESS_TYPE' })
], ManifestJobMapping.prototype, "processType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'CREATED_AT', type: 'timestamp' })
], ManifestJobMapping.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'STATUS', nullable: true })
], ManifestJobMapping.prototype, "status", void 0);
exports.ManifestJobMapping = ManifestJobMapping = __decorate([
    (0, typeorm_1.Entity)('MANIFEST_JOB_MAPPING')
], ManifestJobMapping);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuaWZlc3Qtam9iLW1hcHBpbmcuZW50aXR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFuaWZlc3Qtam9iLW1hcHBpbmcuZW50aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHFDQUF3RDtBQUV4RDs7O0dBR0c7QUFFSSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtDQWU5QixDQUFBO0FBZlksZ0RBQWtCO0FBRTdCO0lBREMsSUFBQSx1QkFBYSxFQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxDQUFDO3VEQUNwQjtBQUdwQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztpREFDYjtBQUdkO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxDQUFDO3VEQUNiO0FBR3BCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7cURBQ2xDO0FBR2hCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7a0RBQzNCOzZCQWRMLGtCQUFrQjtJQUQ5QixJQUFBLGdCQUFNLEVBQUMsc0JBQXNCLENBQUM7R0FDbEIsa0JBQWtCLENBZTlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5LCBDb2x1bW4sIFByaW1hcnlDb2x1bW4gfSBmcm9tICd0eXBlb3JtJztcclxuXHJcbi8qKlxyXG4gKiBFbnRpZGFkIHBhcmEgbWFwZWFyIGRvY3VtZW50b0lkIC0+IGpvYklkIGRlbCBwb2xsaW5nX3Byb2Nlc3NcclxuICogUGVybWl0ZSBjb25zdWx0YXIgZWwgZXN0YWRvIGRlIHVuIHByb2Nlc28gcG9yIGRvY3VtZW50b0lkXHJcbiAqL1xyXG5ARW50aXR5KCdNQU5JRkVTVF9KT0JfTUFQUElORycpXHJcbmV4cG9ydCBjbGFzcyBNYW5pZmVzdEpvYk1hcHBpbmcge1xyXG4gIEBQcmltYXJ5Q29sdW1uKHsgbmFtZTogJ0RPQ1VNRU5UT19JRCcgfSlcclxuICBkb2N1bWVudG9JZDogbnVtYmVyO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0pPQl9JRCcgfSlcclxuICBqb2JJZDogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ1BST0NFU1NfVFlQRScgfSlcclxuICBwcm9jZXNzVHlwZTogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0NSRUFURURfQVQnLCB0eXBlOiAndGltZXN0YW1wJyB9KVxyXG4gIGNyZWF0ZWRBdDogRGF0ZTtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdTVEFUVVMnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIHN0YXR1cz86IHN0cmluZztcclxufVxyXG5cclxuIl19