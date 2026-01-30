// Унифицированный тип Product для всего приложения

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
    search_query?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ScrapingResult {
    products: Product[];
    totalFound: number;
    success: boolean;
    error?: string;
}

// Тип для результатов поиска продуктов
export interface ProductSearchResult {
    products: Product[];
    total?: number;
    error?: string;
}

// Тип для пагинированных результатов
export interface PaginatedProductResult extends ProductSearchResult {
    page: number;
    limit: number;
}
