import { PCComponent, ComponentCategory, Price } from '@/types/component';

export interface PriceAggregationOptions {
  categories?: ComponentCategory[];
  maxResults?: number;
  searchQuery?: string;
  includeOutOfStock?: boolean;
}

export interface AggregatedPrice {
  component: PCComponent;
  lowestPrice: Price;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  availableRetailers: string[];
  lastUpdated: Date;
}

export interface PriceComparisonResult {
  query: string;
  category: ComponentCategory;
  results: AggregatedPrice[];
  totalFound: number;
  timestamp: Date;
  sources: string[];
}

export class PriceAggregationService {
  private cache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL = 30 * 60 * 1000; // 30 минут

  constructor() {
    // Скрейперы удалены
  }

  async aggregatePrices(options: PriceAggregationOptions): Promise<PriceComparisonResult[]> {
    const {
      categories = ['cpu'],
      maxResults = 20,
      searchQuery = '',
    } = options;

    const results: PriceComparisonResult[] = [];
    
    for (const category of categories) {
      try {
        const cacheKey = this.generateCacheKey(category, searchQuery, maxResults);
        
        // Проверяем кэш
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          results.push(cachedResult);
          continue;
        }

        // Временно возвращаем пустой результат, так как скрейперы удалены
        const comparisonResult: PriceComparisonResult = {
          query: searchQuery,
          category,
          results: [],
          totalFound: 0,
          timestamp: new Date(),
          sources: []
        };

        results.push(comparisonResult);
        
      } catch (error) {
        console.error(`Error aggregating prices for category ${category}:`, error);
      }
    }

    return results;
  }

  private generateCacheKey(category: ComponentCategory, searchQuery: string, maxResults: number): string {
    return `price_${category}_${searchQuery}_${maxResults}`;
  }

  private getFromCache(key: string): PriceComparisonResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = new Date().getTime();
    if (now - cached.timestamp.getTime() > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: PriceComparisonResult, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
