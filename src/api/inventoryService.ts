import apiClient, { ApiUnavailableError } from './apiClient';
import { InventoryItem, mockInventory, mockBranches } from '../mocks/inventory.mock';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const inventoryService = {
  getBranches: async () => {
    try {
      const response = await apiClient.get('/branches');
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(200);
        return mockBranches;
      }
      throw error;
    }
  },

  getStockByBranch: async (branchId: string): Promise<InventoryItem[]> => {
    try {
      const response = await apiClient.get<InventoryItem[]>(`/inventory/branch/${branchId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        await delay(300);
        return mockInventory.filter((item) => item.branchId === branchId);
      }
      throw error;
    }
  },
};
