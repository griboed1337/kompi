import axios, { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import { JSDOM } from 'jsdom';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import UserAgent from 'user-agents';
import puppeteer, { Browser, Page } from 'puppeteer';
import { saveProducts } from './database';
import type { Product } from './database';

export interface ScrapingResult {
  products: Product[];
  totalFound: number;
  success: boolean;
  error?: string;
}

// Конфигурация для разных магазинов
export interface StoreConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  productSelectors: {
    container: string;
    title: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    link: string;
    image?: string;
    availability?: string;
  };
  headers?: Record<string, string>;
}

// Конфигурация прокси
export interface ProxyConfig {
  host: string;
  port: number;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
  auth?: {
    username: string;
    password: string;
  };
}

// Расширенная конфигурация скрейпера
export interface ScraperOptions {
  proxy?: ProxyConfig;
  delay?: number; // задержка между запросами в мс
  maxRetries?: number;
  timeout?: number;
  rotateUserAgent?: boolean;
  sessionCookies?: Record<string, string>;
  useBrowser?: boolean; // использовать headless браузер вместо HTTP
  browserOptions?: {
    headless?: boolean;
    args?: string[];
    userDataDir?: string;
  };
}

// HTTP клиент с настройками
class HttpClient {
  private userAgent: string;
  private options: ScraperOptions;
  private userAgentGenerator: UserAgent;

