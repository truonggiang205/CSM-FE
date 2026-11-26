/** Lấy thông báo lỗi tiếng Việt từ phản hồi Backend (NestJS trả message dạng chuỗi hoặc mảng). */
export function getErrorMessage(err: any, fallback = "Đã có lỗi xảy ra, vui lòng thử lại"): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
}

/** ISO -> giá trị cho <input type="datetime-local"> theo giờ máy người dùng. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Giá trị <input type="datetime-local"> -> ISO, rỗng -> null. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type LiveStatus = "LIVE" | "OFF" | "SCHEDULED" | "EXPIRED";

export function getLiveStatus(item: { is_active: boolean; start_at?: string | null; end_at?: string | null }): LiveStatus {
  if (!item.is_active) return "OFF";
  const now = Date.now();
  if (item.start_at && new Date(item.start_at).getTime() > now) return "SCHEDULED";
  if (item.end_at && new Date(item.end_at).getTime() < now) return "EXPIRED";
  return "LIVE";
}

export const LIVE_STATUS_STYLE: Record<LiveStatus, { label: string; className: string }> = {
  LIVE: { label: "Đang hiển thị", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25" },
  OFF: { label: "Đang tắt", className: "bg-surface-soft text-muted border-border" },
  SCHEDULED: { label: "Chờ đến ngày", className: "bg-amber-500/10 text-amber-700 border-amber-500/25" },
  EXPIRED: { label: "Đã hết hạn", className: "bg-danger-pastel text-danger-dark border-danger/20" },
};

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
