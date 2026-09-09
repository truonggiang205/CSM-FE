import apiClient from "./apiClient";
import { Product, Category } from "../types/product";

export const productApi = {
  getProducts: async () => {
    const response = await apiClient.get<Product[]>("/products");
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get<Product>(`/products/${slug}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },
};
