export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
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
