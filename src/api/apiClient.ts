import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { mockProducts, mockCategories } from "../mocks/products";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
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
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.warn("Backend unreachable. Falling back to mock data for:", error.config.url);
      
      const url = error.config.url || "";
      
      if (url.includes("/products")) {
        // Handle /products/:slug
        const slugMatch = url.match(/\/products\/([^\/]+)$/);
        if (slugMatch) {
          const slug = slugMatch[1];
          const product = mockProducts.find((p) => p.slug === slug);
          if (product) {
            return Promise.resolve({
              data: product,
              status: 200,
              statusText: "OK",
              headers: {},
              config: error.config,
            });
          }
        }
        
        // Handle /products (list)
        return Promise.resolve({
          data: mockProducts,
          status: 200,
          statusText: "OK",
          headers: {},
          config: error.config,
        });
      }
      
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
