import { ICacheService } from '../interface/cache.interface';
export declare class MemoryCacheService implements ICacheService {
    private lastCleanupTime;
    private readonly DEFAULT_TTL;
    private readonly CLEANUP_INTERVAL;
    private cache;
    private readonly logger;
    /**
     * Genera una clave de cache a partir de un objeto
     * @param data
     * @returns
     */
    generateKey(data: Record<string, any>): string;
    /**
     * Obtiene un valor del cache si existe y no ha expirado
     */
    get<T>(key: string, ttl?: number): T | null;
    /**
     * Guarda un valor en el cache
     */
    set<T>(key: string, value: T, ttl?: number): void;
    /**
     * Elimina una entrada del cache
     */
    delete(key: string): void;
    /**
     * Limpia todas las entradas del cache
     */
    clear(): void;
    /**
     * Limpia las entradas expiradas del cache
     */
    private cleanExpiredCache;
    /**
     * Limpia el cache expirado si ha pasado el intervalo de limpieza
     */
    private cleanupIfNeeded;
    /**
     * Obtiene el tamaño actual del cache
     */
    size(): number;
}
