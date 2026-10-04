import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { mockProducts, mockCategories } from "../mocks/products";
import { mockBranches } from "../mocks/branches";
import { getMockInventoryByBranch, getMockStockByProduct, addMockStock } from "../mocks/inventory";
import { mapBackendProductToFrontend, mapBackendProductsToFrontend } from "./mappers";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is a network error (BE not reachable)
    if (error.code === "ERR_NETWORK" || error.message === "Network Error" || error.code === "ECONNABORTED") {
      const url = error.config?.url || "";
      console.warn("Backend unreachable. Falling back to mock data for:", url);

      // 1. Fallback cho /branches
      if (url.includes("/branches")) {
        const branchMatch = url.match(/\/branches\/([^\/]+)$/);
        if (branchMatch) {
          const branchId = branchMatch[1];
          const branch = mockBranches.find((b) => b.id === branchId) || mockBranches[0];
          return Promise.resolve({
            data: branch,
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          });
        }
        return Promise.resolve({
          data: mockBranches,
          status: 200,
          statusText: "OK",
          headers: {},
          config: error.config,
        });
      }

      // 2. Fallback cho /inventory
      if (url.includes("/inventory")) {
        // GET /inventory/branch/:branchId
        const branchStockMatch = url.match(/\/inventory\/branch\/([^\/]+)$/);
        if (branchStockMatch) {
          const branchId = branchStockMatch[1];
          return Promise.resolve({
            data: getMockInventoryByBranch(branchId),
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          });
        }

        // GET /inventory/product/:productId
        const prodStockMatch = url.match(/\/inventory\/product\/([^\/]+)$/);
        if (prodStockMatch) {
          const productId = prodStockMatch[1];
          return Promise.resolve({
            data: getMockStockByProduct(productId),
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          });
        }

        // POST /inventory/add-stock
        if (url.includes("/inventory/add-stock") && error.config?.method?.toLowerCase() === "post") {
          let payload = { branchId: "br-01", productId: "p1", quantity: 10 };
          try {
            if (typeof error.config.data === "string") {
              payload = JSON.parse(error.config.data);
            } else if (error.config.data) {
              payload = error.config.data;
            }
          } catch {
            // ignore JSON parse error
          }
          const updated = addMockStock(payload.branchId, payload.productId, Number(payload.quantity) || 0);
          return Promise.resolve({
            data: { success: true, message: "Nhập kho thành công (mock)", data: updated },
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          });
        }
      }

      // 3. Fallback cho /products
      if (url.includes("/products")) {
        const slugMatch = url.match(/\/products\/([^\/]+)$/);
        if (slugMatch) {
          const slugOrId = slugMatch[1];
          const product = mockProducts.find((p) => p.slug === slugOrId || p.id === slugOrId);
          if (product) {
            return Promise.resolve({
              data: mapBackendProductToFrontend(product),
              status: 200,
              statusText: "OK",
              headers: {},
              config: error.config,
            });
          }
        }

        return Promise.resolve({
          data: mapBackendProductsToFrontend(mockProducts),
          status: 200,
          statusText: "OK",
          headers: {},
          config: error.config,
        });
      }

      // 4. Fallback cho /categories
      if (url.includes("/categories")) {
        return Promise.resolve({
          data: mockCategories,
          status: 200,
          statusText: "OK",
          headers: {},
          config: error.config,
        });
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
