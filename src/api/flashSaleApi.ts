import apiClient from "./apiClient";
import { VoucherItem } from "./discountApi";

/** Kiểu giảm giá của một món Flash Sale: theo % hoặc trừ thẳng tiền mặt (VNĐ). */
export type FlashSaleDiscountType = "PERCENT" | "FIXED_AMOUNT";

export interface FlashSaleItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  original_price: number;
  sale_price: number;
  discount_percentage?: number;
  discount_type?: FlashSaleDiscountType;
  discount_value?: number;
  quantity_limit?: number;
  sold_count?: number;
  max_per_user?: number;
}

export interface FlashSaleCampaign {
  id: string;
  name: string;
  apply_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
  apply_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  banner_url?: string;
  items: Array<{
    product_id: string;
    product_name?: string;
    product_image?: string;
    original_price: number;
    sale_price?: number;
    discount_percentage?: number;
    discount_type?: FlashSaleDiscountType;
    discount_value?: number;
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
  startDateTime?: string;
  endDateTime?: string;
  targetDateTime?: string;
  items: FlashSaleItem[];
}

export interface TodayDealItem {
  id: string;
  product_id: string;
  product_name: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  discount_type?: FlashSaleDiscountType;
  discount_value?: number;
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

/**
 * Nhãn giảm giá hiển thị trên badge: "-20%" khi giảm theo %, "-5.000đ" khi giảm tiền mặt.
 * Dữ liệu cũ (không có discount_type) được hiểu là giảm theo %.
 */
export function formatFlashSaleDiscount(item: {
  original_price: number | string;
  sale_price: number | string;
  discount_percentage?: number | string;
  discount_type?: FlashSaleDiscountType;
  discount_value?: number | string;
}): string {
  const original = Number(item.original_price) || 0;
  const sale = Number(item.sale_price) || 0;
  if (item.discount_type === "FIXED_AMOUNT") {
    const amount = Number(item.discount_value) || Math.max(0, original - sale);
    return `-${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
  }
  const percent =
    Number(item.discount_percentage) || (original > 0 ? Math.round(((original - sale) / original) * 100) : 0);
  return `-${percent}%`;
}
