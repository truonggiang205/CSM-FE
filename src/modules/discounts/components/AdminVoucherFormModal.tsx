import React, { useEffect, useState } from "react";
import { AlertCircle, Pencil, Plus, X } from "lucide-react";

import { discountApi, CreateVoucherPayload, VoucherItem } from "../../../api/discountApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { toDateTimeLocalValue } from "../../../lib/datetime";

interface VoucherFormData {
  code: string;
  description: string;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  usage_limit: number;
  start_date: string;
  end_date: string;
}

const buildInitialForm = (voucher?: VoucherItem | null): VoucherFormData => {
  if (voucher) {
    return {
      code: voucher.code,
      description: voucher.description || "",
      discount_type: voucher.discount_type,
      discount_value: Number(voucher.discount_value),
      min_order_value: Number(voucher.min_order_value) || 0,
      max_discount_amount: Number(voucher.max_discount_amount) || 0,
      usage_limit: Number(voucher.usage_limit) || 1,
      start_date: toDateTimeLocalValue(voucher.start_date),
      end_date: toDateTimeLocalValue(voucher.end_date),
    };
  }
  const start = new Date(Date.now() + 5 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 86400000);
  return {
    code: "",
    description: "",
    discount_type: "FIXED_AMOUNT",
    discount_value: 20000,
    min_order_value: 50000,
    max_discount_amount: 50000,
    usage_limit: 100,
    start_date: toDateTimeLocalValue(start),
    end_date: toDateTimeLocalValue(end),
  };
};

export interface AdminVoucherFormModalProps {
  open: boolean;
  /** Truyền voucher để mở ở chế độ chỉnh sửa; bỏ trống để tạo mới. */
  voucher?: VoucherItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Form tạo mới / chỉnh sửa voucher trong trang quản trị. */
export function AdminVoucherFormModal({ open, voucher, onClose, onSaved }: AdminVoucherFormModalProps) {
  const isEdit = !!voucher;
  const lockedCore = isEdit && (voucher?.used_count || 0) > 0;
  const [formData, setFormData] = useState<VoucherFormData>(() => buildInitialForm(voucher));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(buildInitialForm(voucher));
      setFormError(null);
    }
  }, [open, voucher]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.code.trim().toUpperCase();
    if (!code) {
      setFormError("Vui lòng nhập mã voucher");
      return;
    }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setFormError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    if (formData.discount_value <= 0) {
      setFormError("Giá trị giảm giá phải lớn hơn 0");
      return;
    }

    const payload: CreateVoucherPayload = {
      code,
      description: formData.description.trim() || undefined,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_value: Number(formData.min_order_value) || 0,
      max_discount_amount:
        formData.discount_type === "PERCENTAGE" ? Number(formData.max_discount_amount) || undefined : undefined,
      usage_limit: Number(formData.usage_limit) || 100,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };

    try {
      setIsSubmitting(true);
      if (isEdit && voucher) {
        await discountApi.updateVoucher(voucher.id, payload);
        onSaved(`Đã cập nhật voucher '${code}'!`);
      } else {
        await discountApi.createVoucher(payload);
        onSaved(`Tạo voucher '${code}' thành công!`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lưu voucher thất bại";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numberField = (key: keyof VoucherFormData) => ({
    value: formData[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [key]: Number(e.target.value) }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary">
              {isEdit ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{isEdit ? "Chỉnh sửa voucher" : "Tạo Voucher Mới"}</h3>
              <p className="text-xs text-muted">Thiết lập mã giảm giá và điều kiện áp dụng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lockedCore && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            Voucher đã được dùng {voucher?.used_count} lượt nên không thể đổi mã, kiểu giảm và mức giảm.
          </div>
        )}

        {formError && (
          <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Mã Voucher <span className="text-danger">*</span>
            </label>
            <Input
              required
              disabled={lockedCore}
              placeholder="VD: CSM50K, SALEHE"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
              className="rounded-xl font-mono uppercase font-bold text-primary tracking-wide"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Mô tả</label>
            <Input
              placeholder="VD: Giảm 20.000₫ cho đơn từ 50.000₫"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Loại giảm giá</label>
              <select
                disabled={lockedCore}
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_type: e.target.value as "FIXED_AMOUNT" | "PERCENTAGE",
                    discount_value: e.target.value === "PERCENTAGE" ? 10 : 20000,
                  })
                }
                className="w-full px-3 py-2 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                <option value="PERCENTAGE">Phần trăm (%)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {formData.discount_type === "FIXED_AMOUNT" ? "Mức giảm (VNĐ) *" : "Mức giảm (%) *"}
              </label>
              <Input required type="number" min={1} disabled={lockedCore} {...numberField("discount_value")} className="rounded-xl font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Đơn tối thiểu (VNĐ)</label>
              <Input type="number" min={0} {...numberField("min_order_value")} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Lượt dùng tối đa</label>
              <Input type="number" min={1} {...numberField("usage_limit")} className="rounded-xl font-mono text-xs" />
            </div>
          </div>

          {formData.discount_type === "PERCENTAGE" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Giảm tối đa (VNĐ)</label>
              <Input type="number" min={1000} {...numberField("max_discount_amount")} className="rounded-xl font-mono text-xs" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Thời gian bắt đầu</label>
              <Input
                required
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Thời gian kết thúc</label>
              <Input
                required
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl text-xs">
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs font-semibold shadow-sm">
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Xác nhận tạo Voucher"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
