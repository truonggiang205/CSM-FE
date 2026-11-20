import apiClient from "./apiClient";

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

export const discountApi = {
  validateVoucher: async (code: string, orderValue: number): Promise<ValidateVoucherResponse> => {
    const res = await apiClient.post<ValidateVoucherResponse>("/vouchers/validate", { code, orderValue });
    return res.data;
  },
  getAvailableVouchers: async () => {
    const res = await apiClient.get("/vouchers");
    return res.data;
  },
};
