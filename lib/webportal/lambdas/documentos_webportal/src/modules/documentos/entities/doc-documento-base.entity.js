"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocDocumentoBase = void 0;
const typeorm_1 = require("typeorm");
let DocDocumentoBase = class DocDocumentoBase {
};
exports.DocDocumentoBase = DocDocumentoBase;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'ID' })
], DocDocumentoBase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'TIPODOCUMENTO' })
], DocDocumentoBase.prototype, "tipoDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'VERSION' })
], DocDocumentoBase.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAVERSION', type: 'date' })
], DocDocumentoBase.prototype, "fechaVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NUMEROEXTERNO' })
], DocDocumentoBase.prototype, "numeroExterno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'LOGINCREADOR' })
], DocDocumentoBase.prototype, "loginCreador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'CREADOR' })
], DocDocumentoBase.prototype, "creador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'LOGINDIGITADOR', nullable: true })
], DocDocumentoBase.prototype, "loginDigitador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHACREACION', type: 'date' })
], DocDocumentoBase.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAEMISION', type: 'date' })
], DocDocumentoBase.prototype, "fechaEmision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'FECHAFINVIGENCIA', type: 'date', nullable: true })
], DocDocumentoBase.prototype, "fechaFinVigencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ACTIVO' })
], DocDocumentoBase.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'VERSIONTIPODOC' })
], DocDocumentoBase.prototype, "versionTipoDoc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'CODAREACREADOR', nullable: true })
], DocDocumentoBase.prototype, "codAreaCreador", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'IDEMISOR' })
], DocDocumentoBase.prototype, "idEmisor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'EMISOR' })
], DocDocumentoBase.prototype, "emisor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ARCHIVOXMLORIGEN', type: 'clob', nullable: true })
], DocDocumentoBase.prototype, "archivoXmlOrigen", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ARCHIVOXMLMODIFICACION', type: 'clob', nullable: true })
], DocDocumentoBase.prototype, "archivoXmlModificacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'XML', type: 'clob', nullable: true })
], DocDocumentoBase.prototype, "xml", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'PDF', type: 'blob', nullable: true })
], DocDocumentoBase.prototype, "pdf", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ESVALIDOXML', nullable: true })
], DocDocumentoBase.prototype, "esValidoXml", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ESVALIDOPDF', nullable: true })
], DocDocumentoBase.prototype, "esValidoPdf", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'NUMEROACEPTACION', type: 'number', nullable: true })
], DocDocumentoBase.prototype, "numeroAceptacion", void 0);
exports.DocDocumentoBase = DocDocumentoBase = __decorate([
    (0, typeorm_1.Entity)('DOCDOCUMENTOBASE')
], DocDocumentoBase);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLWRvY3VtZW50by1iYXNlLmVudGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRvYy1kb2N1bWVudG8tYmFzZS5lbnRpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUNBQXdEO0FBR2pELElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO0NBcUU1QixDQUFBO0FBckVZLDRDQUFnQjtBQUUzQjtJQURDLElBQUEsdUJBQWEsRUFBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQzs0Q0FDbkI7QUFHWDtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsQ0FBQzt1REFDWjtBQUd0QjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztpREFDWjtBQUdoQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO3NEQUM1QjtBQUduQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsQ0FBQzt1REFDWjtBQUd0QjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQztzREFDWjtBQUdyQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztpREFDWjtBQUdoQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7d0RBQzNCO0FBR3hCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7dURBQzVCO0FBR3BCO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7c0RBQzVCO0FBR25CO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDOzBEQUMzQztBQUd4QjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnREFDWjtBQUdmO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUM7d0RBQ1o7QUFHdkI7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3dEQUMzQjtBQUd4QjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQztrREFDWjtBQUdqQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnREFDWjtBQUdmO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDOzBEQUN6QztBQUcxQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnRUFDekM7QUFHaEM7SUFEQyxJQUFBLGdCQUFNLEVBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDOzZDQUN6QztBQUdiO0lBREMsSUFBQSxnQkFBTSxFQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzs2Q0FDekM7QUFHYjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3FEQUMzQjtBQUdyQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO3FEQUMzQjtBQUdyQjtJQURDLElBQUEsZ0JBQU0sRUFBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQzswREFDM0M7MkJBcEVmLGdCQUFnQjtJQUQ1QixJQUFBLGdCQUFNLEVBQUMsa0JBQWtCLENBQUM7R0FDZCxnQkFBZ0IsQ0FxRTVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW50aXR5LCBDb2x1bW4sIFByaW1hcnlDb2x1bW4gfSBmcm9tICd0eXBlb3JtJztcclxuXHJcbkBFbnRpdHkoJ0RPQ0RPQ1VNRU5UT0JBU0UnKVxyXG5leHBvcnQgY2xhc3MgRG9jRG9jdW1lbnRvQmFzZSB7XHJcbiAgQFByaW1hcnlDb2x1bW4oeyBuYW1lOiAnSUQnIH0pXHJcbiAgaWQ6IG51bWJlcjtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdUSVBPRE9DVU1FTlRPJyB9KVxyXG4gIHRpcG9Eb2N1bWVudG86IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdWRVJTSU9OJyB9KVxyXG4gIHZlcnNpb246IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQVZFUlNJT04nLCB0eXBlOiAnZGF0ZScgfSlcclxuICBmZWNoYVZlcnNpb246IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnTlVNRVJPRVhURVJOTycgfSlcclxuICBudW1lcm9FeHRlcm5vOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnTE9HSU5DUkVBRE9SJyB9KVxyXG4gIGxvZ2luQ3JlYWRvcjogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0NSRUFET1InIH0pXHJcbiAgY3JlYWRvcjogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0xPR0lORElHSVRBRE9SJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBsb2dpbkRpZ2l0YWRvcj86IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQUNSRUFDSU9OJywgdHlwZTogJ2RhdGUnIH0pXHJcbiAgZmVjaGFDcmVhY2lvbjogRGF0ZTtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdGRUNIQUVNSVNJT04nLCB0eXBlOiAnZGF0ZScgfSlcclxuICBmZWNoYUVtaXNpb246IERhdGU7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRkVDSEFGSU5WSUdFTkNJQScsIHR5cGU6ICdkYXRlJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBmZWNoYUZpblZpZ2VuY2lhPzogRGF0ZTtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdBQ1RJVk8nIH0pXHJcbiAgYWN0aXZvOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnVkVSU0lPTlRJUE9ET0MnIH0pXHJcbiAgdmVyc2lvblRpcG9Eb2M6IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdDT0RBUkVBQ1JFQURPUicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgY29kQXJlYUNyZWFkb3I/OiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnSURFTUlTT1InIH0pXHJcbiAgaWRFbWlzb3I6IG51bWJlcjtcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdFTUlTT1InIH0pXHJcbiAgZW1pc29yOiBzdHJpbmc7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnQVJDSElWT1hNTE9SSUdFTicsIHR5cGU6ICdjbG9iJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBhcmNoaXZvWG1sT3JpZ2VuPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0FSQ0hJVk9YTUxNT0RJRklDQUNJT04nLCB0eXBlOiAnY2xvYicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgYXJjaGl2b1htbE1vZGlmaWNhY2lvbj86IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdYTUwnLCB0eXBlOiAnY2xvYicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgeG1sPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ1BERicsIHR5cGU6ICdibG9iJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBwZGY/OiBCdWZmZXI7XHJcblxyXG4gIEBDb2x1bW4oeyBuYW1lOiAnRVNWQUxJRE9YTUwnLCBudWxsYWJsZTogdHJ1ZSB9KVxyXG4gIGVzVmFsaWRvWG1sPzogc3RyaW5nO1xyXG5cclxuICBAQ29sdW1uKHsgbmFtZTogJ0VTVkFMSURPUERGJywgbnVsbGFibGU6IHRydWUgfSlcclxuICBlc1ZhbGlkb1BkZj86IHN0cmluZztcclxuXHJcbiAgQENvbHVtbih7IG5hbWU6ICdOVU1FUk9BQ0VQVEFDSU9OJywgdHlwZTogJ251bWJlcicsIG51bGxhYmxlOiB0cnVlIH0pXHJcbiAgbnVtZXJvQWNlcHRhY2lvbj86IG51bWJlcjtcclxufSJdfQ==