import apiClient from "./apiClient";
import { VoucherItem } from "./discountApi";

export interface FlashSaleItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  original_price: number;
  sale_price: number;
  discount_percentage?: number;
  quantity_limit?: number;
  sold_count?: number;
  max_per_user?: number;
}

export interface FlashSaleCampaign {
  id: string;
  name: string;
  apply_date?: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  banner_url?: string | null;
  items: FlashSaleItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateFlashSalePayload {
  name: string;
  apply_date?: string;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  banner_url?: string;
  items: Array<{
    product_id: string;
    product_name?: string;
    product_image?: string;
    original_price: number;
    sale_price: number;
    discount_percentage?: number;
    quantity_limit?: number;
    max_per_user?: number;
  }>;
}

export interface ActiveOrUpcomingResponse {
  status: "ACTIVE" | "UPCOMING" | "NONE";
  campaign: FlashSaleCampaign | null;
  startTime?: string;
  endTime?: string;
  targetTime?: string;
  items: FlashSaleItem[];
}

export interface TodayDealItem {
  id: string;
  product_id: string;
  product_name: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  quantity_limit: number;
  sold_count: number;
  max_per_user: number;
  campaign_id: string;
  campaign_name: string;
  start_time: string;
  end_time: string;
  status: "ACTIVE" | "UPCOMING" | "ENDED";
}

export interface TodayDealsResponse {
  flashSale: ActiveOrUpcomingResponse;
  vouchers: VoucherItem[];
  deals: TodayDealItem[];
}

export const flashSaleApi = {
  getActiveOrUpcoming: async (): Promise<ActiveOrUpcomingResponse> => {
    try {
      const res = await apiClient.get<ActiveOrUpcomingResponse>("/flash-sales/current");
      return res.data;
    } catch {
      return { status: "NONE", campaign: null, items: [] };
    }
  },

  getTodayDeals: async (): Promise<TodayDealsResponse> => {
    try {
      const res = await apiClient.get<TodayDealsResponse>("/discounts/today-deals");
      return res.data;
    } catch {
      return {
        flashSale: { status: "NONE", campaign: null, items: [] },
        vouchers: [],
        deals: [],
      };
    }
  },

  getAll: async (): Promise<FlashSaleCampaign[]> => {
    const res = await apiClient.get<FlashSaleCampaign[]>("/flash-sales");
    return res.data;
  },

  getById: async (id: string): Promise<FlashSaleCampaign> => {
    const res = await apiClient.get<FlashSaleCampaign>(`/flash-sales/${id}`);
    return res.data;
  },

  create: async (payload: CreateFlashSalePayload): Promise<FlashSaleCampaign> => {
    const res = await apiClient.post<FlashSaleCampaign>("/flash-sales", payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<CreateFlashSalePayload>): Promise<FlashSaleCampaign> => {
    const res = await apiClient.patch<FlashSaleCampaign>(`/flash-sales/${id}`, payload);
    return res.data;
  },

  toggle: async (id: string): Promise<FlashSaleCampaign> => {
    const res = await apiClient.patch<FlashSaleCampaign>(`/flash-sales/${id}/toggle`);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/flash-sales/${id}`);
    return res.data;
  },

  recordPurchase: async (items: Array<{ productId: string; quantity: number }>): Promise<{ success: boolean; updated: number }> => {
    const res = await apiClient.post<{ success: boolean; updated: number }>("/flash-sales/record-purchase", { items });
    return res.data;
  },

  rollbackPurchase: async (items: Array<{ productId: string; quantity: number }>): Promise<{ success: boolean; rolledBack: number }> => {
    const res = await apiClient.post<{ success: boolean; rolledBack: number }>("/flash-sales/rollback-purchase", { items });
    return res.data;
  },
};
