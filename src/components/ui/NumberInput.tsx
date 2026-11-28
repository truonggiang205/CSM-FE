import * as React from "react";

import { cn } from "../../lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max"> {
  /** Giá trị số hiện tại. `null` nghĩa là ô đang để trống. */
  value: number | null | undefined;
  /** Gọi với số đã chuẩn hoá, hoặc `null` khi người dùng xoá trống ô. */
  onValueChange: (value: number | null) => void;
  /** Hiển thị dấu chấm phân tách hàng nghìn (15.000) — dùng cho ô tiền. */
  thousandSeparator?: boolean;
  /** Số chữ số tối đa được gõ (chặn nhập số quá dài làm vỡ giao diện / tràn số). */
  maxDigits?: number;
  /** Hậu tố hiển thị bên trong ô, ví dụ "đ" hoặc "%". */
  suffix?: React.ReactNode;
  /** Tô đỏ viền khi trường đang lỗi. */
  invalid?: boolean;
  wrapperClassName?: string;
}

const formatDisplay = (value: number | null | undefined, thousandSeparator: boolean) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return thousandSeparator ? new Intl.NumberFormat("vi-VN").format(value) : String(value);
};

/**
 * Ô nhập số nguyên không âm.
 *
 * Khác với `<input type="number">`, ô này:
 * - Cho phép xoá trống mà không tự điền lại "0" (lỗi hiện "00" khi xoá rồi gõ lại).
 * - Tự bỏ các số 0 thừa ở đầu ("0050" → "50").
 * - Bỏ qua mọi ký tự không phải chữ số, nên gõ/spam chữ không làm ô bị "đơ".
 * - Giới hạn số chữ số để không nhập được số quá dài.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      thousandSeparator = false,
      maxDigits = 12,
      suffix,
      invalid,
      className,
      wrapperClassName,
      onBlur,
      onFocus,
      ...props
    },
    ref
  ) => {
    const [draft, setDraft] = React.useState(() => formatDisplay(value, thousandSeparator));
    const [focused, setFocused] = React.useState(false);

    // Đồng bộ khi giá trị bị đổi từ bên ngoài (mở form sửa, reset form...) lúc ô không được focus.
    React.useEffect(() => {
      if (!focused) setDraft(formatDisplay(value, thousandSeparator));
    }, [value, thousandSeparator, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits);
      if (digits === "") {
        setDraft("");
        onValueChange(null);
        return;
      }
      const num = Number(digits);
      setDraft(formatDisplay(num, thousandSeparator));
      onValueChange(num);
    };

    return (
      <div className={cn("relative", wrapperClassName)}>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          onChange={handleChange}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setDraft(formatDisplay(value, thousandSeparator));
            onBlur?.(e);
          }}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-10 w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted/70 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-surface-soft read-only:text-muted read-only:cursor-default",
            suffix ? "pr-9" : "",
            invalid ? "border-danger ring-1 ring-danger/30 focus-visible:border-danger focus-visible:ring-danger/30" : "",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";
