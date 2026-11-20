import React, { useState } from "react";
import {
  X,
  Tag,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Percent,
  Coins,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { discountApi, VoucherItem } from "../../../api/discountApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderValue: number;
  currentVoucherCode?: string;
  onSelectVoucher: (code: string) => Promise<boolean | void> | void;
}

export function VoucherModal({
  isOpen,
  onClose,
  orderValue,
  currentVoucherCode = "",
  onSelectVoucher,
}: VoucherModalProps) {
  const [inputCode, setInputCode] = useState("");
  const [actionError, setActionError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Lấy danh sách voucher công khai còn hiệu lực từ Backend
  const { data: vouchers = [], isLoading, refetch } = useQuery({
    queryKey: ["available-vouchers"],
    queryFn: discountApi.getAvailableVouchers,
    enabled: isOpen,
    staleTime: 30000,
  });

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleApplyCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    try {
      setIsApplying(true);
      const success = await onSelectVoucher(code);
      if (success !== false) {
        setInputCode("");
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Mã không hợp lệ";
      setActionError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectCard = async (voucher: VoucherItem) => {
    setActionError("");
    if (orderValue < Number(voucher.min_order_value)) {
      setActionError(
        `Đơn hàng cần đạt tối thiểu ${formatCurrency(Number(voucher.min_order_value))} để dùng mã này.`
      );
      return;
    }

    try {
      setIsApplying(true);
      const success = await onSelectVoucher(voucher.code);
      if (success !== false) {
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể áp dụng voucher";
      setActionError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-modal-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-surface rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 id="voucher-modal-title" className="font-bold text-base sm:text-lg text-foreground">
                Chọn mã giảm giá CSM
              </h3>
              <p className="text-xs text-muted">
                Áp dụng voucher để nhận ưu đãi cho đơn hàng của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search / Nhập mã trực tiếp */}
        <div className="p-4 bg-surface-soft/60 border-b border-border/60">
          <form onSubmit={handleApplyCustomCode} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Nhập mã voucher (VD: CSM20K)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="pl-9 text-xs sm:text-sm uppercase font-mono font-bold bg-surface"
              />
            </div>
            <Button
              type="submit"
              disabled={isApplying || !inputCode.trim()}
              className="rounded-xl px-4 text-xs font-semibold shrink-0"
            >
              Áp dụng
            </Button>
          </form>

          {actionError && (
            <div className="mt-2 text-xs text-danger flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* Danh sách Voucher khả dụng */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-semibold text-foreground">Mã ưu đãi sẵn có</span>
            <span>Giá trị đơn: <strong className="text-primary">{formatCurrency(orderValue)}</strong></span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted">Đang tải danh sách voucher...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-border rounded-2xl bg-surface-soft/40">
              <Ticket className="w-8 h-8 text-muted mx-auto stroke-1" />
              <p className="text-sm font-semibold text-foreground">Chưa có mã giảm giá nào</p>
              <p className="text-xs text-muted">Vui lòng quay lại sau hoặc nhập mã trực tiếp ở trên.</p>
            </div>
          ) : (
            vouchers.map((v) => {
              const isFixed = v.discount_type === "FIXED_AMOUNT";
              const isSelected = currentVoucherCode.trim().toUpperCase() === v.code.toUpperCase();
              const isEligible = orderValue >= Number(v.min_order_value);
              const missingAmount = Number(v.min_order_value) - orderValue;

              return (
                <div
                  key={v.id}
                  className={`relative border rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : isEligible
                      ? "border-border hover:border-primary/50 bg-surface hover:shadow-xs"
                      : "border-border/60 bg-surface-soft/40 opacity-75"
                  }`}
                >
                  {/* Left: Badge discount */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold ${
                        isEligible
                          ? "bg-primary-tint text-primary border border-primary/20"
                          : "bg-surface-soft text-muted border border-border"
                      }`}
                    >
                      {isFixed ? (
                        <>
                          <Coins className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] leading-none">GIẢM TIỀN</span>
                        </>
                      ) : (
                        <>
                          <Percent className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] leading-none">GIẢM %</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-foreground tracking-wider bg-surface-soft px-2 py-0.5 rounded-lg border border-border">
                          {v.code}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                            <CheckCircle2 className="w-3 h-3" /> Đang dùng
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground">
                        {isFixed
                          ? `Giảm ${formatCurrency(Number(v.discount_value))}`
                          : `Giảm ${v.discount_value}% ${
                              v.max_discount_amount
                                ? `(Tối đa ${formatCurrency(Number(v.max_discount_amount))})`
                                : ""
                            }`}
                      </p>

                      {v.description && (
                        <p className="text-[11px] text-muted line-clamp-1">{v.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-muted flex-wrap pt-0.5">
                        <span>Đơn tối thiểu: {formatCurrency(Number(v.min_order_value))}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> HSD: {formatDate(v.end_date)}
                        </span>
                      </div>

                      {!isEligible && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Mua thêm {formatCurrency(missingAmount)} để áp dụng
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Nút hành động */}
                  <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    {isSelected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-xl text-xs font-bold text-success border-success/40 w-full sm:w-auto"
                      >
                        Đã chọn
                      </Button>
                    ) : isEligible ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isApplying}
                        onClick={() => handleSelectCard(v)}
                        className="rounded-xl text-xs font-bold shadow-xs hover:shadow-primary/20 w-full sm:w-auto cursor-pointer"
                      >
                        Áp dụng
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-xl text-xs text-muted w-full sm:w-auto opacity-60"
                      >
                        Chưa đủ điều kiện
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between text-xs text-muted shrink-0">
          <span>* Mỗi đơn hàng chỉ áp dụng tối đa 1 mã giảm giá.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl px-4 text-xs font-semibold"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
