import * as React from "react";
import { Minus, Plus } from "lucide-react";

export interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}

/**
 * Bộ chọn số lượng: bấm +/- hoặc gõ trực tiếp số lượng mong muốn.
 * Giá trị luôn được kẹp trong khoảng 1..max (max = tồn kho còn bán được cho dòng này).
 */
export function QuantityStepper({ value, max, onChange, label, size = "md" }: QuantityStepperProps) {
  const [draft, setDraft] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);
  const safeMax = Math.max(1, max);

  React.useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const n = Number(raw.replace(/\D/g, ""));
    if (!n || n < 1) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(safeMax, n);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const btn =
    size === "sm"
      ? "p-2 sm:p-1 min-h-[36px] min-w-[36px]"
      : "p-2 sm:p-1.5 min-h-[36px] min-w-[36px]";

  return (
    <div className="flex items-center bg-surface border border-border rounded-xl p-0.5 shadow-xs">
      <button
        type="button"
        className={`${btn} flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30 transition-all cursor-pointer`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Giảm số lượng ${label}`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Số lượng ${label}`}
        value={draft}
        onFocus={() => setFocused(true)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={(e) => {
          setFocused(false);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-9 text-center text-xs font-bold text-foreground font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/40 rounded"
      />
      <button
        type="button"
        className={`${btn} flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30 transition-all cursor-pointer`}
        onClick={() => onChange(Math.min(safeMax, value + 1))}
        disabled={value >= safeMax}
        aria-label={`Tăng số lượng ${label}`}
        title={value >= safeMax ? "Đã đạt số lượng tối đa còn trong kho chi nhánh" : undefined}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
