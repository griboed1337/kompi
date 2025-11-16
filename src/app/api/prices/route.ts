import { NextRequest, NextResponse } from 'next/server';
import { PriceAggregationService } from '@/lib/services/price-aggregation';
import { ComponentCategory } from '@/types/component';
import { priceCache, CacheUtils } from '@/lib/utils/cache';

const priceService = new PriceAggregationService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');
    const searchQuery = searchParams.get('search') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true';

    // Парсим категории
    let categories: ComponentCategory[] = ['cpu'];
    if (categoriesParam) {
      try {
        categories = JSON.parse(categoriesParam);
      } catch {
        categories = categoriesParam.split(',') as ComponentCategory[];
      }
    }

    // Валидация параметров
    const validCategories: ComponentCategory[] = [
      'cpu', 'gpu', 'motherboard', 'ram', 'storage', 
      'psu', 'case', 'cooler', 'monitor', 'keyboard', 'mouse'
    ];

    const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: `Invalid categories: ${invalidCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (maxResults < 1 || maxResults > 100) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Генерируем ключ кэша
    const cacheKey = CacheUtils.generateKey(
      'prices', 
      categories.join(','), 
      searchQuery, 
      maxResults.toString(),
      includeOutOfStock.toString()
    );

    // Проверяем кэш
    const cachedResult = priceCache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
        timestamp: new Date()
      });
    }

    // Получаем данные
    const results = await priceService.aggregatePrices({
      categories,
      maxResults,
      searchQuery,
      includeOutOfStock
    });

    // Кэшируем результат
    priceCache.set(cacheKey, results, 5 * 60 * 1000); // 5 минут

    // Подсчитываем общую статистику
    const totalComponents = results.reduce((sum, result) => sum + result.results.length, 0);
    const totalSources = [...new Set(results.flatMap(result => result.sources))];

    return NextResponse.json({
      success: true,
      data: results,
      cached: false,
      meta: {
        totalComponents,
        categoriesProcessed: categories.length,
        totalSources: totalSources.length,
        sources: totalSources,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Price aggregation API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      categories, 
      searchQuery = '', 
      maxResults = 20, 
      includeOutOfStock = false,
      filters = {}
    } = body;

    // Валидация
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'categories must be a non-empty array' },
        { status: 400 }
      );
    }

    // Получаем агрегированные данные
    const results = await priceService.aggregatePrices({
      categories,
      maxResults,
      searchQuery,
      includeOutOfStock
    });

    // Применяем дополнительные фильтры, если есть
    const filteredResults = results.map(result => {
      let filteredComponents = result.results;

      // Фильтр по цене
      if (filters.minPrice || filters.maxPrice) {
        filteredComponents = filteredComponents.filter(comp => {
          const price = comp.lowestPrice.value;
          return (!filters.minPrice || price >= filters.minPrice) &&
                 (!filters.maxPrice || price <= filters.maxPrice);
        });
      }

      // Фильтр по бренду
      if (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0) {
        filteredComponents = filteredComponents.filter(comp =>
          filters.brands.some((brand: string) => 
            comp.component.brand.toLowerCase().includes(brand.toLowerCase())
          )
        );
      }

      // Фильтр по наличию
      if (filters.availability && Array.isArray(filters.availability)) {
        filteredComponents = filteredComponents.filter(comp =>
          filters.availability.includes(comp.lowestPrice.availability)
        );
      }

      return {
        ...result,
        results: filteredComponents,
        totalFound: filteredComponents.length
      };
    });

    return NextResponse.json({
      success: true,
      data: filteredResults,
      meta: {
        filtersApplied: Object.keys(filters).length > 0,
        filters,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Advanced price search API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}