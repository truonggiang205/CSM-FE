import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Building2,
  Calendar,
  CreditCard,
  User,
  Package,
  Printer,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Order, OrderStatus } from "../../../api/orderApi";
import {
  PaymentStatusBadge,
  DeliveryStatusBadge,
} from "./OrderStatusBadge";
import { Button } from "../../../components/ui/Button";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  isUpdatingStatus?: boolean;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdatingStatus = false,
}: OrderDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        dateStyle: "full",
        timeStyle: "medium",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const items = order.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price_snapshot) || 0) * (Number(item.quantity) || 1),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary-dark uppercase tracking-wider bg-primary-tint px-2.5 py-0.5 rounded-full border border-primary/20">
                Chi tiết đơn hàng
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-foreground">
                #{order.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 text-muted hover:text-foreground rounded-lg transition-colors"
                title="Sao chép mã đơn hàng"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-muted flex items-center gap-1.5 pt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời gian đặt: {formatDate(order.created_at)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Đóng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Badges Row */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted font-medium">Trạng thái:</span>
              <PaymentStatusBadge status={order.status} />
              <DeliveryStatusBadge status={order.status} />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-surface border border-border text-foreground font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Chi nhánh: <strong className="text-primary-dark">{order.branch_id || "Chưa gán"}</strong>
              </span>
            </div>
          </div>

          {/* Customer & Payment Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-border/80 bg-surface space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Thông tin khách hàng
              </h4>
              <p className="text-xs font-semibold text-foreground">
                Mã khách hàng: <span className="font-mono text-muted">{order.user_id || "Khách mua tại quầy / Khách lẻ"}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-surface space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                Phương thức thanh toán
              </h4>
              <p className="text-xs font-bold text-foreground">
                {order.payment_method === "COD" ? "Thanh toán khi nhận hàng (COD)" : `${order.payment_method} - Cổng thanh toán trực tuyến`}
              </p>
              <p className="text-[11px] text-muted">
                Cập nhật lần cuối: {formatDate(order.updated_at || order.created_at)}
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Danh sách sản phẩm ({items.length} mặt hàng)
              </h4>
            </div>

            <div className="border border-border/80 rounded-2xl overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-soft text-[11px] font-bold text-muted uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3 text-center">Đơn giá</th>
                      <th className="px-4 py-3 text-center">Số lượng</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-muted">
                          Không có thông tin chi tiết sản phẩm.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-soft/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="font-bold text-xs">{item.product_name_snapshot}</div>
                            <div className="font-mono text-[10px] text-muted">Mã: {item.product_id}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-muted font-mono">
                            {formatCurrency(Number(item.price_snapshot))}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-foreground">
                            x{item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-foreground font-mono">
                            {formatCurrency(Number(item.price_snapshot) * Number(item.quantity))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="p-4.5 rounded-2xl bg-surface-soft border border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Tạm tính hàng hóa:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(subtotal || order.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Phí vận chuyển giao hàng:</span>
              <span className="font-semibold text-success-dark">Miễn phí (0 ₫)</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-extrabold">
              <span className="text-foreground">Tổng tiền thanh toán:</span>
              <span className="text-lg font-black text-primary-dark font-mono">
                {formatCurrency(Number(order.total_amount))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            In phiếu đơn
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-bold px-5"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

