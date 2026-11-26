export interface BranchInventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  reserved_quantity: number;
  available: number;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
  sku?: string;
  price?: number;
}

export interface ProductStockByBranch {
  branch_id: string;
  branch_name: string;
  branch_address: string;
  quantity: number;
  reserved_quantity: number;
  available: number;
}

export interface AddStockPayload {
  branchId: string;
  productId: string;
  quantity: number;
}

export interface StockStats {
  totalSkus: number;
  totalQuantity: number;
  lowStockSkus: number;
  outOfStockSkus: number;
  totalReserved: number;
}

export interface StockTransactionRecord {
  id: string;
  stock_id: string;
  type: "IN" | "OUT" | "RESERVE" | "CONFIRM_DEDUCT" | "CANCEL_RESERVE";
  quantity: number;
  reference_id?: string;
  created_at: string;
}
