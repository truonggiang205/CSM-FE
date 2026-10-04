import apiClient from "./apiClient";
import { BranchInventoryItem, ProductStockByBranch, AddStockPayload } from "../types/inventory";

export const inventoryApi = {
  getInventoryByBranch: async (branchId: string): Promise<BranchInventoryItem[]> => {
    if (!branchId) return [];
    const response = await apiClient.get<BranchInventoryItem[]>(`/inventory/branch/${branchId}`);
    return (response.data || []).map((item) => ({
      ...item,
      available: Math.max(0, (Number(item.quantity) || 0) - (Number(item.reserved_quantity) || 0)),
    }));
  },

  getStockByProduct: async (productId: string): Promise<ProductStockByBranch[]> => {
    if (!productId) return [];
    const response = await apiClient.get<ProductStockByBranch[]>(`/inventory/product/${productId}`);
    return response.data || [];
  },

  addStock: async (payload: AddStockPayload): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data?: any }>(
      "/inventory/add-stock",
      payload
    );
    return response.data;
  },
};
