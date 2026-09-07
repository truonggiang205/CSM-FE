export interface InventoryItem {
  productId: string;
  branchId: string;
  stock: number;
}

export const mockInventory: InventoryItem[] = [
  { productId: 'p1', branchId: 'b1', stock: 50 },
  { productId: 'p1', branchId: 'b2', stock: 10 },
  { productId: 'p2', branchId: 'b1', stock: 0 },
  { productId: 'p2', branchId: 'b2', stock: 100 },
  { productId: 'p3', branchId: 'b1', stock: 5 },
  { productId: 'p4', branchId: 'b1', stock: 20 },
];

export const mockBranches = [
  { id: 'b1', name: 'CSM Quận 1 - Lê Duẩn' },
  { id: 'b2', name: 'CSM Quận 7 - Nguyễn Văn Linh' },
];
