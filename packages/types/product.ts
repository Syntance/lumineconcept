export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  prices: ProductPrice[];
  options: Record<string, string>;
  inventory_quantity: number;
  manage_inventory: boolean;
}

export interface ProductPrice {
  amount: number;
  currency_code: string;
  min_quantity?: number;
  max_quantity?: number;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  subtitle?: string;
  thumbnail?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  categories: ProductCategory[];
  tags: ProductTag[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string;
}

export interface ProductTag {
  id: string;
  value: string;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  description: string;
  variant_prices: number[];
}
