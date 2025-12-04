import { Provider } from '@nestjs/common';
import { CacheFactory } from '../cache.factory';
import { ICacheService, CacheType } from '../interface/cache.interface';

export const CACHE_SERVICE = 'CACHE_SERVICE';

export const CacheServiceProvider: Provider<ICacheService> = {
  provide: CACHE_SERVICE,
  useFactory: (cacheFactory: CacheFactory) => {
    const cacheType = (process.env.CACHE_TYPE as CacheType) || CacheType.MEMORY;
    return cacheFactory.create(cacheType);
  },
  inject: [CacheFactory],
};

