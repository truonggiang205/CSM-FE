export type Role = 'CUSTOMER' | 'STORE_MANAGER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  assignedBranchId?: number;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockInSelectedBranch?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  orderCode: string;
  branchId: number;
  branchName: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}
