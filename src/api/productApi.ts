import apiClient from "./apiClient";
import { Product, Category } from "../types/product";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  all?: boolean;
  /** Chỉ ADMIN: lấy cả sản phẩm đang Tạm ngưng. */
  includeInactive?: boolean;
}

export const productApi = {
  getProducts: async (optionsOrContext?: any): Promise<Product[]> => {
    try {
      const isExplicitOptions =
        optionsOrContext &&
        typeof optionsOrContext === "object" &&
        !Array.isArray(optionsOrContext) &&
        !("queryKey" in optionsOrContext) &&
        (typeof optionsOrContext.page === "number" ||
          typeof optionsOrContext.limit === "number" ||
          typeof optionsOrContext.all === "boolean" ||
          typeof optionsOrContext.includeInactive === "boolean");

      const options: GetProductsOptions | undefined = isExplicitOptions ? optionsOrContext : undefined;
      const extraParams = options?.includeInactive ? { includeInactive: "true" } : {};

      if (options && options.all === false && (options.page || options.limit)) {
        const response = await apiClient.get<any>("/products", {
          params: {
            page: options.page || 1,
            limit: options.limit || 10,
            ...extraParams,
          },
        });
        return mapBackendProductsToFrontend(response.data);
      }

      const initialLimit = 100;
      const firstRes = await apiClient.get<any>("/products", {
        params: { page: 1, limit: initialLimit, ...extraParams },
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
              params: { page, limit: initialLimit, ...extraParams },
            })
          );
        }

        const remainingResponses = await Promise.all(remainingPromises);
        const allProducts = [...firstPageProducts];

        for (const res of remainingResponses) {
          const nextProducts = mapBackendProductsToFrontend(res.data);
          allProducts.push(...nextProducts);
        }

        return allProducts;
      }

      return firstPageProducts;
    } catch {
      return [];
    }
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
    try {
      const response = await apiClient.get<Category[]>("/categories");
      const list = Array.isArray(response.data) ? response.data : (response.data as any)?.items || [];
      return list;
    } catch {
      return [];
    }
  },

  getMyWishlist: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>("/products/wishlist/my");
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  toggleWishlist: async (productId: string): Promise<{ wishlisted: boolean; productId: string }> => {
    const response = await apiClient.post<{ wishlisted: boolean; productId: string }>(
      `/products/${productId}/wishlist`
    );
    return response.data;
  },

  toggleFeatured: async (
    productId: string,
    isFeatured?: boolean,
    curatorNote?: string
  ): Promise<Product> => {
    const response = await apiClient.patch<any>(`/products/${productId}/featured`, {
      is_featured: isFeatured,
      curator_note: curatorNote,
    });
    return mapBackendProductToFrontend(response.data);
  },

  createProduct: async (data: {
    name: string;
    sku: string;
    base_price: number;
    description?: string;
    category_id?: string;
    image_url?: string;
    is_active?: boolean;
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
      is_active?: boolean;
    }>
  ): Promise<Product> => {
    const response = await apiClient.put<any>(`/products/${id}`, data);
    return mapBackendProductToFrontend(response.data);
  },

  // Đổi trạng thái bán: Đang bán (true) / Tạm ngưng (false)
  updateProductStatus: async (id: string, isActive: boolean): Promise<Product> => {
    const response = await apiClient.patch<any>(`/products/${id}/status`, { is_active: isActive });
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
