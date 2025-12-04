export interface ICacheService {
  generateKey(data: Record<string, any>): string;

  get<T>(key: string, ttl?: number): T | null | Promise<T | null>;

  set<T>(key: string, value: T, ttl?: number): void | Promise<void>;

  delete(key: string): void | Promise<void>;

  clear(): void | Promise<void>;

  size(): number | Promise<number>;
}

export enum CacheType {
  MEMORY = 'memory',
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}
