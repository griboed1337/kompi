import { getSupabaseClient, getAdminSupabaseClient } from './supabase';
import type { Product } from './supabase';

// Реэкспортируем тип для удобства
export type { Product };

// Функция-хелпер для получения имени таблицы по категории
function getTableName(category: string): string {
  const cat = category.toLowerCase();

  // Процессоры
  if (cat.includes('процессор') || cat === 'cpu') return 'products_cpu';

  // Видеокарты
  if (cat.includes('видеокарт') || cat === 'gpu') return 'products_gpu';

  // Материнские платы
  if (cat.includes('плата') || cat === 'motherboard') return 'products_motherboard';

  // Оперативная память
  if (cat.includes('память') || cat.includes('ram')) return 'products_ram';

  // Накопители
  if (cat.includes('накопител') || cat.includes('ssd') || cat.includes('hdd') || cat === 'storage') return 'products_ssd';

  // Блоки питания
  if (cat.includes('блок питания') || cat.includes('psu')) return 'products_psu';

  // Корпуса
  if (cat.includes('корпус') || cat === 'case') return 'products_case';

  // Охлаждение
  if (cat.includes('охлажден') || cat.includes('кулер') || cat === 'cooler') return 'products_cooling';

  return 'products'; // fallback
}

// Функция для сохранения продуктов в базу данных
export async function saveProducts(products: Product[], category: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tableName = getTableName(category);
    const productsToInsert = products.map(product => {
      // Гарантируем наличие ссылки, чтобы не нарушать констрейнт
      const link = product.link || `https://www.google.com/search?q=${encodeURIComponent(product.title)}`;

      return {
        ...product,
        link,
        search_query: category,
        updated_at: new Date().toISOString(),
      };
    });

    // Используем upsert для обновления существующих продуктов
    // Пытаемся использовать админ-клиент для обхода RLS
    let supabase = getAdminSupabaseClient();

    // Если админ-клиент не настроен, используем обычный
    if (!supabase) {
      supabase = getSupabaseClient();
    }

    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    const { error } = await supabase
      .from(tableName as any)
      .upsert(productsToInsert, {
        onConflict: 'link,store',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Ошибка при сохранении продуктов:', error);
      return { success: false, error: error.message };
    }

    console.log(`Сохранено ${products.length} продуктов в таблицу ${tableName} для категории "${category}"`);
    return { success: true };
  } catch (error) {
    console.error('Ошибка в saveProducts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Функция для получения продуктов по поисковому запросу
export async function getProductsByQuery(searchQuery: string, store?: string): Promise<{ products: Product[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { products: [], error: 'Supabase client not initialized' };
    }

    const tableName = getTableName(searchQuery);
    let queryBuilder = supabase
      .from(tableName as any)
      .select('*')
      .order('updated_at', { ascending: false });

    if (store) {
      queryBuilder = queryBuilder.eq('store', store);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Ошибка при получении продуктов:', error);
      return { products: [], error: error.message };
    }

    return { products: data || [] };
  } catch (error) {
    console.error('Ошибка в getProductsByQuery:', error);
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Функция для получения всех продуктов с пагинацией
export async function getAllProducts(page: number = 1, limit: number = 50, store?: string): Promise<{ products: Product[]; total: number; error?: string }> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { products: [], total: 0, error: 'Supabase client not initialized' };
    }

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (store) {
      query = query.eq('store', store);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Ошибка при получении продуктов:', error);
      return { products: [], total: 0, error: error.message };
    }

    return { products: data || [], total: count || 0 };
  } catch (error) {
    console.error('Ошибка в getAllProducts:', error);
    return {
      products: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Функция для поиска продуктов по названию
export async function searchProducts(query: string, store?: string, category?: string, maxPrice?: number): Promise<{ products: Product[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { products: [], error: 'Supabase client not initialized' };
    }

    const tableName = getTableName(category || query);
    let supabaseQuery = supabase
      .from(tableName as any)
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(100);

    if (store) {
      supabaseQuery = supabaseQuery.eq('store', store);
    }

    const { data, error } = await supabaseQuery;

    // Сортировка по цене (так как в БД цена это строка с '₽', парсим ее)
    let results = data || [];

    const parsePrice = (priceStr: any): number => {
      if (typeof priceStr === 'number') return priceStr;
      if (!priceStr) return 0;
      return parseFloat(String(priceStr).replace(/[^\d.,-]/g, '').replace(',', '.'));
    };

    if (maxPrice) {
      results = results.filter(p => parsePrice(p.price) <= maxPrice);
    }

    // Сортируем: сначала те, что дешевле
    return { products: results };
  } catch (error) {
    console.error('Ошибка в searchProducts:', error);
    return {
      products: [],
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

// Функция для очистки старых продуктов (старше 30 дней)
export async function cleanupOldProducts(): Promise<{ success: boolean; error?: string }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Ошибка при очистке старых продуктов:', error);
      return { success: false, error: error.message };
    }

    console.log('Очищены старые продукты');
    return { success: true };
  } catch (error) {
    console.error('Ошибка в cleanupOldProducts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}