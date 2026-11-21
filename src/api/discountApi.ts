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
  max_usage_per_user?: number;
  is_freeship?: boolean;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
}

export interface ValidateVoucherResponse {
  valid: boolean;
  isValid?: boolean;
  code: string;
  isFreeship?: boolean;
  discountAmount: number;
  finalAmount: number;
  voucher: {
    id: string;
    code: string;
    description: string;
    discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
    discount_value: number;
    is_freeship?: boolean;
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
  max_usage_per_user?: number;
  is_freeship?: boolean;
  start_date: string;
  end_date: string;
}

export const discountApi = {
  // Kiểm tra mã voucher khi khách hàng đặt hàng (hỗ trợ kiểm tra theo user và phí vận chuyển)
  validateVoucher: async (
    code: string,
    orderValue: number,
    userId?: string,
    shippingFee?: number,
  ): Promise<ValidateVoucherResponse> => {
    const res = await apiClient.post<ValidateVoucherResponse>("/vouchers/validate", {
      code,
      orderValue,
      userId,
      shippingFee,
    });
    return res.data;
  },

  // Lấy các voucher khả dụng cho khách hàng (hỗ trợ lọc theo userId)
  getAvailableVouchers: async (userId?: string): Promise<VoucherItem[]> => {
    const params: any = {};
    if (userId) params.userId = userId;
    const res = await apiClient.get<VoucherItem[]>("/vouchers", { params });
    return res.data;
  },

  // Dành cho Admin: Lấy toàn bộ voucher (kể cả đã hết hạn / tạm dừng)
  getAllVouchers: async (): Promise<VoucherItem[]> => {
    const res = await apiClient.get<VoucherItem[]>("/vouchers?all=true");
    return res.data;
  },

  // Dành cho Admin: Lấy lịch sử sử dụng của 1 voucher
  getVoucherUsages: async (voucherId: string) => {
    const res = await apiClient.get(`/vouchers/${voucherId}/usages`);
    return res.data;
  },

  // Hoàn lại lượt sử dụng voucher (khi huỷ đơn hoặc rollback)
  releaseVoucher: async (code: string, userId?: string, orderId?: string) => {
    const res = await apiClient.post("/vouchers/release", { code, userId, orderId });
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
