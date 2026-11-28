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

export interface ProductFlashSaleMeta {
  soldCount: number;
  quantityLimit: number;
  endTime?: string;
  isSoldOut?: boolean;
  /** Nhãn giảm giá theo kiểu Admin chọn: "-20%" hoặc "-5.000đ" */
  discountLabel?: string;
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
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  flashSaleMeta?: ProductFlashSaleMeta;
  isFeatured?: boolean;
  curatorNote?: string;
  /** Đang bán (true) / Tạm ngưng (false). Mặc định Đang bán khi BE chưa trả trường này. */
  isActive?: boolean;
}
