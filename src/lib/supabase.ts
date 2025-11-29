import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a function to initialize Supabase client
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL in environment variables');
  }
  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables');
  }

  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// Export supabase as null initially to avoid module evaluation issues
export const supabase = null;

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

// Define the Database interface for type safety
export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Product>;
      };
    };
  };
};

export type SupabaseClientType = SupabaseClient<Database>;

// Create a server-side Supabase client
export const createServerSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
};