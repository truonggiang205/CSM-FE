import apiClient from "./apiClient";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "SHIPPED" | "CANCELLED";
export type PaymentMethod = "COD" | "MOMO" | "ZALOPAY" | "ATM";

export interface OrderItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  branch_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  branchId: string;
  items: CreateOrderItemPayload[];
  shippingAddress?: string;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  totalAmount: number;
  status: OrderStatus;
  paymentUrl?: string;
}

export interface QueryMyOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface QueryAllOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | "ALL";
  branchId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  method: PaymentMethod;
  bankCode?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  message?: string;
}

export function mapBackendOrderItemToFrontend(raw: any): OrderItem {
  return {
    id: raw.id,
    product_id: raw.product_id || raw.productId,
    product_name_snapshot: raw.product_name_snapshot || raw.productName || "Sản phẩm",
    price_snapshot: Number(raw.price_snapshot || raw.price) || 0,
    quantity: Number(raw.quantity) || 1,
  };
}

export function mapBackendOrderToFrontend(raw: any): Order {
  return {
    id: raw.id,
    user_id: raw.user_id || raw.userId,
    branch_id: raw.branch_id || raw.branchId,
    total_amount: Number(raw.total_amount || raw.totalAmount) || 0,
    payment_method: (raw.payment_method || raw.paymentMethod || "COD") as PaymentMethod,
    status: raw.status as OrderStatus,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    items: Array.isArray(raw.items) ? raw.items.map(mapBackendOrderItemToFrontend) : [],
  };
}

export function mapBackendOrdersPageToFrontend(raw: any): Paginated<Order> {
  const items = Array.isArray(raw.items) ? raw.items.map(mapBackendOrderToFrontend) : [];
  return {
    items,
    total: Number(raw.total) || items.length,
    page: Number(raw.page) || 1,
    limit: Number(raw.limit) || 10,
    totalPages: Number(raw.totalPages) || 1,
  };
}

export const orderApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await apiClient.post<CreateOrderResponse>("/orders", payload);
    return res.data;
  },

  getMyOrders: async (params?: QueryMyOrdersParams): Promise<Paginated<Order>> => {
    const res = await apiClient.get<any>("/orders/my", { params });
    return mapBackendOrdersPageToFrontend(res.data);
  },

  getOrderById: async (id: string): Promise<Order> => {
    const res = await apiClient.get<any>(`/orders/${id}`);
    return mapBackendOrderToFrontend(res.data);
  },

  getAllOrders: async (params?: QueryAllOrdersParams): Promise<Paginated<Order>> => {
    const res = await apiClient.get<any>("/orders", { params });
    return mapBackendOrdersPageToFrontend(res.data);
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await apiClient.patch<any>(`/orders/${id}/status`, { status });
    return mapBackendOrderToFrontend(res.data);
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<CreatePaymentResponse> => {
    const res = await apiClient.post<CreatePaymentResponse>("/payments/create", payload);
    return res.data;
  },
};

export default orderApi;
