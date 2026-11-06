import apiClient from "./apiClient";
import { Product, Category } from "../types/product";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  all?: boolean;
}

export const productApi = {
  /**
   * Lấy danh sách sản phẩm.
   * Hỗ trợ cả BE trả mảng thô và BE trả đối tượng phân trang { items, total, totalPages }.
   * Mặc định (hoặc khi không truyền all=false): Tải toàn bộ sản phẩm (limit đủ lớn và lặp theo totalPages nếu cần),
   * không bao giờ bị cắt cụt ở 10 hay 20 sản phẩm.
   */
  getProducts: async (optionsOrContext?: any): Promise<Product[]> => {
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
      return mapBackendProductsToFrontend(response.data);
    }

    // Mặc định cho mọi nơi cần TOÀN BỘ sản phẩm (HomePage, InventoryPage productMap, giỏ hàng...):
    // Đọc DTO query-product.dto.ts của BE: default=10, min=1, không giới hạn trần cứng.
    // Gửi limit ban đầu đủ lớn (100) và lặp theo totalPages nếu totalPages > 1.
    const initialLimit = 100;
    const firstRes = await apiClient.get<any>("/products", {
      params: { page: 1, limit: initialLimit },
    });

    const firstPageProducts = mapBackendProductsToFrontend(firstRes.data);

    // Kiểm tra nếu Backend trả đối tượng phân trang có nhiều hơn 1 trang
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

      return allProducts;
    }

    return firstPageProducts;
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
};
