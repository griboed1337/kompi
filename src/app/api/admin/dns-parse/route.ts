import { NextRequest, NextResponse } from 'next/server';
import { DnsParserService } from '@/lib/services/dns';
import { normalizeHardwareData } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';
import { CATEGORY_URLS } from '../../../../lib/parsers/category-urls';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORY_MAP: Record<string, string> = {
    'процессоры': 'cpu',
    'видеокарты': 'gpu',
    'материнские платы': 'motherboard',
    'оперативная память': 'ram',
    'накопители SSD': 'ssd',
    'блоки питания': 'psu',
    'корпуса': 'case',
    'охлаждение': 'cooler'
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { category = 'процессоры', count = 5 } = body;

        const categoryKey = CATEGORY_MAP[category];
        if (!categoryKey) {
            return NextResponse.json({ success: false, error: `Неизвестная категория: ${category}` }, { status: 400 });
        }

        const urlsConfig = CATEGORY_URLS[categoryKey];
        if (!urlsConfig || !urlsConfig.dns) {
            return NextResponse.json({ success: false, error: `URL для DNS-shop не найден для категории: ${category}` }, { status: 400 });
        }

        const tableName = `products_${categoryKey.toLowerCase()}`;

        // 1. Проверка на наличие в БД (получаем все существующие ссылки для категории)
        const { data: existingProducts } = await supabase
            .from(tableName)
            .select('link');

        const existingLinks = new Set(existingProducts?.map(p => p.link) || []);
        console.log(`[Admin DNS] Найдено ${existingLinks.size} существующих товаров в БД.`);

        console.log(`[Admin DNS] Запущено сканирование каталога: ${urlsConfig.dns}`);
        const allUrls = await DnsParserService.getUrlsFromCatalog(urlsConfig.dns, count + 5); // Берем с запасом

        // Фильтруем ссылки, которых еще нет в БД
        const newUrls = allUrls.filter(url => !existingLinks.has(url)).slice(0, count);

        if (newUrls.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                message: 'Все товары из каталога уже есть в базе данных'
            });
        }

        console.log(`[Admin DNS] Найдено ${newUrls.length} новых товаров. Начинаем парсинг и нормализацию...`);
        let savedCount = 0;

        for (const url of newUrls) {
            try {
                // Парсим сырые данные
                const rawData = await DnsParserService.parseProduct(url);

                if (rawData.product.title) {
                    console.log(`[Admin DNS] Нормализация через AI: ${rawData.product.title}`);

                    // 2. Нормализация через нейросеть
                    const normalizedProduct = await normalizeHardwareData(rawData.product, category);

                    const { error } = await supabase
                        .from(tableName)
                        .upsert({
                            ...normalizedProduct,
                            link: url, // Гарантируем оригинальную ссылку
                            store: 'DNS',
                            search_query: category,
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'link,store'
                        });

                    if (!error) {
                        savedCount++;
                        console.log(`[Admin DNS] Успешно сохранено: ${normalizedProduct.title}`);
                    } else {
                        console.error(`[Admin DNS] Ошибка сохранения ${normalizedProduct.title}:`, error.message);
                    }
                }
            } catch (err) {
                console.error(`[Admin DNS] Ошибка обработки ${url}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            count: savedCount,
            message: `Успешно спарсено, нормализовано AI и сохранено ${savedCount} товаров из DNS`
        });

    } catch (error) {
        console.error('Ошибка в API dns-parse:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 });
    }
}
