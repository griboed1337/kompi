// Базовые типы для компонентов ПК

export interface Price {
  value: number;
  currency: string;
  retailer: string;
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order';
  lastUpdated: Date;
}

export interface ComponentSpecs {
  [key: string]: string | number | boolean;
}

export interface PCComponent {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: ComponentCategory;
  imageUrl?: string;
  specifications: ComponentSpecs;
  prices: Price[];
  averagePrice?: number;
  lowestPrice?: number;
  compatibility?: CompatibilityInfo;
  reviews?: Review[];
}

export type ComponentCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'keyboard'
  | 'mouse';

export interface CompatibilityInfo {
  socket?: string;
  chipset?: string;
  ramType?: string;
  maxRamSpeed?: number;
  powerRequirement?: number;
  formFactor?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

export interface Review {
  rating: number;
  count: number;
  source: string;
}

export interface ComponentScrapingResult {
  components: PCComponent[];
  timestamp: Date;
  source: string;
  errors?: string[];
}

export interface RetailerConfig {
  name: string;
  baseUrl: string;
  selectors: {
    productContainer: string;
    name: string;
    price: string;
    availability: string;
    image?: string;
    link: string;
    rating?: string;
    reviewCount?: string;
  };
  rateLimit: number; // requests per minute
}