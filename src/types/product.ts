export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface BackendProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  base_price: number | string;
  image_url?: string;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  description: string;
  images: string[];
  category: Category;
  stock: number;
  rating: number;
  reviewsCount: number;
}
