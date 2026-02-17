import { chromium, type BrowserContext, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import type { Product } from '@/types/product';

export interface SpecItem {
    group: string | null;
    name: string;
    value: string;
}

export interface DnsFullData {
    product: Product;
    specs: SpecItem[];
}

export class DnsParserService {
    private static userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

    static async getUrlsFromCatalog(catalogUrl: string, limit = 5): Promise<string[]> {
        console.log(`[Safe Parsing] Fetching URLs from catalog: ${catalogUrl}`);
        const browser = await chromium.launch({
            headless: true,
            args: ['--disable-blink-features=AutomationControlled', '--disable-features=IsolateOrigins,site-per-process'],
        });

        const context = await this.createStealthContext(browser);

        try {
            const page = await context.newPage();
            // Warm up
            await page.goto('https://www.dns-shop.ru/?cityPath=msk', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(4000);
            await this.waitForQratorCookies(context);

            const cityUrl = catalogUrl.includes('?') ? `${catalogUrl}&cityPath=msk` : `${catalogUrl}?cityPath=msk`;
            await page.goto(cityUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(5000); // Wait for hydration

            const html = await page.content();
            const $ = cheerio.load(html);
            const urls: string[] = [];

            $('.catalog-product a.catalog-product__name, .catalog-product a[href*="/product/"]').each((_, el) => {
                if (urls.length >= limit) return;
                const href = $(el).attr('href');
                if (href) {
                    urls.push(href.startsWith('http') ? href : `https://www.dns-shop.ru${href}`);
                }
            });

            return [...new Set(urls)];
        } finally {
            await context.close();
            await browser.close();
        }
    }

    static async parseProduct(url: string): Promise<DnsFullData> {
        console.log(`[Safe Parsing] Starting for: ${url}`);

        const browser = await chromium.launch({
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
            ],
        });

        const context = await this.createStealthContext(browser);

        try {
            const page = await context.newPage();

            // Warm up session
            console.log('[Safe Parsing] Warming up session at dns-shop.ru...');
            await page.goto('https://www.dns-shop.ru/?cityPath=msk', {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });
            await page.waitForTimeout(4000);

            // Wait for Qrator cookies
            const gotCookies = await this.waitForQratorCookies(context);
            if (!gotCookies) {
                console.warn('[Safe Parsing] Warning: qrator cookies not received in 45s.');
            } else {
                console.log('[Safe Parsing] Qrator session established.');
            }

            // Go to product
            // Try without cityPath suffix for product if it fails
            console.log(`[Safe Parsing] Navigating to: ${url}`);
            const response = await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });

            if (!response || response.status() >= 400) {
                const status = response?.status() || 'No response';
                console.error(`[Safe Parsing] Page load failed with status: ${status}`);
                throw new Error(`Failed to load page: ${status}`);
            }

            // Wait for hydration
            await page.waitForTimeout(4000);

            const htmlContent = await page.content();
            console.log(`[Safe Parsing] HTML loaded, length: ${htmlContent.length}`);

            const $ = cheerio.load(this.stripAmbiguousUnicode(htmlContent));

            // Basic check if we are blocked
            const titleText = $('title').text().trim();
            if (titleText === 'HTTP 403' || htmlContent.length < 5000) {
                throw new Error(`Page blocked or empty. Title: ${titleText}`);
            }

            const title = $('h1.product-card-top__title').text().trim() ||
                $('meta[property="og:title"]').attr('content')?.trim() ||
                '';
            console.log(`[Safe Parsing] Parsed title: "${title}"`);

            const priceText = $('.product-buy__price, .product-buy__price-wrap').first().text().trim().replace(/\s/g, '').replace(/\D/g, '');
            const price = priceText ? parseInt(priceText, 10) : 0;

            const oldPriceText = $('.product-buy__price_old').text().trim().replace(/\s/g, '').replace(/\D/g, '');
            const original_price = oldPriceText ? parseInt(oldPriceText, 10) : undefined;

            const availability = $('.product-buy__availability').text().trim() || 'В наличии';

            const images: string[] = [];
            $('img[itemprop="image"], .product-images-slider__main-img img').each((_, img) => {
                const src = $(img).attr('src') || $(img).attr('data-src');
                if (src && !src.includes('stub')) {
                    images.push(src.startsWith('http') ? src : `https://www.dns-shop.ru${src}`);
                }
            });

            const specs: SpecItem[] = [];
            $('.product-characteristics__item').each((_, elem) => {
                const n = $(elem).find('.product-characteristics__item-name').text().trim();
                const v = $(elem).find('.product-characteristics__item-value').text().trim();
                if (n && v) specs.push({ group: null, name: n, value: v });
            });

            const product: Product = {
                title,
                price,
                original_price,
                link: url,
                image: images[0],
                availability,
                store: 'DNS',
                specs: specs.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}),
                updated_at: new Date().toISOString(),
            };

            return { product, specs };
        } catch (err) {
            console.error('[Safe Parsing] Error:', err);
            throw err;
        } finally {
            await context.close();
            await browser.close();
        }
    }

    private static async createStealthContext(browser: any): Promise<BrowserContext> {
        const context = await browser.newContext({
            userAgent: this.userAgent,
            viewport: { width: 1366, height: 768 },
            locale: 'ru-RU',
            timezoneId: 'Europe/Moscow',
            extraHTTPHeaders: {
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'sec-ch-ua': '"Not/A";v="8", "Chromium";v="123", "Google Chrome";v="123"',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-mobile': '?0',
            },
        });

        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru', 'en-US'] });
            Object.defineProperty(navigator, 'language', { get: () => 'ru-RU' });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            // @ts-ignore
            window.chrome = { runtime: {} };
        });

        return context;
    }

    private static async waitForQratorCookies(context: BrowserContext, timeoutMs = 45000): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;
        for (; ;) {
            const cookies = await context.cookies();
            const names = new Set(cookies.map((c) => c.name));
            if (names.has('qrator_jsid2') || names.has('qrator_jsid')) return true;
            if (Date.now() > deadline) return false;
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    private static stripAmbiguousUnicode(input: string): string {
        return input
            .replace(/\u00a0/g, ' ')
            .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '');
    }
}
