import { PCComponent, ScrapingResult, ComponentCategory } from '@/types/component';

export interface ScrapingOptions {
  category?: ComponentCategory;
  maxPages?: number;
  delayBetweenRequests?: number;
  maxResults?: number;
  searchQuery?: string;
}

export abstract class BaseScraper {
  protected baseUrl: string;
  protected name: string;
  protected rateLimit: number;

  constructor(baseUrl: string, name: string, rateLimit: number = 30) {
    this.baseUrl = baseUrl;
    this.name = name;
    this.rateLimit = rateLimit;
  }

  abstract scrapeComponents(options: ScrapingOptions): Promise<ScrapingResult>;
  
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  protected calculateDelay(): number {
    return Math.ceil(60000 / this.rateLimit);
  }
  
  protected normalizePrice(priceString: string): number {
    // Убираем все не цифровые символы кроме точки и запятой
    const cleanPrice = priceString.replace(/[^\d.,]/g, '');
    // Заменяем запятую на точку и конвертируем в число
    return parseFloat(cleanPrice.replace(',', '.')) || 0;
  }
  
  protected isValidComponent(component: Partial<PCComponent>): boolean {
    return !!(component.name && component.brand && component.prices && component.prices.length > 0);
  }
}