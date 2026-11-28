import React, { useEffect, useState } from "react";
import { AlertCircle, Pencil, Plus, X } from "lucide-react";

import { discountApi, CreateVoucherPayload, VoucherItem } from "../../../api/discountApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { NumberInput } from "../../../components/ui/NumberInput";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FieldError, FormErrorSummary, invalidClass } from "../../../components/ui/FieldError";
import { formatDateTimeVN, toDateTimeLocalValue } from "../../../lib/datetime";

/** Giới hạn nhập liệu — khớp với kiểm tra ở BE (discount-service). */
const VOUCHER_LIMITS = {
  codeMin: 3,
  codeMax: 20,
  descriptionMax: 255,
  minDiscountVnd: 1000,
  maxMoneyVnd: 100_000_000,
  minOrderVnd: 1000,
  usageMax: 1_000_000,
  perUserMax: 100,
};

type FieldKey =
  | "code"
  | "description"
  | "discount_value"
  | "min_order_value"
  | "max_discount_amount"
  | "usage_limit"
  | "max_usage_per_user"
  | "start_date"
  | "end_date";

const FIELD_ORDER: FieldKey[] = [
  "code",
  "description",
  "discount_value",
  "min_order_value",
  "max_discount_amount",
  "usage_limit",
  "max_usage_per_user",
  "start_date",
  "end_date",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  code: "Mã",
  description: "Mô tả",
  discount_value: "Mức giảm",
  min_order_value: "Đơn tối thiểu",
  max_discount_amount: "Giảm tối đa",
  usage_limit: "Lượt dùng tối đa",
  max_usage_per_user: "Lượt dùng mỗi khách",
  start_date: "Thời gian bắt đầu",
  end_date: "Thời gian kết thúc",
};

interface VoucherFormData {
  code: string;
  description: string;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number | null;
  min_order_value: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  max_usage_per_user: number | null;
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
      max_discount_amount: voucher.max_discount_amount ? Number(voucher.max_discount_amount) : null,
      usage_limit: Number(voucher.usage_limit) || null,
      max_usage_per_user: Number(voucher.max_usage_per_user) || 1,
      start_date: toDateTimeLocalValue(voucher.start_date),
      end_date: toDateTimeLocalValue(voucher.end_date),
    };
  }
  const start = new Date(Date.now() + 10 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 86400000);
  return {
    code: "",
    description: "",
    discount_type: "FIXED_AMOUNT",
    discount_value: 20000,
    min_order_value: 50000,
    max_discount_amount: null,
    usage_limit: 100,
    max_usage_per_user: 1,
    start_date: toDateTimeLocalValue(start),
    end_date: toDateTimeLocalValue(end),
  };
};

const fmtVnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/**
 * Kiểm tra toàn bộ form, trả về lỗi theo từng trường (tiếng Việt).
 * `original` là voucher đang sửa (nếu có) để chỉ kiểm tra "quá khứ" khi thời gian bị đổi.
 */
