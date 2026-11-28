import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { flashSaleApi, FlashSaleQuotaItem } from "../api/flashSaleApi";
import { inventoryApi } from "../api/inventoryApi";
import { useBranchStore } from "../store/useBranchStore";
import { useAuthStore } from "../store/useAuthStore";
import { CartItem, useCartStore } from "../store/useCartStore";

export interface CartLineLimit {
  /** Số lượng tối đa của dòng này (tồn kho chi nhánh sau khi trừ các dòng khác dùng chung sản phẩm). */
  maxQty: number;
  /** Số lượng được tính giá Giờ Vàng (phần còn lại tính giá gốc). */
  saleQty: number;
  regularQty: number;
  unitSalePrice?: number;
  unitBasePrice: number;
  lineTotal: number;
  /** Đã vượt tồn kho (ví dụ tồn kho giảm sau khi thêm vào giỏ). */
  overStock: boolean;
  /** Sản phẩm hết hàng tại chi nhánh đang chọn. */
  outOfStock: boolean;
  /** Ghi chú hiển thị dưới dòng (ví dụ "2 suất giá Giờ Vàng, 1 món giá gốc"). */
  note?: string;
}

/** Số đơn vị của từng sản phẩm mà một dòng giỏ hàng chiếm trong kho (combo = tổng các món thành phần). */
export function getStockUsage(item: CartItem): Record<string, number> {
  if (item.itemType === "COMBO") {
    const usage: Record<string, number> = {};
    for (const ci of item.comboItems || []) {
      usage[ci.productId] = (usage[ci.productId] || 0) + (Number(ci.quantity) || 1);
    }
    return usage;
  }
  return { [item.product.id]: 1 };
}

/**
 * Tính giới hạn số lượng + giá thực tế cho từng dòng giỏ hàng.
 *
 * - Tồn kho chi nhánh được chia sẻ giữa các dòng: sản phẩm lẻ và các combo chứa cùng sản phẩm
 *   không thể cộng dồn vượt quá số hàng thực có.
 * - Giờ Vàng: chỉ `userRemaining` món đầu được giá sale, phần vượt tính giá gốc — khớp cách server tính.
 */
export function computeCartLimits(
  items: CartItem[],
  stockMap: Map<string, number> | null,
  quotaMap: Map<string, FlashSaleQuotaItem>,
): Record<string, CartLineLimit> {
  const demand = new Map<string, number>();
  for (const item of items) {
    for (const [pid, per] of Object.entries(getStockUsage(item))) {
      demand.set(pid, (demand.get(pid) || 0) + per * item.quantity);
    }
  }

  const result: Record<string, CartLineLimit> = {};
  for (const item of items) {
    const usage = getStockUsage(item);
    let maxQty = Number.POSITIVE_INFINITY;
    let outOfStock = false;
    if (stockMap) {
      for (const [pid, per] of Object.entries(usage)) {
        const available = Math.max(0, stockMap.get(pid) ?? 0);
        const usedByOthers = (demand.get(pid) || 0) - per * item.quantity;
        const canTake = Math.floor(Math.max(0, available - usedByOthers) / per);
        maxQty = Math.min(maxQty, canTake);
        if (available < per) outOfStock = true;
      }
    }
    // Combo còn bị giới hạn bởi số suất ưu đãi còn lại (lưu ở product.stock khi thêm vào giỏ)
    if (item.itemType === "COMBO" && Number.isFinite(item.product.stock) && item.product.stock > 0) {
      maxQty = Math.min(maxQty, item.product.stock);
    }
    if (!Number.isFinite(maxQty)) maxQty = 99;
    maxQty = Math.min(99, maxQty);

    const basePrice = Number(item.product.price) || 0;
    let saleQty = 0;
    let unitSalePrice: number | undefined;
    if (item.itemType === "COMBO") {
      unitSalePrice = Number(item.product.discountPrice) || undefined;
      saleQty = unitSalePrice ? item.quantity : 0;
    } else {
      const quota = quotaMap.get(item.product.id);
      const sale = quota?.salePrice ?? item.product.discountPrice;
      if (sale && sale < basePrice) {
        unitSalePrice = sale;
        saleQty = quota ? Math.min(item.quantity, Math.max(0, quota.userRemaining)) : item.quantity;
      }
    }
    const regularQty = item.quantity - saleQty;
    const lineTotal = saleQty * (unitSalePrice ?? basePrice) + regularQty * basePrice;

    let note: string | undefined;
    if (item.itemType !== "COMBO" && unitSalePrice && regularQty > 0) {
      note =
        saleQty > 0
          ? `${saleQty} món giá Giờ Vàng, ${regularQty} món tính giá gốc (đã đạt giới hạn suất sale).`
          : `Bạn đã dùng hết suất Giờ Vàng cho món này, ${regularQty} món tính giá gốc.`;
    }

    result[item.product.id] = {
      maxQty,
      saleQty,
      regularQty,
      unitSalePrice,
      unitBasePrice: basePrice,
      lineTotal,
      overStock: stockMap ? item.quantity > maxQty : false,
      outOfStock,
      note,
    };
  }
  return result;
}

/** Hook dùng chung cho giỏ hàng (drawer + trang giỏ) và trang thanh toán. */
export function useCartLimits() {
  const items = useCartStore((s) => s.items);
  const { selectedBranch } = useBranchStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  const { data: branchInventory } = useQuery({
    queryKey: ["inventory", "branch", selectedBranch?.id],
    queryFn: () => inventoryApi.getInventoryByBranch(selectedBranch!.id),
    enabled: !!selectedBranch?.id && items.length > 0,
    staleTime: 15_000,
  });

  const hasProducts = items.some((i) => i.itemType !== "COMBO");
  const { data: quota } = useQuery({
    queryKey: ["flash-sale-quota", isAuthenticated ? userId : "guest"],
    queryFn: flashSaleApi.getQuota,
    enabled: hasProducts,
    refetchInterval: 30_000,
  });

  const stockMap = useMemo(() => {
    if (!branchInventory) return null;
    const map = new Map<string, number>();
    branchInventory.forEach((row) => {
      map.set(row.product_id, row.available ?? row.quantity - row.reserved_quantity);
    });
    return map;
  }, [branchInventory]);

  const quotaMap = useMemo(() => {
    const map = new Map<string, FlashSaleQuotaItem>();
    if (quota?.status === "ACTIVE") quota.items.forEach((q) => map.set(String(q.productId), q));
    return map;
  }, [quota]);

  const limits = useMemo(() => computeCartLimits(items, stockMap, quotaMap), [items, stockMap, quotaMap]);
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + (limits[i.product.id]?.lineTotal ?? 0), 0),
    [items, limits],
  );
  const hasStockProblem = items.some((i) => limits[i.product.id]?.overStock);

  return { limits, totalPrice, stockMap, hasStockProblem };
}
