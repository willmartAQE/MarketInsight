export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  discount_pct: number | null;
  rating: number | null;
  reviews_count: number | null;
  category: string;
  source: string;
  url: string;
  image_url: string | null;
  seller: string | null;
  availability: string | null;
  country: string;
  currency?: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PricePoint {
  price: number;
  date: string;
}

export interface Stats {
  total_products: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  avg_rating: number;
  sources: { name: string; count: number }[];
  categories: { name: string; count: number }[];
  price_ranges: { label: string; count: number }[];
}

export interface ScrapeLog {
  id: number;
  source: string;
  status: string;
  products_found: number;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface Filters {
  source: string | null;
  category: string | null;
  country: string | null;
  sort_by: string;
  order: "asc" | "desc";
  min_price: number | null;
  max_price: number | null;
}

export interface StoreConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export interface CountryStores {
  name: string;
  flag: string;
  currency: string;
  stores: StoreConfig[];
}
