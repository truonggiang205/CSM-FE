import { BranchInventoryItem, ProductStockByBranch } from "../types/inventory";
import { mockBranches } from "./branches";
import { mockProducts } from "./products";

// Initial mock stock state that can be mutated in-memory during dev mode
let mockInventoryStorage: BranchInventoryItem[] = [
  // Branch 1 (br-01 - Quận 1)
  { id: "st-1", product_id: "p1", branch_id: "br-01", quantity: 150, reserved_quantity: 5, available: 145, product_name: "Nước khoáng Lavie 500ml", sku: "DRK-LV-500", price: 5000 },
  { id: "st-2", product_id: "p2", branch_id: "br-01", quantity: 20, reserved_quantity: 2, available: 18, product_name: "Bánh mì kẹp thịt nguội", sku: "FOD-BM-01", price: 25000 },
  { id: "st-3", product_id: "p3", branch_id: "br-01", quantity: 4, reserved_quantity: 0, available: 4, product_name: "Snack khoai tây O'Star", sku: "SNK-PT-02", price: 12000 },
  { id: "st-4", product_id: "p4", branch_id: "br-01", quantity: 0, reserved_quantity: 0, available: 0, product_name: "Mì ly Modern chua cay", sku: "FOD-MI-MD", price: 9000 },
  { id: "st-5", product_id: "p5", branch_id: "br-01", quantity: 50, reserved_quantity: 3, available: 47, product_name: "Cà phê sữa đá pha sẵn", sku: "DRK-CF-01", price: 18000 },
  { id: "st-6", product_id: "p6", branch_id: "br-01", quantity: 80, reserved_quantity: 0, available: 80, product_name: "Kem đánh răng P/S", sku: "DLY-PS-01", price: 35000 },

  // Branch 2 (br-02 - Thảo Điền)
  { id: "st-7", product_id: "p1", branch_id: "br-02", quantity: 80, reserved_quantity: 0, available: 80, product_name: "Nước khoáng Lavie 500ml", sku: "DRK-LV-500", price: 5000 },
  { id: "st-8", product_id: "p2", branch_id: "br-02", quantity: 0, reserved_quantity: 0, available: 0, product_name: "Bánh mì kẹp thịt nguội", sku: "FOD-BM-01", price: 25000 },
  { id: "st-9", product_id: "p3", branch_id: "br-02", quantity: 50, reserved_quantity: 5, available: 45, product_name: "Snack khoai tây O'Star", sku: "SNK-PT-02", price: 12000 },
  { id: "st-10", product_id: "p4", branch_id: "br-02", quantity: 30, reserved_quantity: 2, available: 28, product_name: "Mì ly Modern chua cay", sku: "FOD-MI-MD", price: 9000 },
  { id: "st-11", product_id: "p5", branch_id: "br-02", quantity: 15, reserved_quantity: 0, available: 15, product_name: "Cà phê sữa đá pha sẵn", sku: "DRK-CF-01", price: 18000 },
  { id: "st-12", product_id: "p6", branch_id: "br-02", quantity: 2, reserved_quantity: 0, available: 2, product_name: "Kem đánh răng P/S", sku: "DLY-PS-01", price: 35000 },

  // Branch 3 (br-03 - Thanh Đa)
  { id: "st-13", product_id: "p1", branch_id: "br-03", quantity: 200, reserved_quantity: 10, available: 190, product_name: "Nước khoáng Lavie 500ml", sku: "DRK-LV-500", price: 5000 },
  { id: "st-14", product_id: "p2", branch_id: "br-03", quantity: 12, reserved_quantity: 0, available: 12, product_name: "Bánh mì kẹp thịt nguội", sku: "FOD-BM-01", price: 25000 },
  { id: "st-15", product_id: "p3", branch_id: "br-03", quantity: 0, reserved_quantity: 0, available: 0, product_name: "Snack khoai tây O'Star", sku: "SNK-PT-02", price: 12000 },
  { id: "st-16", product_id: "p4", branch_id: "br-03", quantity: 100, reserved_quantity: 0, available: 100, product_name: "Mì ly Modern chua cay", sku: "FOD-MI-MD", price: 9000 },
  { id: "st-17", product_id: "p5", branch_id: "br-03", quantity: 3, reserved_quantity: 0, available: 3, product_name: "Cà phê sữa đá pha sẵn", sku: "DRK-CF-01", price: 18000 },
  { id: "st-18", product_id: "p6", branch_id: "br-03", quantity: 45, reserved_quantity: 1, available: 44, product_name: "Kem đánh răng P/S", sku: "DLY-PS-01", price: 35000 },

  // Branch 4 (br-04 - Phú Mỹ Hưng)
  { id: "st-19", product_id: "p1", branch_id: "br-04", quantity: 60, reserved_quantity: 0, available: 60, product_name: "Nước khoáng Lavie 500ml", sku: "DRK-LV-500", price: 5000 },
  { id: "st-20", product_id: "p2", branch_id: "br-04", quantity: 35, reserved_quantity: 5, available: 30, product_name: "Bánh mì kẹp thịt nguội", sku: "FOD-BM-01", price: 25000 },
  { id: "st-21", product_id: "p3", branch_id: "br-04", quantity: 18, reserved_quantity: 0, available: 18, product_name: "Snack khoai tây O'Star", sku: "SNK-PT-02", price: 12000 },
  { id: "st-22", product_id: "p4", branch_id: "br-04", quantity: 4, reserved_quantity: 0, available: 4, product_name: "Mì ly Modern chua cay", sku: "FOD-MI-MD", price: 9000 },
  { id: "st-23", product_id: "p5", branch_id: "br-04", quantity: 25, reserved_quantity: 2, available: 23, product_name: "Cà phê sữa đá pha sẵn", sku: "DRK-CF-01", price: 18000 },
  { id: "st-24", product_id: "p6", branch_id: "br-04", quantity: 90, reserved_quantity: 0, available: 90, product_name: "Kem đánh răng P/S", sku: "DLY-PS-01", price: 35000 },
];

