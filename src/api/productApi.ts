import apiClient from "./apiClient";
import { Product, Category } from "../types/product";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<any>("/products", {
      params: { limit: 1000 },
    });
    return mapBackendProductsToFrontend(response.data);
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<any>(`/products/${id}`);
    return mapBackendProductToFrontend(response.data);
  },

  getProductBySlug: async (slugOrId: string): Promise<Product> => {
    const response = await apiClient.get<any>(`/products/${slugOrId}`);
    return mapBackendProductToFrontend(response.data);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data || [];
  },

  createProduct: async (data: {
    name: string;
    sku: string;
    base_price: number;
    description?: string;
    category_id?: string;
    image_url?: string;
  }): Promise<Product> => {
    const response = await apiClient.post<any>("/products", data);
    return mapBackendProductToFrontend(response.data);
  },

  updateProduct: async (
    id: string,
    data: Partial<{
      name: string;
      sku: string;
      base_price: number;
      description?: string;
      category_id?: string;
      image_url?: string;
    }>
  ): Promise<Product> => {
    const response = await apiClient.put<any>(`/products/${id}`, data);
    return mapBackendProductToFrontend(response.data);
  },

  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/products/${id}`);
    return response.data;
  },

  uploadProductImage: async (id: string, file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post<{ image_url: string }>(`/products/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
