/**
 * Quy tắc trạng thái (status) và công tắc (state) dùng chung cho Giờ Vàng, Voucher và Combo.
 *
 * Status:
 * - Sắp diễn ra : thời gian hiện tại < thời gian bắt đầu
 * - Đang diễn ra: bắt đầu ≤ hiện tại ≤ kết thúc và đang bật
 * - Tạm ngưng   : bắt đầu ≤ hiện tại ≤ kết thúc nhưng admin đã tắt
 * - Hết lượt    : bắt đầu ≤ hiện tại ≤ kết thúc nhưng đã dùng/bán hết số lượt
 * - Đã kết thúc : hiện tại > thời gian kết thúc
 *
 * State (công tắc): chỉ "on" khi status là Đang diễn ra. Công tắc chỉ được bấm khi đang
 * trong khung thời gian hiệu lực và còn lượt.
 */
export type PromoStatus = "ACTIVE" | "UPCOMING" | "PAUSED" | "SOLD_OUT" | "ENDED";

export interface PromoStatusInput {
  isActive: boolean;
  startMs: number | null;
  endMs: number | null;
  /** true khi đã hết lượt dùng / hết suất bán. */
  exhausted?: boolean;
  nowMs?: number;
}

export function getPromoStatus({ isActive, startMs, endMs, exhausted, nowMs = Date.now() }: PromoStatusInput): PromoStatus {
  if (startMs !== null && !Number.isNaN(startMs) && nowMs < startMs) return "UPCOMING";
  if (endMs !== null && !Number.isNaN(endMs) && nowMs > endMs) return "ENDED";
  if (exhausted) return "SOLD_OUT";
  return isActive ? "ACTIVE" : "PAUSED";
}

/** Công tắc chỉ được thao tác khi đang trong khung thời gian hiệu lực và còn lượt. */
export function canTogglePromo(status: PromoStatus): boolean {
  return status === "ACTIVE" || status === "PAUSED";
}

export const PROMO_STATUS_META: Record<PromoStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang diễn ra", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  UPCOMING: { label: "Sắp diễn ra", className: "bg-amber-100 text-amber-800 border-amber-300" },
  PAUSED: { label: "Tạm ngưng", className: "bg-slate-100 text-slate-700 border-slate-300" },
  SOLD_OUT: { label: "Hết lượt dùng", className: "bg-rose-100 text-rose-800 border-rose-300" },
  ENDED: { label: "Đã kết thúc", className: "bg-surface-soft text-muted border-border" },
};
