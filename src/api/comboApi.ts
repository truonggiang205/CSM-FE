import apiClient from "./apiClient";

export interface ComboItemDetail {
  id?: string;
  combo_id?: string;
  product_id: string;
  product_name?: string | null;
  product_image?: string | null;
  original_price: number;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  description?: string | null;
  combo_price: number;
  original_price: number;
  image_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  max_quantity?: number | null;
  sold_count: number;
  is_active: boolean;
  items: ComboItemDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateComboPayload {
  name: string;
  description?: string;
  combo_price: number;
  original_price?: number;
  image_url?: string;
  start_date?: string | null;
  end_date?: string | null;
  max_quantity?: number | null;
  is_active?: boolean;
  items: Array<{
    product_id: string;
    product_name?: string;
    product_image?: string;
    original_price?: number;
    quantity: number;
  }>;
}

export const comboApi = {
  getPublicCombos: async (): Promise<Combo[]> => {
    try {
      const res = await apiClient.get<Combo[]>("/combos");
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getAllCombos: async (): Promise<Combo[]> => {
    const res = await apiClient.get<Combo[]>("/combos?all=true");
    return Array.isArray(res.data) ? res.data : [];
  },

  getComboById: async (id: string): Promise<Combo> => {
    const res = await apiClient.get<Combo>(`/combos/${id}`);
    return res.data;
  },

  createCombo: async (payload: CreateComboPayload): Promise<Combo> => {
    const res = await apiClient.post<Combo>("/combos", payload);
    return res.data;
  },

  updateCombo: async (id: string, payload: Partial<CreateComboPayload>): Promise<Combo> => {
    const res = await apiClient.patch<Combo>(`/combos/${id}`, payload);
    return res.data;
  },

  toggleCombo: async (id: string): Promise<Combo> => {
    const res = await apiClient.patch<Combo>(`/combos/${id}/toggle`);
    return res.data;
  },

  deleteCombo: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/combos/${id}`);
    return res.data;
  },
};

