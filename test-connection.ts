import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Загружаем переменные из .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 'undefined');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Пробуем выполнить простой запрос к базе данных
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Ошибка подключения к базе данных:', error.message);
      console.log('Код ошибки:', error.code);
      console.log('Детали ошибки:', error.details);
      return false;
    }

    console.log('Подключение к базе данных успешно!');
    console.log('Пример данных из таблицы products:', data);
    return true;
  } catch (err) {
    console.error('Исключение при подключении к базе данных:', err);
    return false;
  }
}

testConnection();