  constructor(options: ScraperOptions = {}) {
    this.options = options;
    this.userAgentGenerator = new UserAgent();
    this.userAgent = options.rotateUserAgent
      ? this.userAgentGenerator.toString()
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  // Создание прокси агента
  private createProxyAgent(proxy: ProxyConfig) {
    const proxyUrl = proxy.auth
      ? `${proxy.protocol || 'http'}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
      : `${proxy.protocol || 'http'}://${proxy.host}:${proxy.port}`;

    if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
      return new SocksProxyAgent(proxyUrl);
    } else {
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  // Генерация нового User-Agent
  private getRandomUserAgent(): string {
    return this.userAgentGenerator.toString();
  }

  async get(url: string, headers?: Record<string, string>): Promise<AxiosResponse<string>> {
    const defaultHeaders = {
      'User-Agent': this.options.rotateUserAgent ? this.getRandomUserAgent() : this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const axiosConfig: any = {
      headers: { ...defaultHeaders, ...headers },
      timeout: this.options.timeout || 15000,
      maxRedirects: 5,
    };

    // Добавляем прокси если настроен
    if (this.options.proxy) {
      axiosConfig.httpsAgent = this.createProxyAgent(this.options.proxy);
      axiosConfig.httpAgent = this.createProxyAgent(this.options.proxy);
    }

    // Добавляем задержку если настроена
    if (this.options.delay) {
      await new Promise(resolve => setTimeout(resolve, this.options.delay));
    }

    return axios.get(url, axiosConfig);
  }
}

// Парсер HTML контента
class HtmlParser {
  parseWithCheerio(html: string) {
    return load(html);
  }

  parseWithJsdom(html: string) {
    return new JSDOM(html);
  }
}

// Логгер для отладки
class Logger {
  private isDebug: boolean;

  constructor(debug: boolean = false) {
    this.isDebug = debug;
  }

  info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data || '');
  }

  debug(message: string, data?: any) {
    if (this.isDebug) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

// Класс для работы с браузером
class BrowserManager {
  private browser: Browser | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async launchBrowser(options: ScraperOptions['browserOptions'] = {}): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const defaultArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ];

    const launchOptions = {
      headless: options.headless !== false,
      args: [...defaultArgs, ...(options.args || [])],
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      userDataDir: options.userDataDir,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    };

    this.logger.info('Запуск браузера Puppeteer...');
    this.browser = await puppeteer.launch(launchOptions);
    this.logger.info('Браузер успешно запущен');

    return this.browser;
  }

  async createStealthPage(browser: Browser, proxy?: ProxyConfig): Promise<Page> {
    const page = await browser.newPage();

    // Устанавливаем viewport
    await page.setViewport({ width: 1366, height: 768 });

    // Устанавливаем User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Устанавливаем дополнительные заголовки
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // Скрываем автоматизацию
    await page.evaluateOnNewDocument(() => {
      // Удаляем webdriver property
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Mock languages and plugins
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ru-RU', 'ru', 'en-US', 'en'],
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Настраиваем прокси если указан
    if (proxy) {
      const proxyUrl = proxy.auth
        ? `${proxy.protocol || 'http'}://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`
        : `${proxy.protocol || 'http'}://${proxy.host}:${proxy.port}`;

      await page.authenticate({
        username: proxy.auth?.username || '',
        password: proxy.auth?.password || '',
      });
    }

    return page;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.info('Браузер закрыт');
    }
  }
}

// Основной класс скрейпера
export class Scraper {
  private httpClient: HttpClient;
  private htmlParser: HtmlParser;
  private logger: Logger;
  private options: ScraperOptions;
  private browserManager: BrowserManager;

  constructor(options: ScraperOptions & { debug?: boolean } = {}) {
    const { debug = false, ...scraperOptions } = options;
    this.options = scraperOptions;
    this.httpClient = new HttpClient(scraperOptions);
    this.htmlParser = new HtmlParser();
    this.logger = new Logger(debug);
    this.browserManager = new BrowserManager(this.logger);
  }

  // Метод для очистки текста от лишних пробелов и символов
  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  // Метод для извлечения цены из текста
  private extractPrice(text: string): string {
    // Ищем числа с возможными валютами
    const priceMatch = text.match(/(\d[\d\s]*[\d.,]\d+)/);
    return priceMatch ? priceMatch[1].replace(/\s/g, '') : '';
  }

  // Метод для создания полной ссылки
  private normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return new URL(url, baseUrl).href;
  }

  // Основной метод скрейпинга
  async scrape(config: StoreConfig, searchQuery?: string): Promise<ScrapingResult> {
    try {
      this.logger.info(`Начинаем скрейпинг магазина: ${config.name}`);

      // Формируем URL для поиска
      const url = searchQuery
        ? config.searchUrl.replace('{query}', encodeURIComponent(searchQuery))
        : config.baseUrl;

      this.logger.debug(`URL для скрейпинга: ${url}`);

      let htmlContent: string;

      if (this.options.useBrowser || config.name === 'Citilink') {
        // Используем браузер для обхода защиты, особенно для Citilink
        this.logger.info('Используем headless браузер для скрейпинга');
        htmlContent = await this.scrapeWithBrowser(url, config);
      } else {
        // Используем HTTP клиент
        this.logger.info('Используем HTTP клиент для скрейпинга');
        const response = await this.httpClient.get(url, config.headers);
        htmlContent = response.data;
      }

      this.logger.info(`HTML контент получен, длина: ${htmlContent.length} символов`);

      // Парсим HTML и ищем продукты
      const products = this.parseProducts(htmlContent, config, searchQuery);

      this.logger.info(`Успешно найдено продуктов: ${products.length}`);

      // Сохраняем продукты в базу данных
      if (products.length > 0) {
        const saveResult = await saveProducts(products, searchQuery || '');
        if (!saveResult.success) {
          this.logger.error('Ошибка при сохранении продуктов в БД:', saveResult.error);
        } else {
          this.logger.info('Продукты успешно сохранены в БД');
        }
      }

      return {
        products,
        totalFound: products.length,
        success: true,
      };

    } catch (error) {
      this.logger.error(`Ошибка при скрейпинге:`, error);
      return {
        products: [],
        totalFound: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  // Метод скрейпинга с использованием браузера
  private async scrapeWithBrowser(url: string, config: StoreConfig): Promise<string> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await this.browserManager.launchBrowser(this.options.browserOptions);
      page = await this.browserManager.createStealthPage(browser, this.options.proxy);

      this.logger.debug(`Переходим на страницу: ${url}`);

      // Сначала посещаем главную страницу для установки сессии
      await page.goto(config.baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout || 30000
      });

      // Ждем немного для установки cookies
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Теперь переходим на целевую страницу
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout || 30000
      });

      // Ждем загрузки контента
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Прокручиваем страницу для загрузки динамического контента
      await this.scrollPage(page);

      // Ждем еще немного
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Проверяем, не попали ли мы на страницу защиты
      const currentUrl = page.url();
      if (currentUrl.includes('qrator') || currentUrl.includes('captcha')) {
        this.logger.error('Попали на страницу защиты QRATOR/CAPTCHA');
        throw new Error('Protection page detected');
      }

      // Получаем HTML контент
      const content = await page.content();
      this.logger.debug(`HTML контент получен через браузер, длина: ${content.length}`);

      return content;

    } finally {
      if (page) await page.close().catch(() => {});
      // Не закрываем браузер, чтобы переиспользовать его
    }
  }

  // Метод прокрутки страницы для загрузки контента
  private async scrollPage(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 200;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  // Метод парсинга продуктов из HTML
  private parseProducts(htmlContent: string, config: StoreConfig, searchQuery?: string): Product[] {
    const $ = this.htmlParser.parseWithCheerio(htmlContent);
    const products: Product[] = [];
    const productContainers = $(config.productSelectors.container);

    this.logger.info(`Найдено контейнеров продуктов: ${productContainers.length}`);
    this.logger.debug(`Первые 100 символов HTML: ${htmlContent.substring(0, 1000)}`);
    
    // Дополнительная отладка - выводим найденные контейнеры
    if (productContainers.length > 0) {
      this.logger.debug('Примеры найденных контейнеров:', productContainers.slice(0, 3).map((i, el) => $(el).html()).get());
    }

    productContainers.each((index, element) => {
      try {
        const $element = $(element);

        // Извлекаем название
        const titleElement = $element.find(config.productSelectors.title).first();
        let title = this.cleanText(titleElement.text()).replace(/\n/g, ' ').trim();
        
        // Если не нашли название через основной селектор, пробуем найти в дочерних элементах
        if (!title) {
          title = this.cleanText($element.find('[data-meta-name="Snippet__title"]').first().text()).replace(/\n/g, ' ').trim();
        }
        
        if (!title) {
          this.logger.debug('Пропускаем элемент без названия');
          return; // Пропускаем элементы без названия
        }

        // Извлекаем цену
        const priceElement = $element.find(config.productSelectors.price).first();
        let price = this.extractPrice(this.cleanText(priceElement.text()));
        
        // Если не нашли цену через основной селектор, пробуем найти в дочерних элементах
        if (!price) {
          price = this.extractPrice(this.cleanText($element.find('[data-meta-price]').first().attr('data-meta-price') || ''));
        }
        
        if (!price) {
          this.logger.debug('Пропускаем элемент без цены:', title);
          return; // Пропускаем элементы без цены
        }

        // Извлекаем ссылку
        const linkElement = $element.find(config.productSelectors.link).first();
        let linkHref = linkElement.attr('href');
        
        // Если не нашли ссылку через основной селектор, пробуем найти в дочерних элементах
        if (!linkHref) {
          linkHref = $element.find('a').first().attr('href');
        }
        
        const link = linkHref ? this.normalizeUrl(linkHref, config.baseUrl) : '';
        if (!link) {
          this.logger.debug('Пропускаем элемент без ссылки:', title);
          return; // Пропускаем элементы без ссылки
        }

        // Извлекаем дополнительные поля если есть
        const image = config.productSelectors.image
          ? $element.find(config.productSelectors.image).first().attr('src') || ''
          : '';

        const availability = config.productSelectors.availability
          ? this.cleanText($element.find(config.productSelectors.availability).first().text())
          : '';

        // Проверяем обязательные поля
        if (title && price && link) {
          const product: Product = {
            title,
            price,
            link,
            store: config.name,
            search_query: searchQuery || '',
          };

          // Добавляем опциональные поля
          if (image) product.image = this.normalizeUrl(image, config.baseUrl);
          if (availability) product.availability = availability;

          products.push(product);
          this.logger.debug(`Найден продукт ${index + 1}: ${title} - ${price}`);
        }
      } catch (error) {
        this.logger.error(`Ошибка при обработке продукта ${index + 1}:`, error);
      }
    });

    return products;
  }
}

