import { AlertCircle } from "lucide-react";

/** Dòng thông báo lỗi hiển thị ngay dưới ô nhập liệu. */
export function FieldError({ message, id }: { message?: string | null; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-danger-dark mt-1">
      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** Class tô đỏ viền cho ô nhập liệu đang lỗi. */
export const invalidClass = (hasError: unknown) =>
  hasError ? "border-danger ring-1 ring-danger/30 focus-visible:border-danger focus-visible:ring-danger/30" : "";

/**
 * Thông báo lỗi tổng (alert) ở đầu form. Liệt kê lỗi theo đúng thứ tự xuất hiện trên giao diện
 * và cuộn tới ô lỗi đầu tiên khi bấm vào.
 */
export function FormErrorSummary({
  errors,
  order,
  labels,
  title = "Vui lòng kiểm tra lại thông tin",
}: {
  errors: Record<string, string | undefined | null>;
  order?: string[];
  labels?: Record<string, string>;
  title?: string;
}) {
  const keys = (order || Object.keys(errors)).filter((k) => errors[k]);
  const extra = Object.keys(errors).filter((k) => errors[k] && !keys.includes(k));
  const all = [...keys, ...extra];
  if (all.length === 0) return null;
  return (
    <div role="alert" className="p-3.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs">
      <div className="flex items-center gap-2 font-bold">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{title}</span>
      </div>
      <ul className="mt-1.5 ml-6 list-disc space-y-0.5 font-medium">
        {all.map((k) => (
          <li key={k}>
            <button
              type="button"
              className="text-left hover:underline"
              onClick={() => {
                const el = document.querySelector<HTMLElement>(`[data-field="${k}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                el?.querySelector<HTMLElement>("input,select,textarea")?.focus();
              }}
            >
              {labels?.[k] ? <strong>{labels[k]}: </strong> : null}
              {errors[k]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
