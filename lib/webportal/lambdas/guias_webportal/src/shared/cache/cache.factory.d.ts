import { ICacheService, CacheType } from './interface/cache.interface';
export declare class CacheFactory {
    create(cacheType?: CacheType): ICacheService;
}
