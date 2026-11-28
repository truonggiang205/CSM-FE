import { inventoryApi } from "../api/inventoryApi";

const cache = new Map<string, { at: number; value: Promise<StockSummary> }>();
const TTL_MS = 30_000;

export interface StockSummary {
  /** Tổng số lượng còn bán được (đã trừ hàng đang giữ) trên tất cả chi nhánh. */
  totalAvailable: number;
  /** Số còn bán được theo từng chi nhánh. */
  byBranch: Record<string, number>;
}

/** Lấy tồn kho khả dụng của một sản phẩm (có cache 30 giây để không gọi API liên tục). */
export function getStockSummary(productId: string): Promise<StockSummary> {
  const hit = cache.get(productId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = inventoryApi
    .getStockByProduct(productId)
    .then((rows) => {
      const byBranch: Record<string, number> = {};
      let totalAvailable = 0;
      for (const r of rows || []) {
        const available = Math.max(0, Number(r.available ?? Number(r.quantity) - Number(r.reserved_quantity)) || 0);
        byBranch[r.branch_id] = available;
        totalAvailable += available;
      }
      return { totalAvailable, byBranch };
    })
    .catch(() => {
      cache.delete(productId);
      return { totalAvailable: Number.POSITIVE_INFINITY, byBranch: {} };
    });
  cache.set(productId, { at: Date.now(), value });
  return value;
}

/** Lấy tồn kho cho nhiều sản phẩm cùng lúc. */
export async function getStockSummaries(productIds: string[]): Promise<Record<string, StockSummary>> {
  const unique = Array.from(new Set(productIds.filter(Boolean)));
  const entries = await Promise.all(unique.map(async (id) => [id, await getStockSummary(id)] as const));
  return Object.fromEntries(entries);
}

export function invalidateStockCache(productId?: string) {
  if (productId) cache.delete(productId);
  else cache.clear();
}
