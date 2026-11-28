import * as React from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";

import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" cho thao tác xoá / không hoàn tác được. */
  tone?: "danger" | "warning" | "default";
  /**
   * Bắt người dùng gõ đúng chuỗi này trước khi xác nhận (xác nhận lần 2 cho thao tác xoá).
   */
  requireText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Hộp thoại xác nhận dùng chung cho các thao tác tạo / bật / tắt / xoá trong trang quản trị. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  tone = "default",
  requireText,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const Icon = tone === "danger" ? Trash2 : tone === "warning" ? AlertTriangle : Info;
  const iconBox =
    tone === "danger"
      ? "bg-danger-pastel border-danger/30 text-danger-dark"
      : tone === "warning"
        ? "bg-amber-100 border-amber-300 text-amber-800"
        : "bg-primary-tint border-primary/25 text-primary-dark";
  const blocked = Boolean(requireText) && typed.trim() !== requireText;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 shadow-modal space-y-4">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${iconBox}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {description && <div className="text-xs text-muted mt-1 leading-relaxed">{description}</div>}
        </div>
        {requireText && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Gõ <strong className="font-mono text-danger-dark">{requireText}</strong> để xác nhận
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="rounded-xl text-xs font-semibold">
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            size="sm"
            disabled={blocked || loading}
            onClick={onConfirm}
            className="rounded-xl text-xs font-bold"
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
