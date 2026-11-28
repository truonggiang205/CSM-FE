const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Định dạng thời gian thống nhất trong trang quản trị: `hh:mm - dd/mm/yyyy`.
 * Nhận Date, timestamp (ms) hoặc chuỗi ISO. Trả về "—" khi không hợp lệ.
 */
export function formatDateTimeVN(input: Date | number | string | null | undefined): string {
  if (input === null || input === undefined || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Định dạng ngày `dd/mm/yyyy` (không có giờ). */
export function formatDateVN(input: Date | number | string | null | undefined): string {
  if (input === null || input === undefined || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Ghép ngày `yyyy-mm-dd` + giờ `hh:mm[:ss]` theo giờ địa phương thành timestamp (ms). */
export function toLocalMs(dateStr: string, timeStr: string): number {
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${t}`).getTime();
}

/** Giá trị cho `<input type="datetime-local">` từ Date / chuỗi ISO. */
export function toDateTimeLocalValue(input: Date | string | null | undefined): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