// Конфигурация для DNS Shop
const dnsShopConfig: StoreConfig = {
  name: 'DNS Shop',
  baseUrl: 'https://www.dns-shop.ru',
  searchUrl: 'https://www.dns-shop.ru/search/?q={query}',
  productSelectors: {
    container: '.catalog-product, .product-card',
    title: '.catalog-product__name, .product-card__name, h3, h4',
    price: '.product-buy__price, .price, [class*="price"]',
    originalPrice: '.price-old, [class*="old-price"]',
    discount: '.product-buy__sale, [class*="discount"]',
    link: '.catalog-product__name a, .product-card__link a, a[href*="/product/"]',
    image: '.catalog-product__image img, .product-card__image img',
    availability: '.product-buy__availability, [class*="available"]',
  },
  headers: {
    'Referer': 'https://www.dns-shop.ru/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  },
};

// Конфигурация для Citilink
const citilinkConfig: StoreConfig = {
  name: 'Citilink',
  baseUrl: 'https://www.citilink.ru',
  searchUrl: 'https://www.citilink.ru/search/?text={query}',
  productSelectors: {
    container: '[data-meta-product-id], .app-catalog-1lbyk2d-StyledFooter, .ProductCardHorizontal, .product-card, .catalog-item, .product, [data-testid="product-card"], [class*="product"]',
    title: '[data-meta-product-name], .app-catalog-1g0fl7h-Anchor--Anchor, .ProductCardHorizontal__name, .product-title, .title, h3, h4, [class*="title"], [data-testid="product-title"]',
    price: '[data-meta-product-price], .app-catalog-1lbyk2d-StyledFooter [class*="price"], .ProductCardHorizontal__price, .price, .product-price, [class*="price"], [data-testid="product-price"]',
    originalPrice: '.ProductCardHorizontal__old-price, .old-price, [class*="old-price"]',
    discount: '.ProductCardHorizontal__discount, .discount, [class*="discount"]',
    link: '[data-meta-product-id] a, .app-catalog-1g0fl7h-Anchor--Anchor, .ProductCardHorizontal__name a, a[href*="/product/"], a, .product-link, [data-testid="product-link"]',
    image: '.ProductCardHorizontal__image img, .product-image img, img, [class*="image"], [data-testid="product-image"]',
    availability: '.ProductCardHorizontal__availability, .availability, [class*="available"]',
  },
  headers: {
    'Referer': 'https://www.citilink.ru/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  },
};

// Специализированная функция для DNS Shop
export async function scrapeDnsShop(searchQuery?: string, options: ScraperOptions & { debug?: boolean } = {}): Promise<ScrapingResult> {
  const scraper = createScraper(options);

  if (searchQuery) {
    return await scraper.scrape(dnsShopConfig, searchQuery);
  }

  // Если запрос не указан, скрейпим главную страницу каталога
  return await scraper.scrape(dnsShopConfig);
}

// Функция для поиска продуктов по категории
export async function scrapeDnsShopCategory(categoryUrl: string, options: ScraperOptions & { debug?: boolean } = {}): Promise<ScrapingResult> {
  const scraper = createScraper(options);

  // Создаем временную конфигурацию для категории
  const categoryConfig: StoreConfig = {
    ...dnsShopConfig,
    baseUrl: categoryUrl,
    searchUrl: categoryUrl,
  };

  return await scraper.scrape(categoryConfig);
}

// Специализированная функция для Citilink
export async function scrapeCitilink(searchQuery?: string, options: ScraperOptions & { debug?: boolean } = {}): Promise<ScrapingResult> {
  const scraper = createScraper(options);

  if (searchQuery) {
    return await scraper.scrape(citilinkConfig, searchQuery);
  }

  // Если запрос не указан, скрейпим главную страницу каталога
  return await scraper.scrape(citilinkConfig);
}

// Функция для поиска продуктов по категории для Citilink
export async function scrapeCitilinkCategory(categoryUrl: string, options: ScraperOptions & { debug?: boolean } = {}): Promise<ScrapingResult> {
  const scraper = createScraper(options);

  // Создаем временную конфигурацию для категории
  const categoryConfig: StoreConfig = {
    ...citilinkConfig,
    baseUrl: categoryUrl,
    searchUrl: categoryUrl,
  };

  return await scraper.scrape(categoryConfig);
}

// Экспорт фабрики для создания скрейпера
export function createScraper(options: ScraperOptions & { debug?: boolean } = {}): Scraper {
  return new Scraper(options);
}