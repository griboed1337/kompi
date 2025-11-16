export interface CacheOptions {
  ttl?: number; // время жизни в миллисекундах
  maxSize?: number; // максимальный размер кэша
  cleanupInterval?: number; // интервал очистки в миллисекундах
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly cleanupInterval: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 30 * 60 * 1000; // 30 минут по умолчанию
    this.maxSize = options.maxSize || 1000; // максимум 1000 записей
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // очистка каждые 5 минут

    // Запускаем периодическую очистку
    this.startCleanupTimer();
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Если кэш переполнен, удаляем самые старые записи
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Проверяем, не истекло ли время жизни
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Обновляем статистику доступа
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    
    // Проверяем, не истекло ли время жизни
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Статистика кэша
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    const validEntries = entries.filter(([, entry]) => 
      now - entry.timestamp <= entry.ttl
    );

    const totalAccesses = validEntries.reduce((sum, [, entry]) => sum + entry.accessCount, 0);
    const avgAccessCount = validEntries.length > 0 ? totalAccesses / validEntries.length : 0;

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      memoryUsage: this.getMemoryUsage(),
      averageAccessCount: Math.round(avgAccessCount * 100) / 100,
      oldestEntry: validEntries.length > 0 ? 
        Math.min(...validEntries.map(([, entry]) => entry.timestamp)) : null,
      newestEntry: validEntries.length > 0 ? 
        Math.max(...validEntries.map(([, entry]) => entry.timestamp)) : null
    };
  }

  // Очистка истекших записей
  cleanup(): number {
    const now = Date.now();
    const initialSize = this.cache.size;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    const removedCount = initialSize - this.cache.size;
    console.log(`Cache cleanup: removed ${removedCount} expired entries`);
    
    return removedCount;
  }

  // Удаление наименее используемых записей (LRU)
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    
    // Сортируем по времени последнего доступа
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Удаляем 10% самых старых записей
    const toRemove = Math.ceil(entries.length * 0.1);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private getMemoryUsage(): number {
    // Примерная оценка использования памяти
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // примерный размер метаданных entry
    }
    return size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Глобальный кэш для приложения
export const globalCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 минут
  maxSize: 500,
  cleanupInterval: 10 * 60 * 1000 // очистка каждые 10 минут
});

// Специализированный кэш для цен (короткое время жизни)
export const priceCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 минут
  maxSize: 200,
  cleanupInterval: 2 * 60 * 1000 // очистка каждые 2 минуты
});

// Кэш для данных компонентов (длительное время жизни)
export const componentCache = new MemoryCache({
  ttl: 2 * 60 * 60 * 1000, // 2 часа
  maxSize: 1000,
  cleanupInterval: 30 * 60 * 1000 // очистка каждые 30 минут
});

// Утилиты для работы с кэшем
export const CacheUtils = {
  // Генерация ключей кэша
  generateKey: (...parts: (string | number)[]): string => {
    return parts.map(part => String(part).toLowerCase()).join(':');
  },

  // Сериализация объектов для кэширования
  serialize: <T>(obj: T): string => {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.error('Error serializing object for cache:', error);
      return '';
    }
  },

  // Десериализация объектов из кэша
  deserialize: <T>(str: string): T | null => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('Error deserializing object from cache:', error);
      return null;
    }
  },

  // Получение статистики всех кэшей
  getAllStats: () => {
    return {
      global: globalCache.getStats(),
      price: priceCache.getStats(),
      component: componentCache.getStats()
    };
  },

  // Очистка всех кэшей
  clearAll: () => {
    globalCache.clear();
    priceCache.clear();
    componentCache.clear();
  }
};