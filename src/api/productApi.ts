import apiClient from "./apiClient";
import { Product, Category } from "../types/product";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";
import { mockProducts, mockCategories } from "../mocks/products";

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  all?: boolean;
}

export const productApi = {
  /**
   * Lấy danh sách sản phẩm.
   * Hỗ trợ cả BE trả mảng thô và BE trả đối tượng phân trang { items, total, totalPages }.
   * Mặc định: Tải toàn bộ sản phẩm, tự động fallback về mockProducts nếu Backend offline.
   */
  getProducts: async (optionsOrContext?: any): Promise<Product[]> => {
    try {
      const isExplicitOptions =
        optionsOrContext &&
        typeof optionsOrContext === "object" &&
        !Array.isArray(optionsOrContext) &&
        !("queryKey" in optionsOrContext) &&
        (typeof optionsOrContext.page === "number" ||
          typeof optionsOrContext.limit === "number" ||
          typeof optionsOrContext.all === "boolean");

      const options: GetProductsOptions | undefined = isExplicitOptions ? optionsOrContext : undefined;

      // Nếu người gọi yêu cầu cụ thể 1 trang đơn lẻ (all === false)
      if (options && options.all === false && (options.page || options.limit)) {
        const response = await apiClient.get<any>("/products", {
          params: {
            page: options.page || 1,
            limit: options.limit || 10,
          },
        });
        const mapped = mapBackendProductsToFrontend(response.data);
        return mapped.length > 0 ? mapped : mockProducts;
      }

      const initialLimit = 100;
      const firstRes = await apiClient.get<any>("/products", {
        params: { page: 1, limit: initialLimit },
      });

      const firstPageProducts = mapBackendProductsToFrontend(firstRes.data);

      const rawData = firstRes.data;
      if (
        rawData &&
        typeof rawData === "object" &&
        typeof rawData.totalPages === "number" &&
        rawData.totalPages > 1
      ) {
        const totalPages = rawData.totalPages;
        const remainingPromises: Promise<any>[] = [];

        for (let page = 2; page <= totalPages; page++) {
          remainingPromises.push(
            apiClient.get<any>("/products", {
              params: { page, limit: initialLimit },
            })
          );
        }

        const remainingResponses = await Promise.all(remainingPromises);
        const allProducts = [...firstPageProducts];

        for (const res of remainingResponses) {
          const nextProducts = mapBackendProductsToFrontend(res.data);
          allProducts.push(...nextProducts);
        }

        return allProducts.length > 0 ? allProducts : mockProducts;
      }

      return firstPageProducts.length > 0 ? firstPageProducts : mockProducts;
    } catch (err) {
      console.warn("Backend /products chưa sẵn sàng, kích hoạt dữ liệu mẫu mockProducts:", err);
      return mockProducts;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<any>(`/products/${id}`);
      return mapBackendProductToFrontend(response.data);
    } catch {
      const found = mockProducts.find((p) => p.id === id);
      if (found) return found;
      return mockProducts[0];
    }
  },

  getProductBySlug: async (slugOrId: string): Promise<Product> => {
    try {
      const response = await apiClient.get<any>(`/products/${slugOrId}`);
      return mapBackendProductToFrontend(response.data);
    } catch {
      const found = mockProducts.find((p) => p.slug === slugOrId || p.id === slugOrId);
      if (found) return found;
      return mockProducts[0];
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get<Category[]>("/categories");
      const list = Array.isArray(response.data) ? response.data : (response.data as any)?.items || [];
      return list.length > 0 ? list : mockCategories;
    } catch (err) {
      console.warn("Backend /categories chưa sẵn sàng, kích hoạt danh mục mẫu mockCategories:", err);
      return mockCategories;
    }
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
