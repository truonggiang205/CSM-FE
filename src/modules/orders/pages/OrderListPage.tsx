import React, { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Truck,
  CreditCard,
  Package,
  Clock,
  ExternalLink,
  X,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, Order, OrderStatus, Paginated } from "../../../api/orderApi";
import { branchApi } from "../../../api/branchApi";
import { Branch } from "../../../types/branch";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  DeliveryStatusBadge,
} from "../components/OrderStatusBadge";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

export function OrderListPage() {
  const { user } = useAuthStore();

  // Chặn khách hàng thông thường không được vào quản trị đơn hàng
  if (!user || user.role === "CUSTOMER") {
    return <Navigate to="/unauthorized" replace />;
  }

  const isAdmin = user.role === "ADMIN";
  const userBranchId = user.branch_id;

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>(isAdmin ? "ALL" : userBranchId || "ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Data states
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal dialog states khi click vào trạng thái giao hàng hoặc thanh toán
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [viewingDeliveryOrder, setViewingDeliveryOrder] = useState<Order | null>(null);
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<OrderStatus | null>(null);
  const [viewingPaymentOrder, setViewingPaymentOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Tải danh sách chi nhánh nếu là ADMIN
  useEffect(() => {
    if (isAdmin) {
      branchApi.getBranches().then(setBranches).catch(() => {});
    }
  }, [isAdmin]);

  // Tải danh sách đơn hàng từ API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Validate logic ngày
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError("Khoảng ngày không hợp lệ: Từ ngày phải trước hoặc bằng Đến ngày.");
      setLoading(false);
      return;
    }

    try {
      const params: any = {
        page,
        limit: 10,
      };

      if (statusFilter !== "ALL") params.status = statusFilter;
      if (isAdmin && branchFilter !== "ALL") params.branchId = branchFilter;
      if (search.trim()) params.search = search.trim();
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) {
        // Cho toDate hết ngày (23:59:59)
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        params.toDate = d.toISOString();
      }

      const res = await orderApi.getAllOrders(params);
      setData(res);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể tải danh sách đơn hàng quản trị.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, branchFilter, search, fromDate, toDate, isAdmin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Cập nhật trạng thái từ Modal
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setStatusActionError("");
    try {
      const updated = await orderApi.updateOrderStatus(orderId, newStatus);
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
        };
      });

      setSuccessToast(`Đã cập nhật trạng thái đơn #${orderId.slice(0, 8)} thành công!`);
      setTimeout(() => setSuccessToast(""), 4000);

      // Cập nhật lại order đang hiển thị trong modal
      if (viewingDeliveryOrder?.id === orderId) {
        setViewingDeliveryOrder(updated);
      }
      if (viewingPaymentOrder?.id === orderId) {
        setViewingPaymentOrder(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Cập nhật trạng thái thất bại.";
      setStatusActionError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Thông tin vai trò */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>📋</span>
            <span>Quản lý đơn hàng</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Quản lý và theo dõi quy trình thanh toán & giao hàng toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && userBranchId && (
            <span className="px-3 py-1.5 rounded-xl bg-info-pastel text-info-dark border border-info/25 text-xs font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Chi nhánh: {userBranchId}
            </span>
          )}
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
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-success-pastel border border-success/30 text-success-dark text-xs sm:text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Bộ lọc đa tiêu chí */}
      <div className="bg-surface rounded-3xl border border-border p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Tìm kiếm mã đơn */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Tìm theo mã đơn hàng (ID)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9.5 text-xs h-10 rounded-xl"
            />
          </div>

          {/* Lọc theo trạng thái */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="SHIPPED">Đang giao / Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Lọc theo chi nhánh (CHỈ HIỆN CHO ADMIN) */}
          {isAdmin ? (
            <div>
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center px-3 h-10 rounded-xl bg-surface-soft border border-border text-xs text-muted font-medium">
              <span>Khoá chi nhánh: <b>{userBranchId}</b></span>
            </div>
          )}
        </div>

        {/* Lọc theo khoảng ngày */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-border/80 text-xs">
          <span className="font-semibold text-muted flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            Lọc theo ngày tạo:
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="Từ ngày"
            />
            <span className="text-muted">&rarr;</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="Đến ngày"
            />
          </div>

          {(fromDate || toDate || search || statusFilter !== "ALL" || (isAdmin && branchFilter !== "ALL")) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                if (isAdmin) setBranchFilter("ALL");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="text-xs text-danger-dark hover:underline font-semibold ml-auto"
            >
              Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="text-xs">
            Thử lại
          </Button>
        </div>
      )}

      {/* Bảng / Danh sách thẻ đơn hàng */}
      <div className="bg-surface border border-border rounded-3xl shadow-card overflow-hidden">
        {/* Mobile Order Cards (md:hidden) */}
        <div className="md:hidden divide-y divide-border/60">
          {loading && (
            <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh sách đơn hàng...</span>
            </div>
          )}

          {!loading && (!data || data.items.length === 0) && (
            <div className="p-8 text-center text-xs text-muted">
              Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
            </div>
          )}

          {!loading &&
            data &&
            data.items.map((order) => {
              return (
                <div key={order.id} className="p-4 space-y-3 bg-surface hover:bg-surface-soft/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailOrder(order)}
                        className="font-mono font-bold text-sm text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                        title="Xem chi tiết đơn hàng"
                      >
                        #{order.id.slice(0, 13)}...
                      </button>
                      <p className="text-[11px] text-muted">{order.payment_method} &bull; {order.branch_id || "Chưa gán chi nhánh"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <PaymentStatusBadge
                        status={order.status}
                        onClick={() => {
                          setStatusActionError("");
                          setViewingPaymentOrder(order);
                        }}
                      />
                      <DeliveryStatusBadge
                        status={order.status}
                        onClick={() => {
                          setStatusActionError("");
                          setSelectedDeliveryStatus(order.status);
                          setViewingDeliveryOrder(order);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-surface-soft border border-border/60">
                    <div>
                      <span className="text-[10px] text-muted block">Thời gian</span>
                      <span className="font-medium text-foreground">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted block">Tổng tiền</span>
                      <strong className="text-sm font-black text-primary-dark font-mono">
                        {formatCurrency(Number(order.total_amount))}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-muted truncate max-w-[180px]">
                      Khách: {order.user_id ? order.user_id.slice(0, 10) + "..." : "Khách lẻ"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDetailOrder(order)}
                      className="h-7 px-2.5 text-xs text-primary font-semibold cursor-pointer"
                    >
                      Chi tiết &rarr;
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold text-muted uppercase bg-surface-soft border-b border-border">
              <tr>
                <th className="px-5 py-4">Mã đơn</th>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Chi nhánh</th>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4 text-right">Tổng tiền</th>
                <th className="px-5 py-4 text-center">Trạng thái thanh toán</th>
                <th className="px-5 py-4 text-center">Trạng thái giao hàng</th>
                <th className="px-5 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách đơn hàng...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && (!data || data.items.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">
                    <p className="font-semibold text-foreground">Không tìm thấy đơn hàng nào</p>
                    <p className="text-xs mt-1">Vui lòng điều chỉnh lại bộ lọc hoặc tìm kiếm.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                data &&
                data.items.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-surface-soft/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-foreground">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="hover:text-primary transition-colors text-left font-mono font-bold cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          #{order.id.slice(0, 13)}...
                        </button>
                        <span className="block text-[10px] text-muted font-normal">
                          {order.payment_method}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground block truncate max-w-[140px]">
                          {order.user_id}
                        </span>
                        <span className="text-muted text-[10px]">
                          {order.items?.length || 0} món
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-surface-soft border border-border text-[11px]">
                          {order.branch_id}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-muted whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right font-extrabold text-primary-dark">
                        {formatCurrency(order.total_amount)}
                      </td>

                      {/* Cột Trạng thái thanh toán */}
                      <td className="px-5 py-4 text-center">
                        <PaymentStatusBadge
                          status={order.status}
                          onClick={() => {
                            setStatusActionError("");
                            setViewingPaymentOrder(order);
                          }}
                        />
                      </td>

                      {/* Cột Trạng thái giao hàng */}
                      <td className="px-5 py-4 text-center">
                        <DeliveryStatusBadge
                          status={order.status}
                          onClick={() => {
                            setStatusActionError("");
                            setSelectedDeliveryStatus(order.status);
                            setViewingDeliveryOrder(order);
                          }}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="h-7 px-2 text-xs cursor-pointer"
                          title="Xem chi tiết đơn hàng (Cửa sổ)"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Trang <b>{data.page}</b> / <b>{data.totalPages}</b> (Tổng <b>{data.total}</b> đơn)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                &larr; Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              >
                Sau &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* GIAO DIỆN / MODAL CHI TIẾT TRẠNG THÁI GIAO HÀNG */}
      {viewingDeliveryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/30 flex items-center justify-center text-primary">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Trạng thái giao hàng</h3>
                  <p className="text-xs text-muted font-mono">
                    Mã đơn: #{viewingDeliveryOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDeliveryOrder(null)}
                className="p-1 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Timeline Tiến trình giao hàng */}
            {viewingDeliveryOrder.status === "CANCELLED" ? (
              <div className="p-3.5 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark text-xs flex items-center gap-2.5">
                <XCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Đơn hàng này đã bị hủy</p>
                  <p className="text-[11px] opacity-90 mt-0.5">Không tiến hành đóng gói hay giao hàng.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-soft border border-border/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  Tiến trình vận chuyển
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  {[
                    { label: "Tiếp nhận", status: "PENDING", icon: Clock },
                    { label: "Chuẩn bị", status: "CONFIRMED", icon: Package },
                    { label: "Đang giao", status: "PAID", icon: Truck },
                    { label: "Đã giao", status: "SHIPPED", icon: CheckCircle2 },
                  ].map((step, idx) => {
                    const stepWeights: Record<string, number> = {
                      PENDING: 1,
                      CONFIRMED: 2,
                      PAID: 3,
                      SHIPPED: 4,
                    };
                    const currentWeight = stepWeights[viewingDeliveryOrder.status] || 1;
                    const stepWeight = stepWeights[step.status];
                    const isDone = currentWeight >= stepWeight;
                    const isCurrent = currentWeight === stepWeight;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-primary text-white shadow-xs ring-4 ring-primary-tint"
                              : isDone
                              ? "bg-primary-tint text-primary-dark font-bold"
                              : "bg-surface border border-border text-muted"
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`mt-1.5 font-medium ${isCurrent ? "text-primary-dark font-bold" : isDone ? "text-foreground" : "text-muted"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thông tin vận đơn */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-soft p-4 rounded-2xl border border-border">
              <div>
                <span className="text-[11px] text-muted block">Mã vận đơn</span>
                <span className="font-mono font-bold text-foreground">
                  VN-CSM-{viewingDeliveryOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Đơn vị vận chuyển</span>
                <span className="font-semibold text-foreground">CSM Express Delivery</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Chi nhánh gửi</span>
                <span className="font-semibold text-foreground">{viewingDeliveryOrder.branch_id}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Khách hàng nhận</span>
                <span className="font-medium text-foreground truncate block max-w-[150px]">
                  {viewingDeliveryOrder.user_id}
                </span>
              </div>
            </div>

            {/* Bộ điều khiển cập nhật trạng thái giao hàng */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground block">
                Cập nhật trạng thái giao hàng:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant={selectedDeliveryStatus === "CONFIRMED" ? "default" : "outline"}
                  onClick={() => setSelectedDeliveryStatus("CONFIRMED")}
                  className="text-xs h-8 font-semibold"
                >
                  Chuẩn bị hàng
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={selectedDeliveryStatus === "PAID" ? "default" : "outline"}
                  onClick={() => setSelectedDeliveryStatus("PAID")}
                  className="text-xs h-8 font-semibold"
                >
                  Đang giao
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={selectedDeliveryStatus === "SHIPPED" ? "default" : "outline"}
                  onClick={() => setSelectedDeliveryStatus("SHIPPED")}
                  className="text-xs h-8 font-semibold"
                >
                  Đã giao hàng
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={selectedDeliveryStatus === "CANCELLED" ? "destructive" : "outline"}
                  onClick={() => setSelectedDeliveryStatus("CANCELLED")}
                  className="text-xs h-8 font-semibold"
                >
                  Hủy đơn
                </Button>
              </div>
            </div>

            {statusActionError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusActionError}</span>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const target = viewingDeliveryOrder;
                  setViewingDeliveryOrder(null);
                  setSelectedDetailOrder(target);
                }}
                className="text-xs text-primary font-semibold gap-1 cursor-pointer"
              >
                <span>Xem chi tiết cửa sổ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => setViewingDeliveryOrder(null)}
                >
                  Đóng
                </Button>
                {selectedDeliveryStatus && selectedDeliveryStatus !== viewingDeliveryOrder.status && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(viewingDeliveryOrder.id, selectedDeliveryStatus)}
                    className="shadow-sm"
                  >
                    {isUpdatingStatus ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GIAO DIỆN / MODAL CHI TIẾT TRẠNG THÁI THANH TOÁN */}
      {viewingPaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/30 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Trạng thái thanh toán</h3>
                  <p className="text-xs text-muted font-mono">
                    Mã đơn: #{viewingPaymentOrder.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPaymentOrder(null)}
                className="p-1 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin thanh toán */}
            <div className="space-y-3 bg-surface-soft p-4 rounded-2xl border border-border text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/80">
                <span className="text-muted">Tổng tiền đơn hàng:</span>
                <span className="text-base font-extrabold text-primary-dark font-mono">
                  {formatCurrency(viewingPaymentOrder.total_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Phương thức thanh toán:</span>
                <span className="font-bold text-foreground">{viewingPaymentOrder.payment_method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Tình trạng thanh toán:</span>
                <PaymentStatusBadge status={viewingPaymentOrder.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Thời gian đặt:</span>
                <span className="text-foreground">{formatDate(viewingPaymentOrder.created_at)}</span>
              </div>
            </div>

            {statusActionError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusActionError}</span>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const target = viewingPaymentOrder;
                  setViewingPaymentOrder(null);
                  setSelectedDetailOrder(target);
                }}
                className="text-xs text-primary font-semibold gap-1 cursor-pointer"
              >
                <span>Xem chi tiết cửa sổ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => setViewingPaymentOrder(null)}
                >
                  Đóng
                </Button>
                {viewingPaymentOrder.status !== "PAID" && viewingPaymentOrder.status !== "SHIPPED" && viewingPaymentOrder.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(viewingPaymentOrder.id, "PAID")}
                    className="shadow-sm"
                  >
                    {isUpdatingStatus ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CỬA SỔ XEM CHI TIẾT ĐƠN HÀNG TRỰC TIẾP TRÊN GIAO DIỆN */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={!!selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdatingStatus={isUpdatingStatus}
      />
    </div>
  );
}

export default OrderListPage;
