-- Схема базы данных для PC Configurator
-- Выполнить в Supabase SQL Editor

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  original_price TEXT,
  discount TEXT,
  link TEXT NOT NULL,
  image TEXT,
  availability TEXT,
  rating TEXT,
  store TEXT NOT NULL,
  search_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Уникальное ограничение на комбинацию link и store для upsert
ALTER TABLE products ADD CONSTRAINT unique_link_store UNIQUE (link, store);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store);
CREATE INDEX IF NOT EXISTS idx_products_search_query ON products(search_query);
CREATE INDEX IF NOT EXISTS idx_products_title ON products USING gin(to_tsvector('russian', title));
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_link_store ON products(link, store); -- для upsert

-- Таблица поисковых запросов (опционально)
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  store TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(query, store)
);

-- Индексы для search_queries
CREATE INDEX IF NOT EXISTS idx_search_queries_store ON search_queries(store);
CREATE INDEX IF NOT EXISTS idx_search_queries_last_scraped ON search_queries(last_scraped DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) политики (если нужно)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Политика для чтения продуктов (доступно всем)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Политика для вставки продуктов (только аутентифицированным пользователям)
CREATE POLICY "Products can be inserted by authenticated users" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Политика для обновления продуктов (только аутентифицированным пользователям)
CREATE POLICY "Products can be updated by authenticated users" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Аналогичные политики для search_queries
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Search queries are viewable by everyone" ON search_queries
 FOR SELECT USING (true);

CREATE POLICY "Search queries can be inserted by authenticated users" ON search_queries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Search queries can be updated by authenticated users" ON search_queries
  FOR UPDATE USING (auth.role() = 'authenticated');