export function getMockInventoryByBranch(branchId: string): BranchInventoryItem[] {
  const items = mockInventoryStorage.filter((item) => item.branch_id === branchId);
  if (items.length > 0) return items;

  // Fallback nếu branch chưa có sẵn thì sinh mặc định từ mockProducts
  return mockProducts.map((p, idx) => ({
    id: `st-gen-${branchId}-${p.id}`,
    product_id: p.id,
    branch_id: branchId,
    quantity: (idx + 1) * 10,
    reserved_quantity: 0,
    available: (idx + 1) * 10,
    product_name: p.name,
    sku: `SKU-${p.id}`,
    price: p.price,
  }));
}

export function getMockStockByProduct(productId: string): ProductStockByBranch[] {
  return mockBranches.map((branch) => {
    const existing = mockInventoryStorage.find(
      (item) => item.product_id === productId && item.branch_id === branch.id
    );
    const quantity = existing ? existing.quantity : 15;
    const reserved_quantity = existing ? existing.reserved_quantity : 0;
    return {
      branch_id: branch.id,
      branch_name: branch.name,
      branch_address: branch.address,
      quantity,
      reserved_quantity,
      available: Math.max(0, quantity - reserved_quantity),
    };
  });
}

export function addMockStock(branchId: string, productId: string, quantity: number): BranchInventoryItem {
  let item = mockInventoryStorage.find(
    (s) => s.branch_id === branchId && s.product_id === productId
  );

  if (item) {
    item.quantity += quantity;
    item.available = Math.max(0, item.quantity - item.reserved_quantity);
  } else {
    const prod = mockProducts.find((p) => p.id === productId);
    item = {
      id: `st-new-${Date.now()}`,
      product_id: productId,
      branch_id: branchId,
      quantity,
      reserved_quantity: 0,
      available: quantity,
      product_name: prod ? prod.name : `Sản phẩm #${productId}`,
      sku: prod ? `SKU-${prod.id}` : `SKU-${productId.slice(0, 6)}`,
      price: prod ? prod.price : 10000,
    };
    mockInventoryStorage.push(item);
  }

  return item;
}
