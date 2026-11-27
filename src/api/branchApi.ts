import apiClient from "./apiClient";
import { Branch } from "../types/branch";

export interface CreateBranchInput {
  id?: string;
  name: string;
  address: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}

export const branchApi = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get<Branch[]>("/branches");
    return response.data || [];
  },

  getAllBranchesAdmin: async (): Promise<Branch[]> => {
    const response = await apiClient.get<Branch[]>("/branches?all=true");
    return response.data || [];
  },

  getBranchById: async (id: string): Promise<Branch> => {
    const response = await apiClient.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  getNearestBranch: async (lat: number, lng: number): Promise<Branch> => {
    const response = await apiClient.get<Branch>(`/branches/nearest?lat=${lat}&lng=${lng}`);
    return response.data;
  },

  createBranch: async (data: CreateBranchInput): Promise<Branch> => {
    const response = await apiClient.post<Branch>("/branches", data);
    return response.data;
  },

  updateBranch: async (id: string, data: UpdateBranchInput): Promise<Branch> => {
    const response = await apiClient.put<Branch>(`/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/branches/${id}`);
    return response.data;
  },
};


