import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronRight, Calendar, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, Order, OrderStatus, Paginated } from "../../../api/orderApi";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { Button } from "../../../components/ui/Button";

const STATUS_TABS: { label: string; value?: OrderStatus }[] = [
  { label: "Tất cả", value: undefined },
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Đang giao / Hoàn tất", value: "SHIPPED" },
  { label: "Đã hủy", value: "CANCELLED" },
];

export function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getMyOrders({
        page,
        limit: 10,
        status: activeTab,
      });
      setData(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể tải danh sách đơn hàng.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/orders" } } });
      return;
    }
    fetchOrders();
  }, [page, activeTab, isAuthenticated]);

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
        timeStyle: "short",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>📦</span>
            <span>Đơn hàng của tôi</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Xem lại lịch sử đặt hàng, trạng thái xử lý và tiến trình vận chuyển.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="text-xs font-semibold gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/80 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                  : "bg-surface-soft hover:bg-surface text-muted hover:text-foreground border border-border/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-3xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-danger-dark mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Lỗi tải danh sách đơn hàng</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="text-xs shrink-0">
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface rounded-3xl border border-border p-6 shadow-card animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-surface-soft rounded-lg w-1/4" />
                <div className="h-6 bg-surface-soft rounded-full w-24" />
              </div>
              <div className="h-10 bg-surface-soft rounded-xl w-3/4" />
              <div className="h-4 bg-surface-soft rounded-lg w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && (!data || data.items.length === 0) && (
        <div className="text-center py-16 bg-surface rounded-3xl border border-border p-8 shadow-card max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Chưa có đơn hàng nào</h3>
            <p className="text-muted text-xs sm:text-sm mt-1">
              {activeTab
                ? `Bạn chưa có đơn hàng nào ở trạng thái "${STATUS_TABS.find((t) => t.value === activeTab)?.label}".`
                : "Bạn chưa đặt đơn hàng nào tại CSM Store. Hãy chọn sản phẩm yêu thích và đặt ngay nhé!"}
            </p>
          </div>
          <Button asChild className="shadow-sm">
            <Link to="/products">Khám phá sản phẩm ngay</Link>
          </Button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((order) => (
            <div
              key={order.id}
              className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    #{order.id.slice(0, 13)}...
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-soft border border-border text-muted font-semibold">
                    {order.payment_method}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Items summary */}
              <div className="space-y-2">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-foreground">
                      <span className="font-bold text-primary-dark mr-2">{item.quantity}x</span>
                      {item.product_name_snapshot}
                    </span>
                    <span className="font-medium text-muted">
                      {formatCurrency(item.price_snapshot * item.quantity)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted italic">
                    + Thêm {order.items.length - 3} sản phẩm khác...
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="flex items-center gap-4 text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Chi nhánh: <b className="text-foreground">{order.branch_id}</b>
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-right">
                    <span className="text-muted text-[11px] block">Tổng tiền</span>
                    <span className="font-extrabold text-base sm:text-lg text-primary-dark">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <Button asChild size="sm" className="shadow-xs text-xs font-semibold">
                    <Link to={`/orders/${order.id}`}>
                      Chi tiết
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="p-4 bg-surface rounded-2xl border border-border flex items-center justify-between text-xs text-muted shadow-card">
              <span>
                Hiển thị trang <b>{data.page}</b> / <b>{data.totalPages}</b> (Tổng số <b>{data.total}</b> đơn)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  &larr; Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                >
                  Trang sau &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyOrdersPage;
