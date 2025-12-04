"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifiestoModule = void 0;
const common_1 = require("@nestjs/common");
const close_manifest_service_1 = require("./close-manifest.service");
let ManifiestoModule = class ManifiestoModule {
};
exports.ManifiestoModule = ManifiestoModule;
exports.ManifiestoModule = ManifiestoModule = __decorate([
    (0, common_1.Module)({
        providers: [close_manifest_service_1.CloseManifestService],
        exports: [close_manifest_service_1.CloseManifestService],
    })
], ManifiestoModule);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuaWZpZXN0by5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYW5pZmllc3RvLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwyQ0FBd0M7QUFDeEMscUVBQWdFO0FBTXpELElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO0NBQUcsQ0FBQTtBQUFuQiw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUo1QixJQUFBLGVBQU0sRUFBQztRQUNOLFNBQVMsRUFBRSxDQUFDLDZDQUFvQixDQUFDO1FBQ2pDLE9BQU8sRUFBRSxDQUFDLDZDQUFvQixDQUFDO0tBQ2hDLENBQUM7R0FDVyxnQkFBZ0IsQ0FBRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcclxuaW1wb3J0IHsgQ2xvc2VNYW5pZmVzdFNlcnZpY2UgfSBmcm9tICcuL2Nsb3NlLW1hbmlmZXN0LnNlcnZpY2UnO1xyXG5cclxuQE1vZHVsZSh7XHJcbiAgcHJvdmlkZXJzOiBbQ2xvc2VNYW5pZmVzdFNlcnZpY2VdLFxyXG4gIGV4cG9ydHM6IFtDbG9zZU1hbmlmZXN0U2VydmljZV0sXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBNYW5pZmllc3RvTW9kdWxlIHt9XHJcblxyXG4iXX0=