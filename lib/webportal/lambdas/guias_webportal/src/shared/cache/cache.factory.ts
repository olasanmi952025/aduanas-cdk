import { Injectable } from '@nestjs/common';
import { ICacheService, CacheType } from './interface/cache.interface';
import { MemoryCacheService } from './implements/memory-cache.service';

@Injectable()
export class CacheFactory {
  create(cacheType: CacheType = CacheType.MEMORY): ICacheService {
    switch (cacheType) {
      case CacheType.MEMORY:
        return new MemoryCacheService();

      default:
        return new MemoryCacheService();
    }
  }
}

