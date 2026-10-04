import apiClient from "./apiClient";
import { Product, Category } from "../types/product";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<any[]>("/products");
    return mapBackendProductsToFrontend(response.data || []);
  },

  getProductBySlug: async (slugOrId: string): Promise<Product> => {
    const response = await apiClient.get<any>(`/products/${slugOrId}`);
    return mapBackendProductToFrontend(response.data);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data || [];
  },
};
