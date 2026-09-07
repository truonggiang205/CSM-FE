import apiClient, { ApiUnavailableError } from './apiClient';
import { Product, mockProducts } from '../mocks/products.mock';

// Helper to simulate network delay for mocks
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const productService = {
  getProducts: async (category?: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products', {
        params: { category },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(300); // simulate delay to avoid flashing loading states
        if (category) {
          return mockProducts.filter((p) => p.category === category);
        }
        return mockProducts;
      }
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(300);
        return mockProducts.find((p) => p.id === id);
      }
      throw error;
    }
  },
};