function validateVoucherForm(
  f: VoucherFormData,
  nowMs: number,
  original?: VoucherItem | null,
): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  const L = VOUCHER_LIMITS;

  const code = f.code.trim();
  if (!code) e.code = "Vui lòng nhập mã voucher.";
  else if (code.length < L.codeMin || code.length > L.codeMax)
    e.code = `Mã voucher phải từ ${L.codeMin} đến ${L.codeMax} ký tự (hiện tại ${code.length}).`;
  else if (!/^[A-Z0-9_-]+$/.test(code)) e.code = "Mã chỉ gồm chữ in hoa không dấu, số, dấu gạch ngang hoặc gạch dưới.";

  if (f.description.length > L.descriptionMax)
    e.description = `Mô tả tối đa ${L.descriptionMax} ký tự (hiện tại ${f.description.length}).`;

  const minOrder = f.min_order_value ?? 0;
  if (minOrder !== 0 && minOrder < L.minOrderVnd)
    e.min_order_value = `Đơn tối thiểu phải bằng 0đ (không yêu cầu) hoặc từ ${fmtVnd(L.minOrderVnd)} trở lên.`;
  else if (minOrder > L.maxMoneyVnd) e.min_order_value = `Đơn tối thiểu không vượt quá ${fmtVnd(L.maxMoneyVnd)}.`;

  const value = f.discount_value;
  if (f.discount_type === "FIXED_AMOUNT") {
    if (value === null) e.discount_value = "Vui lòng nhập mức giảm.";
    else if (value < L.minDiscountVnd) e.discount_value = `Mức giảm phải từ ${fmtVnd(L.minDiscountVnd)} trở lên.`;
    else if (value > L.maxMoneyVnd) e.discount_value = `Mức giảm không vượt quá ${fmtVnd(L.maxMoneyVnd)}.`;
    else if (!e.min_order_value && value > minOrder)
      e.discount_value =
        minOrder === 0
          ? `Voucher giảm tiền mặt cần có đơn tối thiểu từ ${fmtVnd(value)} trở lên (không giảm nhiều hơn giá trị đơn).`
          : `Mức giảm (${fmtVnd(value)}) không được lớn hơn đơn tối thiểu (${fmtVnd(minOrder)}).`;
  } else {
    if (value === null) e.discount_value = "Vui lòng nhập phần trăm giảm.";
    else if (value < 1 || value > 100) e.discount_value = "Phần trăm giảm phải từ 1% đến 100%.";

    const cap = f.max_discount_amount;
    if (cap === null) e.max_discount_amount = "Vui lòng nhập mức giảm tối đa cho voucher theo %.";
    else if (cap < L.minDiscountVnd) e.max_discount_amount = `Giảm tối đa phải từ ${fmtVnd(L.minDiscountVnd)} trở lên.`;
    else if (cap > L.maxMoneyVnd) e.max_discount_amount = `Giảm tối đa không vượt quá ${fmtVnd(L.maxMoneyVnd)}.`;
  }

  const used = original?.used_count || 0;
  if (f.usage_limit === null) e.usage_limit = "Vui lòng nhập tổng lượt dùng.";
  else if (f.usage_limit < 1) e.usage_limit = "Tổng lượt dùng phải từ 1 trở lên.";
  else if (f.usage_limit > L.usageMax) e.usage_limit = `Tổng lượt dùng tối đa ${new Intl.NumberFormat("vi-VN").format(L.usageMax)}.`;
  else if (f.usage_limit < used) e.usage_limit = `Không được nhỏ hơn số lượt đã dùng (${used}).`;

  const perUser = f.max_usage_per_user;
  if (perUser === null) e.max_usage_per_user = "Vui lòng nhập số lượt mỗi khách được dùng.";
  else if (perUser < 1 || perUser > L.perUserMax) e.max_usage_per_user = `Mỗi khách dùng từ 1 đến ${L.perUserMax} lượt.`;
  else if (f.usage_limit !== null && perUser > f.usage_limit)
    e.max_usage_per_user = "Lượt dùng mỗi khách không được lớn hơn tổng lượt dùng.";

  const startMs = f.start_date ? new Date(f.start_date).getTime() : NaN;
  const endMs = f.end_date ? new Date(f.end_date).getTime() : NaN;
  const startChanged = !original || toDateTimeLocalValue(original.start_date) !== f.start_date;
  const endChanged = !original || toDateTimeLocalValue(original.end_date) !== f.end_date;

  if (Number.isNaN(startMs)) e.start_date = "Vui lòng chọn thời gian bắt đầu.";
  else if (startChanged && startMs < nowMs - 60_000)
    e.start_date = `Thời gian bắt đầu phải từ thời điểm hiện tại (${formatDateTimeVN(nowMs)}) trở đi.`;

  if (Number.isNaN(endMs)) e.end_date = "Vui lòng chọn thời gian kết thúc.";
  else if (endChanged && endMs <= nowMs) e.end_date = "Thời gian kết thúc phải ở tương lai.";
  else if (!Number.isNaN(startMs) && endMs <= startMs) e.end_date = "Thời gian kết thúc phải sau thời gian bắt đầu.";

  return e;
}

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
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<"submit" | "cancel" | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");

  useEffect(() => {
    if (open) {
      const init = buildInitialForm(voucher);
      setFormData(init);
      setInitialSnapshot(JSON.stringify(init));
      setErrors({});
      setSubmitted(false);
      setServerError(null);
      setConfirm(null);
    }
  }, [open, voucher]);

  if (!open) return null;

  const update = (patch: Partial<VoucherFormData>) => {
    const next = { ...formData, ...patch };
    setFormData(next);
    // Sau lần bấm lưu đầu tiên, kiểm tra lại ngay khi sửa để lỗi biến mất kịp thời.
    if (submitted) setErrors(validateVoucherForm(next, Date.now(), voucher));
  };

  const isDirty = JSON.stringify(formData) !== initialSnapshot;

  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setConfirm("cancel");
    else onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const found = validateVoucherForm(formData, Date.now(), voucher);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setConfirm("submit");
  };

  const doSave = async () => {
    const code = formData.code.trim().toUpperCase();
    const payload: CreateVoucherPayload = {
      code,
      description: formData.description.trim() || undefined,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_value: formData.min_order_value ?? 0,
      max_discount_amount:
        formData.discount_type === "PERCENTAGE" ? (formData.max_discount_amount ?? undefined) : undefined,
      usage_limit: formData.usage_limit ?? undefined,
      max_usage_per_user: formData.max_usage_per_user ?? 1,
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
      setServerError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
      setConfirm(null);
    }
  };

  const isPercent = formData.discount_type === "PERCENTAGE";
  const label = (text: string, required = false) => (
    <label className="text-xs font-bold text-foreground">
      {text} {required && <span className="text-danger">*</span>}
    </label>
  );

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
            onClick={requestClose}
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

        {submitted && <FormErrorSummary errors={errors} order={FIELD_ORDER} labels={FIELD_LABELS} />}

        {serverError && (
          <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5" data-field="code">
            {label("Mã", true)}
            <Input
              disabled={lockedCore}
              maxLength={VOUCHER_LIMITS.codeMax}
              placeholder="VD: CSM50K, SALEHE"
              value={formData.code}
              onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
              aria-invalid={!!errors.code || undefined}
              className={`rounded-xl font-mono uppercase font-bold text-primary tracking-wide ${invalidClass(errors.code)}`}
            />
            <div className="flex justify-between gap-2">
              <FieldError message={errors.code} />
              <span className="text-[10px] text-muted ml-auto mt-1">
                {formData.code.length}/{VOUCHER_LIMITS.codeMax}
              </span>
            </div>
          </div>

          <div className="space-y-1.5" data-field="description">
            {label("Mô tả")}
            <Input
              maxLength={VOUCHER_LIMITS.descriptionMax}
              placeholder="VD: Giảm 20.000₫ cho đơn từ 50.000₫"
              value={formData.description}
              onChange={(e) => update({ description: e.target.value })}
              className={`rounded-xl text-xs ${invalidClass(errors.description)}`}
            />
            <div className="flex justify-between gap-2">
              <FieldError message={errors.description} />
              <span className="text-[10px] text-muted ml-auto mt-1">
                {formData.description.length}/{VOUCHER_LIMITS.descriptionMax}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              {label("Loại giảm giá")}
              <select
                disabled={lockedCore}
                value={formData.discount_type}
                onChange={(e) => {
                  const t = e.target.value as "FIXED_AMOUNT" | "PERCENTAGE";
                  update({
                    discount_type: t,
                    discount_value: t === "PERCENTAGE" ? 10 : 20000,
                    max_discount_amount: t === "PERCENTAGE" ? (formData.max_discount_amount ?? 50000) : null,
                  });
                }}
                className="w-full h-10 px-3 rounded-xl text-xs bg-surface border border-border font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                <option value="PERCENTAGE">Phần trăm (%)</option>
              </select>
            </div>
            <div className="space-y-1.5" data-field="discount_value">
              {label(isPercent ? "Mức giảm (%)" : "Mức giảm (VNĐ)", true)}
              <NumberInput
                disabled={lockedCore}
                value={formData.discount_value}
                onValueChange={(v) => update({ discount_value: v })}
                thousandSeparator={!isPercent}
                maxDigits={isPercent ? 3 : 9}
                suffix={isPercent ? "%" : "đ"}
                invalid={!!errors.discount_value}
                className="rounded-xl font-mono"
              />
              <FieldError message={errors.discount_value} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5" data-field="min_order_value">
              {label("Đơn tối thiểu (VNĐ)")}
              <NumberInput
                value={formData.min_order_value}
                onValueChange={(v) => update({ min_order_value: v })}
                thousandSeparator
                maxDigits={9}
                suffix="đ"
                placeholder="0 = không yêu cầu"
                invalid={!!errors.min_order_value}
                className="rounded-xl font-mono text-xs"
              />
              <FieldError message={errors.min_order_value} />
            </div>
            {isPercent ? (
              <div className="space-y-1.5" data-field="max_discount_amount">
                {label("Giảm tối đa (VNĐ)", true)}
                <NumberInput
                  value={formData.max_discount_amount}
                  onValueChange={(v) => update({ max_discount_amount: v })}
                  thousandSeparator
                  maxDigits={9}
                  suffix="đ"
                  invalid={!!errors.max_discount_amount}
                  className="rounded-xl font-mono text-xs"
                />
                <FieldError message={errors.max_discount_amount} />
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5" data-field="usage_limit">
              {label("Lượt dùng tối đa", true)}
              <NumberInput
                value={formData.usage_limit}
                onValueChange={(v) => update({ usage_limit: v })}
                thousandSeparator
                maxDigits={7}
                invalid={!!errors.usage_limit}
                className="rounded-xl font-mono text-xs"
              />
              <FieldError message={errors.usage_limit} />
            </div>
            <div className="space-y-1.5" data-field="max_usage_per_user">
              {label("Lượt dùng mỗi khách", true)}
              <NumberInput
                value={formData.max_usage_per_user}
                onValueChange={(v) => update({ max_usage_per_user: v })}
                maxDigits={3}
                invalid={!!errors.max_usage_per_user}
                className="rounded-xl font-mono text-xs"
              />
              <FieldError message={errors.max_usage_per_user} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5" data-field="start_date">
              {label("Thời gian bắt đầu", true)}
              <Input
                type="datetime-local"
                value={formData.start_date}
                min={isEdit ? undefined : toDateTimeLocalValue(new Date())}
                onChange={(e) => update({ start_date: e.target.value })}
                className={`rounded-xl text-xs ${invalidClass(errors.start_date)}`}
              />
              <FieldError message={errors.start_date} />
            </div>
            <div className="space-y-1.5" data-field="end_date">
              {label("Thời gian kết thúc", true)}
              <Input
                type="datetime-local"
                value={formData.end_date}
                min={formData.start_date || undefined}
                onChange={(e) => update({ end_date: e.target.value })}
                className={`rounded-xl text-xs ${invalidClass(errors.end_date)}`}
              />
              <FieldError message={errors.end_date} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={requestClose} disabled={isSubmitting} className="rounded-xl text-xs">
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs font-semibold shadow-sm">
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Xác nhận tạo Voucher"}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirm === "submit"}
        title={isEdit ? `Lưu thay đổi cho voucher ${formData.code}?` : `Tạo voucher ${formData.code}?`}
        description={
          <span>
            {isPercent
              ? `Giảm ${formData.discount_value}% (tối đa ${fmtVnd(formData.max_discount_amount ?? 0)})`
              : `Giảm ${fmtVnd(formData.discount_value ?? 0)}`}
            {formData.min_order_value ? ` cho đơn từ ${fmtVnd(formData.min_order_value)}` : ""}, áp dụng từ{" "}
            {formatDateTimeVN(formData.start_date)} đến {formatDateTimeVN(formData.end_date)}.
          </span>
        }
        confirmLabel={isEdit ? "Lưu thay đổi" : "Tạo voucher"}
        loading={isSubmitting}
        onConfirm={doSave}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        tone="warning"
        title="Huỷ thay đổi?"
        description="Các thông tin bạn vừa nhập sẽ không được lưu."
        confirmLabel="Huỷ thay đổi"
        cancelLabel="Tiếp tục nhập"
        onConfirm={() => {
          setConfirm(null);
          onClose();
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
