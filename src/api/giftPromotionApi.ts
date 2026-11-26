import apiClient from "./apiClient";

export type GiftRuleType = "BUY_X_GET_Y" | "MIN_ORDER_GIFT";

export interface GiftPromotion {
  id: string;
  name: string;
  description?: string | null;
  rule_type: GiftRuleType;
  buy_product_id?: string | null;
  buy_product_name?: string | null;
  buy_quantity: number;
  min_order_amount?: number | null;
  gift_product_id: string;
  gift_product_name?: string | null;
  gift_quantity: number;
  max_gifts_per_order: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface QualifiedGift {
  promotionId: string;
  promotionName: string;
  productId: string;
  productName: string;
  quantity: number;
}

export interface CreateGiftPromotionPayload {
  name: string;
  description?: string;
  rule_type: GiftRuleType;
  buy_product_id?: string | null;
  buy_product_name?: string | null;
  buy_quantity?: number;
  min_order_amount?: number | null;
  gift_product_id: string;
  gift_product_name?: string | null;
  gift_quantity?: number;
  max_gifts_per_order?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export const giftPromotionApi = {
  getPublic: async (): Promise<GiftPromotion[]> => {
    try {
      const res = await apiClient.get<GiftPromotion[]>("/gift-promotions");
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getAll: async (): Promise<GiftPromotion[]> => {
    const res = await apiClient.get<GiftPromotion[]>("/gift-promotions?all=true");
    return Array.isArray(res.data) ? res.data : [];
  },

  create: async (payload: CreateGiftPromotionPayload): Promise<GiftPromotion> => {
    const res = await apiClient.post<GiftPromotion>("/gift-promotions", payload);
    return res.data;
  },

  toggle: async (id: string): Promise<GiftPromotion> => {
    const res = await apiClient.patch<GiftPromotion>(`/gift-promotions/${id}/toggle`);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/gift-promotions/${id}`);
    return res.data;
  },

  evaluate: async (
    items: Array<{ productId: string; quantity: number }>,
    subtotal: number
  ): Promise<QualifiedGift[]> => {
    try {
      const res = await apiClient.post<QualifiedGift[]>("/gift-promotions/evaluate", {
        items,
        subtotal,
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};
