import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  RefreshCw,
  AlertCircle,
  XCircle,
  CreditCard as PayIcon,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
} from "lucide-react";
import { orderApi, Order, OrderStatus } from "../../../api/orderApi";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { Button } from "../../../components/ui/Button";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling kết quả thanh toán mô phỏng (2s/lần, tối đa 10 lần)
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [pollingExhausted, setPollingExhausted] = useState(false);
  const pollingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal huỷ đơn
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Nút thanh toán lại
  const [isPaying, setIsPaying] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((initialOrder: Order) => {
    // Chỉ kích hoạt tự động refetch đối với đơn thanh toán online đang ở trạng thái PENDING
    if (initialOrder.payment_method === "COD" || initialOrder.status !== "PENDING") {
      stopPolling();
      return;
    }

    stopPolling();
    setIsPolling(true);
    setPollingExhausted(false);
    setPollCount(1);

    let count = 1;

    const poll = async () => {
      if (!id) return;
      try {
        const latest = await orderApi.getOrderById(id);
        setOrder(latest);

        if (latest.status !== "PENDING") {
          // Trạng thái đã chuyển sang PAID / CONFIRMED / CANCELLED -> Dừng polling ngay lập tức
          stopPolling();
          return;
        }

        if (count >= 10) {
          // Đã hết 10 lần refetch mà vẫn PENDING -> Dừng polling và hiển thị thông báo
          stopPolling();
          setPollingExhausted(true);
          return;
        }

        count += 1;
        setPollCount(count);
        pollingTimeoutRef.current = setTimeout(poll, 2000);
      } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái đơn:", err);
        if (count >= 10) {
          stopPolling();
          setPollingExhausted(true);
        } else {
          count += 1;
          setPollCount(count);
          pollingTimeoutRef.current = setTimeout(poll, 2000);
        }
      }
    };

    pollingTimeoutRef.current = setTimeout(poll, 2000);
  }, [id, stopPolling]);

  const fetchOrderDetail = useCallback(async (withPolling = true) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrderById(id);
      setOrder(data);
      if (withPolling) {
        startPolling(data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể tải thông tin đơn hàng.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [id, startPolling]);

  // Tự động tải lại khi trang được mount (kể cả khi vừa redirect từ cổng thanh toán mô phỏng quay về)
  useEffect(() => {
    fetchOrderDetail(true);
    return () => {
      stopPolling();
    };
  }, [fetchOrderDetail, stopPolling]);

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
        timeStyle: "short",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Xử lý Huỷ đơn hàng khi đang PENDING
  const handleConfirmCancel = async () => {
    if (!order) return;
    stopPolling();
    setIsCancelling(true);
    setCancelError("");
    try {
      const updated = await orderApi.updateOrderStatus(order.id, "CANCELLED");
      setOrder(updated);
      setIsCancelModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Huỷ đơn hàng thất bại.";
      setCancelError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsCancelling(false);
    }
  };

  // Xử lý Thanh toán lại đối với đơn online còn PENDING
  const handleRetryPayment = async () => {
    if (!order) return;
    stopPolling();
    setIsPaying(true);
    try {
      const res = await orderApi.createPayment({
        orderId: order.id,
        method: order.payment_method,
      });

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        alert("Không nhận được đường dẫn thanh toán từ cổng thanh toán.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi tạo link thanh toán lại.";
      alert("⚠️ " + msg);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <div className="h-8 bg-surface-soft rounded-xl w-48 animate-pulse" />
        <div className="bg-surface rounded-3xl border border-border p-8 shadow-card space-y-6 animate-pulse">
          <div className="h-10 bg-surface-soft rounded-2xl w-2/3" />
          <div className="h-32 bg-surface-soft rounded-2xl" />
          <div className="h-40 bg-surface-soft rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-danger-pastel border border-danger/30 flex items-center justify-center text-danger-dark mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy đơn hàng</h2>
        <p className="text-muted text-xs sm:text-sm mt-1">{error || "Mã đơn hàng không tồn tại hoặc bạn không có quyền xem."}</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
          <Button asChild><Link to="/orders">Danh sách đơn của tôi</Link></Button>
        </div>
      </div>
    );
  }

  // Danh sách các bước trạng thái
  const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
    { status: "PENDING", label: "Chờ xác nhận", icon: Clock },
    { status: "CONFIRMED", label: "Đã xác nhận", icon: CheckCircle2 },
    { status: "PAID", label: "Đã thanh toán", icon: PackageCheck },
    { status: "SHIPPED", label: "Đang giao / Hoàn tất", icon: Truck },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PAID":
        return 2;
      case "SHIPPED":
        return 3;
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING";
  const canRetryPayment = order.payment_method !== "COD" && order.status === "PENDING";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Nút quay lại */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold -ml-3">
          <Link to="/orders">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Tất cả đơn hàng của tôi
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrderDetail(true)}
          className="text-xs font-semibold gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới trạng thái
        </Button>
      </div>

      {/* Banner tự động kiểm tra kết quả thanh toán mô phỏng */}
      {isPolling && (
        <div className="p-3.5 rounded-2xl bg-primary-tint/70 border border-primary/25 text-primary-dark text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-primary shrink-0" />
            <span>Đang tự động đồng bộ kết quả thanh toán với cổng thanh toán (lần {pollCount}/10)...</span>
          </div>
          <span className="text-[11px] text-muted font-mono hidden sm:inline">Chu kỳ 2s</span>
        </div>
      )}

      {/* Thông báo khi hết lượt polling mà đơn vẫn PENDING */}
      {pollingExhausted && order.status === "PENDING" && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Chưa nhận được cập nhật thanh toán từ cổng mô phỏng</p>
            <p className="leading-relaxed">
              Hệ thống đã tự động kiểm tra 10 lần nhưng đơn hàng vẫn ở trạng thái <b>Chờ xác nhận (PENDING)</b>. Nếu bạn vừa bấm xác nhận thanh toán thành công, vui lòng bấm nút <b>"Làm mới trạng thái"</b> bên trên sau ít phút hoặc sử dụng nút <b>"Thanh toán lại"</b> nếu giao dịch bị gián đoạn.
            </p>
          </div>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-card space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-foreground">
                #{order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted mt-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Đặt lúc: {formatDate(order.created_at)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-muted block">Tổng giá trị đơn hàng</span>
            <span className="text-2xl font-extrabold text-primary-dark">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Status Stepper Timeline */}
        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0 text-danger-dark" />
            <div>
              <p className="font-bold text-sm">Đơn hàng này đã bị huỷ</p>
              <p className="text-xs mt-0.5">
                Các sản phẩm trong đơn đã được giải phóng tồn kho về chi nhánh (Saga Compensating).
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div className="grid grid-cols-4 gap-2 relative">
              <div className="absolute top-5 left-0 w-full h-1 bg-border -z-10" />
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={s.status} className="flex flex-col items-center text-center px-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-primary text-white shadow-sm ring-4 ring-primary-tint"
                          : isPassed
                          ? "bg-primary-tint text-primary-dark font-bold border border-primary/30"
                          : "bg-surface border-2 border-border text-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent
                          ? "text-primary-dark font-bold"
                          : isPassed
                          ? "text-foreground font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thông tin đơn hàng & Chi nhánh */}
        <div className="grid sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-surface-soft border border-border/80 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <span className="text-muted text-[11px] uppercase font-bold tracking-wider">Thông tin nhận hàng</span>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>Chi nhánh xử lý: <b>{order.branch_id}</b></span>
            </div>
            <p className="text-muted text-xs pl-6">
              Mã khách hàng: <span className="font-mono text-foreground">{order.user_id}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-muted text-[11px] uppercase font-bold tracking-wider">Phương thức thanh toán</span>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CreditCard className="w-4 h-4 text-primary shrink-0" />
              <span>Hình thức: <b>{order.payment_method}</b></span>
            </div>
            <p className="text-muted text-xs pl-6">
              {order.payment_method === "COD"
                ? "Thanh toán bằng tiền mặt khi nhận hàng tại cửa hàng/shipper."
                : "Thanh toán qua cổng trực tuyến mô phỏng CSM Payment Gateway."}
            </p>
          </div>
        </div>

        {/* Bảng danh sách sản phẩm */}
        <div className="space-y-3">
          <h3 className="font-bold text-base text-foreground">Danh sách món hàng</h3>
          <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface-soft text-[11px] font-semibold text-muted uppercase border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Sản phẩm</th>
                  <th className="px-5 py-3.5 text-center">Đơn giá</th>
                  <th className="px-5 py-3.5 text-center">Số lượng</th>
                  <th className="px-5 py-3.5 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-soft/40 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary-tint/60 text-primary flex items-center justify-center text-xs">
                          ☕
                        </span>
                        <span>{item.product_name_snapshot}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-muted font-medium">
                      {formatCurrency(item.price_snapshot)}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-foreground">
                      x{item.quantity}
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-primary-dark">
                      {formatCurrency(item.price_snapshot * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-soft/50 font-bold border-t border-border">
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-right text-muted text-xs">
                    Tổng cộng:
                  </td>
                  <td className="px-5 py-4 text-right text-base font-extrabold text-primary-dark">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Nút hành động dành cho khách hàng */}
        {(canCancel || canRetryPayment) && (
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
            {canCancel && (
              <Button
                variant="outline"
                className="text-danger-dark border-danger/30 hover:bg-danger-pastel/60 text-xs font-semibold"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Huỷ đơn hàng này
              </Button>
            )}

            {canRetryPayment && (
              <Button
                disabled={isPaying}
                onClick={handleRetryPayment}
                className="shadow-sm text-xs font-semibold"
              >
                {isPaying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang kết nối cổng thanh toán...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <PayIcon className="w-4 h-4" />
                    Thanh toán lại ({order.payment_method}) &rarr;
                  </span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal xác nhận huỷ đơn */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-danger-pastel border border-danger/30 flex items-center justify-center text-danger-dark">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">Xác nhận huỷ đơn hàng?</h3>
              <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
                Đơn hàng <b>#{order.id}</b> đang ở trạng thái Chờ xử lý. Sau khi huỷ, số lượng giữ hàng trong kho sẽ được hoàn trả lại ngay lập tức.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                disabled={isCancelling}
                onClick={() => setIsCancelModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                variant="destructive"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? "Đang huỷ..." : "Đồng ý huỷ đơn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailPage;
