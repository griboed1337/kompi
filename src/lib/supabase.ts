import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для базы данных
export interface Product {
  id?: string;
  title: string;
  price: string;
  original_price?: string;
  discount?: string;
  link: string;
  image?: string;
  availability?: string;
  rating?: string;
  store: string;
  search_query: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScrapingResult {
  products: Product[];
  totalFound: number;
  success: boolean;
  error?: string;
}