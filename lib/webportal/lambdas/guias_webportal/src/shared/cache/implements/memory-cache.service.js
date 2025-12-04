"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var MemoryCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCacheService = void 0;
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
let MemoryCacheService = MemoryCacheService_1 = class MemoryCacheService {
    constructor() {
        this.lastCleanupTime = Date.now();
        this.DEFAULT_TTL = 5 * 60 * 1000;
        this.CLEANUP_INTERVAL = 60 * 1000;
        this.cache = new Map();
        this.logger = new common_1.Logger(MemoryCacheService_1.name);
    }
    /**
     * Genera una clave de cache a partir de un objeto
     * @param data
     * @returns
     */
    generateKey(data) {
        const sortedKeys = Object.keys(data).sort();
        const sortedObject = {};
        sortedKeys.forEach(key => {
            sortedObject[key] = data[key];
        });
        const dataString = JSON.stringify(sortedObject);
        this.logger.log(`Se generó la clave de cache: ${crypto.createHash('md5').update(dataString).digest('hex')}`);
        return crypto.createHash('md5').update(dataString).digest('hex');
    }
    /**
     * Obtiene un valor del cache si existe y no ha expirado
     */
    get(key, ttl = this.DEFAULT_TTL) {
        this.cleanupIfNeeded();
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Verificar si el cache ha expirado
        const now = Date.now();
        if (now - entry.timestamp > ttl) {
            this.cache.delete(key);
            return null;
        }
        this.logger.log(`Se encontró el valor en el cache para la clave: ${key}`);
        return entry.value;
    }
    /**
     * Guarda un valor en el cache
     */
    set(key, value, ttl = this.DEFAULT_TTL) {
        this.cleanupIfNeeded();
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
        this.logger.log(`Se guardó el valor en el cache para la clave: ${key}`);
    }
    /**
     * Elimina una entrada del cache
     */
    delete(key) {
        this.cache.delete(key);
        this.logger.log(`Se eliminó el valor en el cache para la clave: ${key}`);
    }
    /**
     * Limpia todas las entradas del cache
     */
    clear() {
        this.cache.clear();
        this.logger.log(`Se limpió el cache`);
    }
    /**
     * Limpia las entradas expiradas del cache
     */
    cleanExpiredCache(ttl = this.DEFAULT_TTL) {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.cache.delete(key);
                this.logger.log(`Se limpiaron las entradas expiradas del cache`);
            }
        }
    }
    /**
     * Limpia el cache expirado si ha pasado el intervalo de limpieza
     */
    cleanupIfNeeded() {
        const now = Date.now();
        if (now - this.lastCleanupTime >= this.CLEANUP_INTERVAL) {
            this.cleanExpiredCache();
            this.lastCleanupTime = now;
            this.logger.log(`Se limpió el cache si ha pasado el intervalo de limpieza`);
        }
    }
    /**
     * Obtiene el tamaño actual del cache
     */
    size() {
        return this.cache.size;
    }
};
exports.MemoryCacheService = MemoryCacheService;
exports.MemoryCacheService = MemoryCacheService = MemoryCacheService_1 = __decorate([
    (0, common_1.Injectable)()
], MemoryCacheService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtb3J5LWNhY2hlLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZW1vcnktY2FjaGUuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUFvRDtBQUk3QyxJQUFNLGtCQUFrQiwwQkFBeEIsTUFBTSxrQkFBa0I7SUFBeEI7UUFDRyxvQkFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixnQkFBVyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzVCLHFCQUFnQixHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDdEMsVUFBSyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1FBQ2xDLFdBQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxvQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQW9HaEUsQ0FBQztJQWxHQzs7OztPQUlHO0lBQ0gsV0FBVyxDQUFDLElBQXlCO1FBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUMsTUFBTSxZQUFZLEdBQXdCLEVBQUUsQ0FBQztRQUM3QyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFD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QUFHLENBQUMsMERBQTBELENBQUMsQ0FBQztRQUM5RSxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDekIsQ0FBQztDQUNGLENBQUE7QUF6R1ksZ0RBQWtCOzZCQUFsQixrQkFBa0I7SUFEOUIsSUFBQSxtQkFBVSxHQUFFO0dBQ0Esa0JBQWtCLENBeUc5QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNyeXB0byBmcm9tICdjcnlwdG8nO1xyXG5pbXBvcnQgeyBJbmplY3RhYmxlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XHJcbmltcG9ydCB7IENhY2hlRW50cnksIElDYWNoZVNlcnZpY2UgfSBmcm9tICcuLi9pbnRlcmZhY2UvY2FjaGUuaW50ZXJmYWNlJztcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE1lbW9yeUNhY2hlU2VydmljZSBpbXBsZW1lbnRzIElDYWNoZVNlcnZpY2Uge1xyXG4gIHByaXZhdGUgbGFzdENsZWFudXBUaW1lID0gRGF0ZS5ub3coKTtcclxuICBwcml2YXRlIHJlYWRvbmx5IERFRkFVTFRfVFRMID0gNSAqIDYwICogMTAwMDtcclxuICBwcml2YXRlIHJlYWRvbmx5IENMRUFOVVBfSU5URVJWQUwgPSA2MCAqIDEwMDA7XHJcbiAgcHJpdmF0ZSBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBDYWNoZUVudHJ5PGFueT4+KCk7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXIgPSBuZXcgTG9nZ2VyKE1lbW9yeUNhY2hlU2VydmljZS5uYW1lKTtcclxuICBcclxuICAvKipcclxuICAgKiBHZW5lcmEgdW5hIGNsYXZlIGRlIGNhY2hlIGEgcGFydGlyIGRlIHVuIG9iamV0b1xyXG4gICAqIEBwYXJhbSBkYXRhIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIGdlbmVyYXRlS2V5KGRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4pOiBzdHJpbmcge1xyXG4gICAgY29uc3Qgc29ydGVkS2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpLnNvcnQoKTtcclxuICAgIGNvbnN0IHNvcnRlZE9iamVjdDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xyXG4gICAgc29ydGVkS2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgIHNvcnRlZE9iamVjdFtrZXldID0gZGF0YVtrZXldO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGRhdGFTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzb3J0ZWRPYmplY3QpO1xyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTZSBnZW5lcsOzIGxhIGNsYXZlIGRlIGNhY2hlOiAke2NyeXB0by5jcmVhdGVIYXNoKCdtZDUnKS51cGRhdGUoZGF0YVN0cmluZykuZGlnZXN0KCdoZXgnKX1gKTtcclxuICAgIHJldHVybiBjcnlwdG8uY3JlYXRlSGFzaCgnbWQ1JykudXBkYXRlKGRhdGFTdHJpbmcpLmRpZ2VzdCgnaGV4Jyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPYnRpZW5lIHVuIHZhbG9yIGRlbCBjYWNoZSBzaSBleGlzdGUgeSBubyBoYSBleHBpcmFkb1xyXG4gICAqL1xyXG4gIGdldDxUPihrZXk6IHN0cmluZywgdHRsOiBudW1iZXIgPSB0aGlzLkRFRkFVTFRfVFRMKTogVCB8IG51bGwge1xyXG4gICAgdGhpcy5jbGVhbnVwSWZOZWVkZWQoKTtcclxuICAgIFxyXG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmNhY2hlLmdldChrZXkpO1xyXG4gICAgaWYgKCFlbnRyeSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWZXJpZmljYXIgc2kgZWwgY2FjaGUgaGEgZXhwaXJhZG9cclxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICBpZiAobm93IC0gZW50cnkudGltZXN0YW1wID4gdHRsKSB7XHJcbiAgICAgIHRoaXMuY2FjaGUuZGVsZXRlKGtleSk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTZSBlbmNvbnRyw7MgZWwgdmFsb3IgZW4gZWwgY2FjaGUgcGFyYSBsYSBjbGF2ZTogJHtrZXl9YCk7XHJcbiAgICByZXR1cm4gZW50cnkudmFsdWUgYXMgVDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEd1YXJkYSB1biB2YWxvciBlbiBlbCBjYWNoZVxyXG4gICAqL1xyXG4gIHNldDxUPihrZXk6IHN0cmluZywgdmFsdWU6IFQsIHR0bDogbnVtYmVyID0gdGhpcy5ERUZBVUxUX1RUTCk6IHZvaWQge1xyXG4gICAgdGhpcy5jbGVhbnVwSWZOZWVkZWQoKTtcclxuICAgIFxyXG4gICAgdGhpcy5jYWNoZS5zZXQoa2V5LCB7XHJcbiAgICAgIHZhbHVlLFxyXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXHJcbiAgICB9KTtcclxuICAgIHRoaXMubG9nZ2VyLmxvZyhgU2UgZ3VhcmTDsyBlbCB2YWxvciBlbiBlbCBjYWNoZSBwYXJhIGxhIGNsYXZlOiAke2tleX1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVsaW1pbmEgdW5hIGVudHJhZGEgZGVsIGNhY2hlXHJcbiAgICovXHJcbiAgZGVsZXRlKGtleTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0aGlzLmNhY2hlLmRlbGV0ZShrZXkpO1xyXG4gICAgdGhpcy5sb2dnZXIubG9nKGBTZSBlbGltaW7DsyBlbCB2YWxvciBlbiBlbCBjYWNoZSBwYXJhIGxhIGNsYXZlOiAke2tleX1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpbXBpYSB0b2RhcyBsYXMgZW50cmFkYXMgZGVsIGNhY2hlXHJcbiAgICovXHJcbiAgY2xlYXIoKTogdm9pZCB7XHJcbiAgICB0aGlzLmNhY2hlLmNsZWFyKCk7XHJcbiAgICB0aGlzLmxvZ2dlci5sb2coYFNlIGxpbXBpw7MgZWwgY2FjaGVgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExpbXBpYSBsYXMgZW50cmFkYXMgZXhwaXJhZGFzIGRlbCBjYWNoZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgY2xlYW5FeHBpcmVkQ2FjaGUodHRsOiBudW1iZXIgPSB0aGlzLkRFRkFVTFRfVFRMKTogdm9pZCB7XHJcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgZm9yIChjb25zdCBba2V5LCBlbnRyeV0gb2YgdGhpcy5jYWNoZS5lbnRyaWVzKCkpIHtcclxuICAgICAgaWYgKG5vdyAtIGVudHJ5LnRpbWVzdGFtcCA+IHR0bCkge1xyXG4gICAgICAgIHRoaXMuY2FjaGUuZGVsZXRlKGtleSk7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nKGBTZSBsaW1waWFyb24gbGFzIGVudHJhZGFzIGV4cGlyYWRhcyBkZWwgY2FjaGVgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGltcGlhIGVsIGNhY2hlIGV4cGlyYWRvIHNpIGhhIHBhc2FkbyBlbCBpbnRlcnZhbG8gZGUgbGltcGllemFcclxuICAgKi9cclxuICBwcml2YXRlIGNsZWFudXBJZk5lZWRlZCgpOiB2b2lkIHtcclxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICBpZiAobm93IC0gdGhpcy5sYXN0Q2xlYW51cFRpbWUgPj0gdGhpcy5DTEVBTlVQX0lOVEVSVkFMKSB7XHJcbiAgICAgIHRoaXMuY2xlYW5FeHBpcmVkQ2FjaGUoKTtcclxuICAgICAgdGhpcy5sYXN0Q2xlYW51cFRpbWUgPSBub3c7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmxvZyhgU2UgbGltcGnDsyBlbCBjYWNoZSBzaSBoYSBwYXNhZG8gZWwgaW50ZXJ2YWxvIGRlIGxpbXBpZXphYCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBPYnRpZW5lIGVsIHRhbWHDsW8gYWN0dWFsIGRlbCBjYWNoZVxyXG4gICAqL1xyXG4gIHNpemUoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmNhY2hlLnNpemU7XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=