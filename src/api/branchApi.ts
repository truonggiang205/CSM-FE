import apiClient from "./apiClient";
import { Branch } from "../types/branch";

export const branchApi = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get<Branch[]>("/branches");
    return response.data || [];
  },

  getBranchById: async (id: string): Promise<Branch> => {
    const response = await apiClient.get<Branch>(`/branches/${id}`);
    return response.data;
  },
};
