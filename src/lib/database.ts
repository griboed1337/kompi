import { supabase } from './supabase';
import type { Product } from './supabase';

// Реэкспортируем тип для удобства
export type { Product };

// Функция для сохранения продуктов в базу данных
export async function saveProducts(products: Product[], searchQuery: string): Promise<{ success: boolean; error?: string }> {
  try {
    const productsToInsert = products.map(product => ({
      ...product,
      search_query: searchQuery,
      updated_at: new Date().toISOString(),
    }));

    // Используем upsert для обновления существующих продуктов
    const { error } = await supabase
      .from('products')
      .upsert(productsToInsert, {
        onConflict: 'link,store', // Обновляем по уникальной комбинации link и store
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Ошибка при сохранении продуктов:', error);
      return { success: false, error: error.message };
    }

    console.log(`Сохранено ${products.length} продуктов для запроса "${searchQuery}"`);
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
    let query = supabase
      .from('products')
      .select('*')
      .eq('search_query', searchQuery)
      .order('created_at', { ascending: false });

    if (store) {
      query = query.eq('store', store);
    }

    const { data, error } = await query;

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

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
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
export async function searchProducts(query: string, store?: string): Promise<{ products: Product[]; error?: string }> {
  try {
    let supabaseQuery = supabase
      .from('products')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (store) {
      supabaseQuery = supabaseQuery.eq('store', store);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Ошибка при поиске продуктов:', error);
      return { products: [], error: error.message };
    }

    return { products: data || [] };
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