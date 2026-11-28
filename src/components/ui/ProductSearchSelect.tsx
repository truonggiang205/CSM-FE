import * as React from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

import { cn } from "../../lib/utils";

export interface ProductOption {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  /** Số lượng còn bán được (nếu đã biết) — dùng để cảnh báo / vô hiệu hoá. */
  available?: number;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ProductSearchSelectProps {
  options: ProductOption[];
  value: string;
  onChange: (option: ProductOption | null) => void;
  placeholder?: string;
  /** Các id đã được chọn ở dòng khác — vẫn hiển thị nhưng không chọn lại được. */
  excludeIds?: string[];
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  /** Hiện giá bán bên phải mỗi lựa chọn. */
  showPrice?: boolean;
  /** Số lựa chọn tối đa hiển thị cùng lúc trong danh sách gợi ý. */
  limit?: number;
  /** Chữ hiển thị khi chưa chọn gì. */
  emptyLabel?: string;
  /** Chữ hiển thị khi không có kết quả tìm kiếm. */
  notFoundLabel?: string;
  /** Cho phép bấm X để bỏ chọn (mặc định có). */
  clearable?: boolean;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

/**
 * Ô chọn sản phẩm có tìm kiếm: gõ tên hoặc mã SKU để lọc (không phân biệt dấu),
 * danh sách gợi ý có giới hạn chiều cao và thanh cuộn.
 */
export function ProductSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Gõ tên hoặc mã sản phẩm để tìm...",
  excludeIds = [],
  invalid,
  disabled,
  className,
  showPrice = false,
  limit = 50,
  emptyLabel = "-- Chọn sản phẩm --",
  notFoundLabel = "Không tìm thấy sản phẩm phù hợp",
  clearable = true,
}: ProductSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value) || null;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? options.filter((o) => normalize(o.name).includes(q) || normalize(o.sku || "").includes(q))
      : options;
    return list.slice(0, limit);
  }, [options, query, limit]);

  const isBlocked = (o: ProductOption) => o.disabled || (excludeIds.includes(o.id) && o.id !== value);

  const pick = (o: ProductOption) => {
    if (isBlocked(o)) return;
    onChange(o);
    setOpen(false);
    setQuery("");
  };

  const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full h-9 rounded-xl border bg-surface px-2.5 text-xs font-medium flex items-center justify-between gap-2 text-left disabled:opacity-50",
          invalid ? "border-danger ring-1 ring-danger/30" : "border-border",
        )}
      >
        <span className={cn("truncate", selected ? "text-foreground" : "text-muted")} title={selected?.name}>
          {selected ? selected.name : emptyLabel}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && !disabled && clearable && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Bỏ chọn"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-0.5 rounded hover:bg-surface-soft text-muted"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted" />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full min-w-[240px] rounded-xl border border-border bg-surface shadow-modal overflow-hidden">
          <div className="relative border-b border-border">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(filtered.length - 1, h + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(0, h - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[highlight]) pick(filtered[highlight]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full h-9 pl-8 pr-2 text-xs bg-transparent focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-muted text-center">{notFoundLabel}</li>
            ) : (
              filtered.map((o, i) => {
                const blocked = isBlocked(o);
                const reason = o.disabled
                  ? o.disabledReason
                  : excludeIds.includes(o.id) && o.id !== value
                    ? "Đã chọn ở dòng khác"
                    : undefined;
                return (
                  <li
                    key={o.id}
                    role="option"
                    aria-selected={o.id === value}
                    aria-disabled={blocked || undefined}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(o);
                    }}
                    className={cn(
                      "px-3 py-2 text-xs flex items-center justify-between gap-2",
                      blocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      i === highlight && !blocked ? "bg-primary-tint/60" : "",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground" title={o.name}>
                        {o.name}
                      </span>
                      {(o.sku || reason || o.available !== undefined) && (
                        <span className="block text-[10px] text-muted truncate">
                          {o.sku ? `SKU: ${o.sku}` : ""}
                          {o.available !== undefined && Number.isFinite(o.available)
                            ? `${o.sku ? " · " : ""}Tồn kho: ${o.available}`
                            : ""}
                          {reason ? ` · ${reason}` : ""}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {showPrice && o.price !== undefined && (
                        <span className="text-[11px] font-mono text-muted">{formatVND(o.price)}</span>
                      )}
                      {o.id === value && <Check className="w-3.5 h-3.5 text-primary" />}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
