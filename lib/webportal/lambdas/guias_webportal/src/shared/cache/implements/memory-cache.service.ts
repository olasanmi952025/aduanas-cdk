import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { CacheEntry, ICacheService } from '../interface/cache.interface';

@Injectable()
export class MemoryCacheService implements ICacheService {
  private lastCleanupTime = Date.now();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;
  private readonly CLEANUP_INTERVAL = 60 * 1000;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly logger = new Logger(MemoryCacheService.name);
  
  /**
   * Genera una clave de cache a partir de un objeto
   * @param data 
   * @returns 
   */
  generateKey(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const sortedObject: Record<string, any> = {};
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
  get<T>(key: string, ttl: number = this.DEFAULT_TTL): T | null {
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
    return entry.value as T;
  }

  /**
   * Guarda un valor en el cache
   */
  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
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
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.log(`Se eliminó el valor en el cache para la clave: ${key}`);
  }

  /**
   * Limpia todas las entradas del cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log(`Se limpió el cache`);
  }

  /**
   * Limpia las entradas expiradas del cache
   */
  private cleanExpiredCache(ttl: number = this.DEFAULT_TTL): void {
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
  private cleanupIfNeeded(): void {
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
  size(): number {
    return this.cache.size;
  }
}

