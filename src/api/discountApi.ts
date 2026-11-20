import apiClient from "./apiClient";

export interface VoucherItem {
  id: string;
  code: string;
  description?: string;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number | null;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
}

export interface ValidateVoucherResponse {
  valid: boolean;
  code: string;
  discountAmount: number;
  finalAmount: number;
  voucher: {
    id: string;
    code: string;
    description: string;
    discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
    discount_value: number;
  };
}

export interface CreateVoucherPayload {
  code: string;
  description?: string;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  start_date: string;
  end_date: string;
}

export const discountApi = {
  // Kiểm tra mã voucher khi khách hàng đặt hàng
  validateVoucher: async (code: string, orderValue: number): Promise<ValidateVoucherResponse> => {
    const res = await apiClient.post<ValidateVoucherResponse>("/vouchers/validate", { code, orderValue });
    return res.data;
  },

  // Lấy các voucher khả dụng cho khách hàng
  getAvailableVouchers: async (): Promise<VoucherItem[]> => {
    const res = await apiClient.get<VoucherItem[]>("/vouchers");
    return res.data;
  },

  // Dành cho Admin: Lấy toàn bộ voucher (kể cả đã hết hạn / tạm dừng)
  getAllVouchers: async (): Promise<VoucherItem[]> => {
    const res = await apiClient.get<VoucherItem[]>("/vouchers?all=true");
    return res.data;
  },

  // Dành cho Admin: Tạo voucher mới
  createVoucher: async (payload: CreateVoucherPayload): Promise<VoucherItem> => {
    const res = await apiClient.post<VoucherItem>("/vouchers", payload);
    return res.data;
  },

  // Dành cho Admin: Bật / Tắt trạng thái hoạt động của voucher
  toggleVoucher: async (id: string): Promise<VoucherItem> => {
    const res = await apiClient.patch<VoucherItem>(`/vouchers/${id}/toggle`);
    return res.data;
  },
};
