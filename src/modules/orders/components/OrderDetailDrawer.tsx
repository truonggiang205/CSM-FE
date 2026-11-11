import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Building2,
  Calendar,
  CreditCard,
  User,
  Package,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Printer,
} from "lucide-react";
import { Order, OrderStatus } from "../../../api/orderApi";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  isUpdatingStatus?: boolean;
}

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  branchName,
  onUpdateStatus,
  isUpdatingStatus = false,
}: OrderDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    targetStatus: OrderStatus;
    title: string;
    description: string;
    isDangerous?: boolean;
  } | null>(null);

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
        dateStyle: "medium",
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop click to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} aria-label="Đóng ngăn kéo" />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-order-title"
        className="w-full max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Chi Tiết Đơn Hàng</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-2">
              <h2 id="drawer-order-title" className="text-lg font-mono font-black text-foreground">
                #{order.id.slice(0, 8)}
              </h2>
              <button
                onClick={handleCopyId}
                aria-label="Sao chép toàn bộ mã đơn"
                className="p-1 text-muted hover:text-foreground rounded-lg hover:bg-surface-soft transition-colors"
                title="Sao chép toàn bộ mã UUID"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng ngăn kéo chi tiết đơn hàng"
            className="p-2 text-muted hover:text-foreground hover:bg-surface-soft rounded-2xl border border-border/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Thông tin cửa hàng & thời gian */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-soft border border-border/60 text-xs">
            <div className="space-y-1">
              <span className="text-muted flex items-center gap-1 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Chi nhánh xuất
              </span>
              <p className="font-bold text-foreground truncate">{branchName || order.branch_id}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Ngày đặt hàng
              </span>
              <p className="font-bold text-foreground">{formatDate(order.created_at)}</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/50">
              <span className="text-muted flex items-center gap-1 font-semibold">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Thanh toán
              </span>
              <p className="font-bold text-foreground">{order.payment_method}</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/50">
              <span className="text-muted flex items-center gap-1 font-semibold">
                <User className="w-3.5 h-3.5 text-primary" /> Khách hàng
              </span>
              <p className="font-bold text-foreground truncate font-mono">
                {order.user_id ? `#${order.user_id.slice(0, 8)}` : "Khách lẻ tại quầy"}
              </p>
            </div>
          </div>

          {/* Danh sách mặt hàng mua */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" /> Danh Sách Mặt Hàng ({items.length})
              </h3>
            </div>

            <div className="space-y-2 border border-border/70 rounded-2xl divide-y divide-border/50 overflow-hidden bg-surface">
              {items.length === 0 ? (
                <p className="p-4 text-xs text-muted text-center">Không có bản ghi mặt hàng chi tiết.</p>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate" title={item.product_name_snapshot}>
                        {item.product_name_snapshot}
                      </p>
                      <p className="text-[11px] text-muted">
                        Đơn giá: {formatCurrency(Number(item.price_snapshot) || 0)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-extrabold text-foreground shrink-0">
                      {formatCurrency((Number(item.price_snapshot) || 0) * (Number(item.quantity) || 1))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tổng kết tài chính */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-border/70 space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Phí giao hàng:</span>
              <span className="font-semibold text-foreground">
                {Number(order.total_amount) > subtotal
                  ? formatCurrency(Number(order.total_amount) - subtotal)
                  : "Miễn phí (0 ₫)"}
              </span>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between items-center text-sm">
              <span className="font-extrabold text-foreground">Tổng cộng thanh toán:</span>
              <span className="text-base font-black text-primary-dark">
                {formatCurrency(Number(order.total_amount) || 0)}
              </span>
            </div>
          </div>

          {/* Khối thao tác chuyển trạng thái (State Machine) */}
          {onUpdateStatus && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Hành Động Trạng Thái</h4>

              <div className="grid grid-cols-2 gap-2">
                {order.status === "PENDING" && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "CANCELLED",
                          title: `Hủy đơn hàng #${order.id.slice(0, 8)}?`,
                          description:
                            "Đơn hàng sẽ chuyển sang CANCELLED và Saga hoàn trả tồn kho tạm giữ (release-stock) tại chi nhánh.",
                          isDangerous: true,
                        })
                      }
                      className="rounded-xl text-xs font-bold"
                    >
                      Hủy đơn hàng
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "CONFIRMED",
                          title: `Xác nhận đơn #${order.id.slice(0, 8)}?`,
                          description:
                            "Đơn hàng sẽ chuyển sang CONFIRMED và Saga trừ kho thực tế (confirm-deduct).",
                        })
                      }
                      className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Xác nhận duyệt
                    </Button>
                  </>
                )}

                {order.status === "CONFIRMED" && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "CANCELLED",
                          title: `Hủy đơn hàng #${order.id.slice(0, 8)}?`,
                          description: "Chuyển đơn hàng sang CANCELLED.",
                          isDangerous: true,
                        })
                      }
                      className="rounded-xl text-xs font-bold"
                    >
                      Hủy đơn
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "PAID",
                          title: `Xác nhận thanh toán đơn #${order.id.slice(0, 8)}?`,
                          description: "Ghi nhận khách đã trả tiền đầy đủ (PAID).",
                        })
                      }
                      className="rounded-xl text-xs font-bold text-success-dark border-success/30 hover:bg-pastel-mint"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Đã thanh toán
                    </Button>

                    <div className="col-span-2">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() =>
                          setConfirmDialog({
                            targetStatus: "SHIPPED",
                            title: `Giao hàng / Hoàn tất #${order.id.slice(0, 8)}?`,
                            description: "Chuyển trạng thái đơn sang SHIPPED (Đang giao/Đã giao).",
                          })
                        }
                        className="w-full rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Xuất kho & Vận chuyển (SHIPPED)
                      </Button>
                    </div>
                  </>
                )}

                {order.status === "PAID" && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "CANCELLED",
                          title: `Hủy đơn hàng đã thanh toán #${order.id.slice(0, 8)}?`,
                          description: "Hủy đơn hàng đã trả tiền và chuyển sang CANCELLED.",
                          isDangerous: true,
                        })
                      }
                      className="rounded-xl text-xs font-bold"
                    >
                      Hủy đơn
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        setConfirmDialog({
                          targetStatus: "SHIPPED",
                          title: `Giao hàng cho đơn #${order.id.slice(0, 8)}?`,
                          description: "Chuyển trạng thái sang SHIPPED.",
                        })
                      }
                      className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Giao hàng (SHIPPED)
                    </Button>
                  </>
                )}

                {(order.status === "SHIPPED" || order.status === "CANCELLED") && (
                  <div className="col-span-2 p-3 rounded-xl bg-surface-soft text-xs text-muted text-center border border-border">
                    Đơn hàng đã ở trạng thái kết thúc ({order.status}), không thể thay đổi thêm.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 flex items-center justify-between shrink-0 bg-surface">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold flex items-center gap-1.5 text-muted hover:text-foreground"
          >
            <Printer className="w-3.5 h-3.5" />
            In hóa đơn
          </Button>

          <Button
            variant="soft"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Đóng ngăn kéo
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && onUpdateStatus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              {confirmDialog.isDangerous ? (
                <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              )}
              <h4 className="font-extrabold text-sm text-foreground">{confirmDialog.title}</h4>
            </div>

            <p className="text-xs text-muted leading-relaxed">{confirmDialog.description}</p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialog(null)}
                disabled={isUpdatingStatus}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>

              <Button
                variant={confirmDialog.isDangerous ? "destructive" : "default"}
                size="sm"
                disabled={isUpdatingStatus}
                onClick={async () => {
                  const target = confirmDialog.targetStatus;
                  setConfirmDialog(null);
                  await onUpdateStatus(order.id, target);
                }}
                className="rounded-xl text-xs font-bold"
              >
                {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Xác nhận ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
