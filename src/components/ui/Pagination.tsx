import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Tên đơn vị đếm, ví dụ "combo", "ca", "voucher". */
  unit?: string;
  className?: string;
}

/** Thanh phân trang dùng chung cho các danh sách trong trang quản trị và trang khách. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  unit = "mục",
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  if (total === 0) return null;

  const from = (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  const pages: Array<number | "..."> = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }

  const btn =
    "min-w-8 h-8 px-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}>
      <div className="text-muted">
        Hiển thị <strong className="text-foreground">{from}–{to}</strong> / {total} {unit}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            aria-label="Số dòng mỗi trang"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-xs font-semibold"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s} / trang
              </option>
            ))}
          </select>
        )}
        <nav className="flex items-center gap-1" aria-label="Phân trang">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            className={`${btn} bg-surface border-border text-muted hover:bg-surface-soft`}
          >
            <ChevronLeft className="w-3.5 h-3.5 mx-auto" />
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-1 text-muted">
                …
              </span>
            ) : (
              <button
                type="button"
                key={p}
                aria-current={p === current ? "page" : undefined}
                onClick={() => onPageChange(p)}
                className={`${btn} ${
                  p === current
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-border text-foreground hover:bg-surface-soft"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            aria-label="Trang sau"
            disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
            className={`${btn} bg-surface border-border text-muted hover:bg-surface-soft`}
          >
            <ChevronRight className="w-3.5 h-3.5 mx-auto" />
          </button>
        </nav>
      </div>
    </div>
  );
}

/** Cắt một trang dữ liệu từ danh sách đầy đủ. */
export function paginate<T>(list: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return list.slice((current - 1) * pageSize, current * pageSize);
}
