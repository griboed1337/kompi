import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapingOptions } from './base-scraper';
import { PCComponent, ScrapingResult, ComponentCategory, Price } from '@/types/component';

export class DnsScraper extends BaseScraper {
  private categoryUrls: Record<ComponentCategory, string> = {
    cpu: '/catalog/17a8a01d16404e77/processory/',
    gpu: '/catalog/17a89aab16404e77/videokarty/',
    motherboard: '/catalog/17a8a11916404e77/materinskie-platy/',
    ram: '/catalog/17a8a12f16404e77/operativnaya-pamyat/',
    storage: '/catalog/17a8a1d816404e77/nakopiteli/',
    psu: '/catalog/17a8a20b16404e77/bloki-pitaniya/',
    case: '/catalog/17a8a21716404e77/korpusa/',
    cooler: '/catalog/17a8a1ab16404e77/sistemy-okhlazhdeniya/',
    monitor: '/catalog/17a8a37e16404e77/monitory/',
    keyboard: '/catalog/17a8a40516404e77/klaviatury/',
    mouse: '/catalog/17a8a41916404e77/myshi/'
  };

  constructor() {
    super('https://www.dns-shop.ru', 'DNS Shop', 20);
  }

  async scrapeComponents(options: ScrapingOptions): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      components: [],
      timestamp: new Date(),
      source: this.name,
      errors: []
    };

    try {
      const category = options.category || 'cpu';
      const maxPages = options.maxPages || 1;
      const delay = this.calculateDelay();

      for (let page = 1; page <= maxPages; page++) {
        const url = this.buildUrl(category, page, options.searchQuery);
        
        try {
          console.log(`Scraping ${this.name} - ${category} - Page ${page}: ${url}`);
          
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
              'Accept-Encoding': 'gzip, deflate',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
          });

          const $ = cheerio.load(response.data);
          const components = this.parseProductList($, category);
          
          result.components.push(...components);
          
          if (options.maxResults && result.components.length >= options.maxResults) {
            result.components = result.components.slice(0, options.maxResults);
            break;
          }

          // Задержка между запросами
          if (page < maxPages) {
            await this.delay(delay);
          }
          
        } catch (error) {
          const errorMessage = `Error scraping page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors?.push(errorMessage);
          console.error(errorMessage);
        }
      }
      
    } catch (error) {
      const errorMessage = `General scraping error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors?.push(errorMessage);
      console.error(errorMessage);
    }

    return result;
  }

  private buildUrl(category: ComponentCategory, page: number, searchQuery?: string): string {
    const categoryPath = this.categoryUrls[category];
    let url = `${this.baseUrl}${categoryPath}`;
    
    const params = new URLSearchParams();
    if (page > 1) {
      params.append('p', page.toString());
    }
    if (searchQuery) {
      params.append('q', searchQuery);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    return url;
  }

  private parseProductList($: cheerio.Root, category: ComponentCategory): PCComponent[] {
    const components: PCComponent[] = [];
    
    // DNS Shop использует различные селекторы для карточек товаров
    const productSelectors = [
      '.catalog-product',
      '.products-row .product-card',
      '[data-id*="product"]',
      '.product-item'
    ];
    
    let $products: any = $('');
    for (const selector of productSelectors) {
      $products = $(selector);
      if ($products.length > 0) break;
    }

    $products.each((index: number, element: any) => {
      try {
        const $product = $(element);
        const component = this.parseProductCard($product, category);
        
        if (component && this.isValidComponent(component)) {
          components.push(component);
        }
      } catch (error) {
        console.error('Error parsing product card:', error);
      }
    });

    return components;
  }

  private parseProductCard($product: any, category: ComponentCategory): PCComponent | null {
    try {
      // Извлекаем название
      const nameSelectors = [
        '.catalog-product__name a',
        '.product-card__name a',
        '.product-name a',
        'a[data-role="product-name"]',
        '.product-card-top__title a'
      ];
      
      let name = '';
      for (const selector of nameSelectors) {
        const $nameEl = $product.find(selector);
        if ($nameEl.length > 0) {
          name = $nameEl.text().trim();
          break;
        }
      }
      
      if (!name) return null;

      // Извлекаем цену
      const priceSelectors = [
        '.product-buy__price',
        '.catalog-product__price .product-buy__price',
        '.price-current',
        '.product-card__price-current',
        '[data-role="price"]'
      ];
      
      let priceText = '';
      for (const selector of priceSelectors) {
        const $priceEl = $product.find(selector);
        if ($priceEl.length > 0) {
          priceText = $priceEl.text().trim();
          break;
        }
      }
      
      if (!priceText) return null;

      const price = this.normalizePrice(priceText);
      if (price <= 0) return null;

      // Извлекаем ссылку
      const linkSelectors = [
        '.catalog-product__name a',
        '.product-card__name a',
        'a[data-role="product-name"]'
      ];
      
      let productUrl = '';
      for (const selector of linkSelectors) {
        const $linkEl = $product.find(selector);
        if ($linkEl.length > 0) {
          const href = $linkEl.attr('href');
          if (href) {
            productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            break;
          }
        }
      }

      // Извлекаем изображение
      const imageSelectors = [
        '.catalog-product__image img',
        '.product-card__image img',
        '.product-image img'
      ];
      
      let imageUrl = '';
      for (const selector of imageSelectors) {
        const $imgEl = $product.find(selector);
        if ($imgEl.length > 0) {
          const src = $imgEl.attr('src') || $imgEl.attr('data-src');
          if (src) {
            imageUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
            break;
          }
        }
      }

      // Проверяем наличие товара
      const availabilitySelectors = [
        '.product-buy__availability',
        '.catalog-product__availability',
        '.product-card__availability'
      ];
      
      let availability: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order' = 'in_stock';
      for (const selector of availabilitySelectors) {
        const $availEl = $product.find(selector);
        if ($availEl.length > 0) {
          const availText = $availEl.text().toLowerCase();
          if (availText.includes('нет в наличии') || availText.includes('закончился')) {
            availability = 'out_of_stock';
          } else if (availText.includes('ограничен') || availText.includes('мало')) {
            availability = 'limited';
          } else if (availText.includes('предзаказ')) {
            availability = 'pre_order';
          }
          break;
        }
      }

      // Извлекаем бренд из названия
      const brand = this.extractBrand(name);

      const priceInfo: Price = {
        value: price,
        currency: 'RUB',
        retailer: this.name,
        url: productUrl,
        availability,
        lastUpdated: new Date()
      };

      const component: PCComponent = {
        id: `dns-${category}-${Date.now()}-${Math.random()}`,
        name: name,
        brand: brand,
        model: name.replace(brand, '').trim(),
        category: category,
        imageUrl: imageUrl || undefined,
        specifications: {},
        prices: [priceInfo]
      };

      return component;
      
    } catch (error) {
      console.error('Error parsing DNS product card:', error);
      return null;
    }
  }

  private extractBrand(name: string): string {
    const commonBrands = [
      'Intel', 'AMD', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock', 
      'Corsair', 'Kingston', 'Samsung', 'Western Digital', 'Seagate',
      'Cooler Master', 'NZXT', 'Thermaltake', 'be quiet!', 'Noctua',
      'Fractal Design', 'Lian Li', 'Antec', 'Seasonic', 'EVGA'
    ];
    
    const nameLower = name.toLowerCase();
    for (const brand of commonBrands) {
      if (nameLower.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    // Если бренд не найден, берем первое слово
    return name.split(' ')[0];
  }
}