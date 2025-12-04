"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheFactory = void 0;
const common_1 = require("@nestjs/common");
const cache_interface_1 = require("./interface/cache.interface");
const memory_cache_service_1 = require("./implements/memory-cache.service");
let CacheFactory = class CacheFactory {
    create(cacheType = cache_interface_1.CacheType.MEMORY) {
        switch (cacheType) {
            case cache_interface_1.CacheType.MEMORY:
                return new memory_cache_service_1.MemoryCacheService();
            default:
                return new memory_cache_service_1.MemoryCacheService();
        }
    }
};
exports.CacheFactory = CacheFactory;
exports.CacheFactory = CacheFactory = __decorate([
    (0, common_1.Injectable)()
], CacheFactory);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhY2hlLmZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMkNBQTRDO0FBQzVDLGlFQUF1RTtBQUN2RSw0RUFBdUU7QUFHaEUsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBWTtJQUN2QixNQUFNLENBQUMsWUFBdUIsMkJBQVMsQ0FBQyxNQUFNO1FBQzVDLFFBQVEsU0FBUyxFQUFFLENBQUM7WUFDbEIsS0FBSywyQkFBUyxDQUFDLE1BQU07Z0JBQ25CLE9BQU8sSUFBSSx5Q0FBa0IsRUFBRSxDQUFDO1lBRWxDO2dCQUNFLE9BQU8sSUFBSSx5Q0FBa0IsRUFBRSxDQUFDO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQTtBQVZZLG9DQUFZO3VCQUFaLFlBQVk7SUFEeEIsSUFBQSxtQkFBVSxHQUFFO0dBQ0EsWUFBWSxDQVV4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IElDYWNoZVNlcnZpY2UsIENhY2hlVHlwZSB9IGZyb20gJy4vaW50ZXJmYWNlL2NhY2hlLmludGVyZmFjZSc7XHJcbmltcG9ydCB7IE1lbW9yeUNhY2hlU2VydmljZSB9IGZyb20gJy4vaW1wbGVtZW50cy9tZW1vcnktY2FjaGUuc2VydmljZSc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBDYWNoZUZhY3Rvcnkge1xyXG4gIGNyZWF0ZShjYWNoZVR5cGU6IENhY2hlVHlwZSA9IENhY2hlVHlwZS5NRU1PUlkpOiBJQ2FjaGVTZXJ2aWNlIHtcclxuICAgIHN3aXRjaCAoY2FjaGVUeXBlKSB7XHJcbiAgICAgIGNhc2UgQ2FjaGVUeXBlLk1FTU9SWTpcclxuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeUNhY2hlU2VydmljZSgpO1xyXG5cclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gbmV3IE1lbW9yeUNhY2hlU2VydmljZSgpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuIl19