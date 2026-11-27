import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { flashSaleApi } from "../api/flashSaleApi";
import { useCartStore } from "../store/useCartStore";

/**
 * Giữ giá trong giỏ hàng khớp với Flash Sale đang chạy.
 * Khi chiến dịch hết giờ / hết suất / bị tắt, món trong giỏ tự về giá gốc (đúng với giá server tính khi đặt hàng).
 * Chỉ đồng bộ khi đã lấy dữ liệu thành công, để mất mạng tạm thời không làm đổi giá.
 */
export function useCartFlashSaleSync() {
  const syncFlashSalePrices = useCartStore((s) => s.syncFlashSalePrices);
  const hasItems = useCartStore((s) => s.items.length > 0);

  const { data, isSuccess, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["active-flash-sale"],
    queryFn: flashSaleApi.getActiveOrUpcoming,
    refetchInterval: 30_000,
    enabled: hasItems,
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    const prices: Record<string, number> = {};
    if (data.status === "ACTIVE") {
      for (const item of data.campaign?.items || data.items || []) {
        const sold = Number(item.sold_count) || 0;
        const limit = Number(item.quantity_limit) || 0;
        const isSoldOut = limit > 0 && sold >= limit;
        const sale = Number(item.sale_price);
        if (!isSoldOut && sale > 0) prices[String(item.product_id)] = sale;
      }
    }
    syncFlashSalePrices(prices);
  }, [data, isSuccess, dataUpdatedAt, syncFlashSalePrices]);

  // Hẹn giờ lấy lại dữ liệu đúng lúc chiến dịch kết thúc thay vì chờ chu kỳ 30 giây
  const endAt = data?.status === "ACTIVE" ? data.endDateTime : undefined;
  useEffect(() => {
    if (!endAt) return;
    const ms = new Date(endAt).getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0 || ms > 24 * 3600_000) return;
    const t = setTimeout(() => refetch(), ms + 1000);
    return () => clearTimeout(t);
  }, [endAt, refetch]);
}
