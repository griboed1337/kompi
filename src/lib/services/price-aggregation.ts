import { PCComponent, ComponentCategory, Price } from '@/types/component';
import { DnsScraper } from '@/lib/scrapers/dns-scraper';

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
  private scrapers: Map<string, any> = new Map();
  private cache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL = 30 * 60 * 1000; // 30 минут

  constructor() {
    // Инициализируем доступные скрейперы
    this.scrapers.set('dns', new DnsScraper());
  }

  async aggregatePrices(options: PriceAggregationOptions): Promise<PriceComparisonResult[]> {
    const {
      categories = ['cpu'],
      maxResults = 20,
      searchQuery = '',
      includeOutOfStock = false
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

        // Собираем данные со всех скрейперов
        const allComponents: PCComponent[] = [];
        const sources: string[] = [];

        for (const [sourceName, scraper] of this.scrapers) {
          try {
            const scrapingResult = await scraper.scrapeComponents({
              category,
              maxPages: 2,
              maxResults: Math.ceil(maxResults / this.scrapers.size),
              searchQuery
            });

            if (scrapingResult.components.length > 0) {
              allComponents.push(...scrapingResult.components);
              sources.push(sourceName);
            }
          } catch (error) {
            console.error(`Error scraping from ${sourceName}:`, error);
          }
        }

        // Агрегируем цены
        const aggregatedResults = this.aggregateComponentPrices(allComponents, includeOutOfStock);
        
        // Сортируем по лучшей цене
        aggregatedResults.sort((a, b) => a.lowestPrice.value - b.lowestPrice.value);
        
        // Ограничиваем результаты
        const limitedResults = aggregatedResults.slice(0, maxResults);

        const comparisonResult: PriceComparisonResult = {
          query: searchQuery,
          category,
          results: limitedResults,
          totalFound: aggregatedResults.length,
          timestamp: new Date(),
          sources
        };

        // Кэшируем результат
        this.setCache(cacheKey, comparisonResult);
        
        results.push(comparisonResult);
        
      } catch (error) {
        console.error(`Error aggregating prices for category ${category}:`, error);
      }
    }

    return results;
  }

  private aggregateComponentPrices(components: PCComponent[], includeOutOfStock: boolean): AggregatedPrice[] {
    // Группируем компоненты по схожим названиям/моделям
    const componentGroups = this.groupSimilarComponents(components);
    
    const aggregatedResults: AggregatedPrice[] = [];

    for (const group of componentGroups) {
      try {
        // Фильтруем цены
        const allPrices = group.flatMap(comp => comp.prices);
        const validPrices = allPrices.filter(price => 
          price.value > 0 && (includeOutOfStock || price.availability === 'in_stock')
        );

        if (validPrices.length === 0) continue;

        // Находим лучшую цену
        const lowestPrice = validPrices.reduce((min, price) => 
          price.value < min.value ? price : min
        );

        // Вычисляем среднюю цену
        const averagePrice = validPrices.reduce((sum, price) => sum + price.value, 0) / validPrices.length;

        // Диапазон цен
        const priceValues = validPrices.map(p => p.value);
        const priceRange = {
          min: Math.min(...priceValues),
          max: Math.max(...priceValues)
        };

        // Список ритейлеров
        const availableRetailers = [...new Set(validPrices.map(p => p.retailer))];

        // Берем компонент с самой полной информацией
        const bestComponent = group.reduce((best, current) => 
          (current.specifications && Object.keys(current.specifications).length > Object.keys(best.specifications || {}).length) 
            ? current : best
        );

        // Объединяем все цены в один компонент
        const aggregatedComponent: PCComponent = {
          ...bestComponent,
          prices: validPrices,
          averagePrice: Math.round(averagePrice),
          lowestPrice: lowestPrice.value
        };

        aggregatedResults.push({
          component: aggregatedComponent,
          lowestPrice,
          averagePrice: Math.round(averagePrice),
          priceRange,
          availableRetailers,
          lastUpdated: new Date()
        });

      } catch (error) {
        console.error('Error aggregating component group:', error);
      }
    }

    return aggregatedResults;
  }

  private groupSimilarComponents(components: PCComponent[]): PCComponent[][] {
    const groups: PCComponent[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < components.length; i++) {
      if (used.has(i)) continue;

      const group = [components[i]];
      used.add(i);

      for (let j = i + 1; j < components.length; j++) {
        if (used.has(j)) continue;

        if (this.areComponentsSimilar(components[i], components[j])) {
          group.push(components[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private areComponentsSimilar(comp1: PCComponent, comp2: PCComponent): boolean {
    // Проверяем схожесть по бренду и модели
    if (comp1.brand.toLowerCase() !== comp2.brand.toLowerCase()) {
      return false;
    }

    // Нормализуем названия для сравнения
    const name1 = this.normalizeComponentName(comp1.name);
    const name2 = this.normalizeComponentName(comp2.name);

    // Проверяем схожесть названий (простой алгоритм)
    const similarity = this.calculateStringSimilarity(name1, name2);
    return similarity > 0.8; // 80% схожесть
  }

  private normalizeComponentName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // убираем специальные символы
      .replace(/\s+/g, ' ') // нормализуем пробелы
      .trim();
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
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