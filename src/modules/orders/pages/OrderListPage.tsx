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
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, Order, OrderStatus, Paginated } from "../../../api/orderApi";
import { branchApi } from "../../../api/branchApi";
import { Branch } from "../../../types/branch";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: [],
  CANCELLED: [],
};

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

  // Status Change Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
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

  // Xác nhận đổi trạng thái
  const handleConfirmStatusChange = async () => {
    if (!selectedOrder || !targetStatus) return;
    setIsUpdating(true);
    setUpdateError("");

    try {
      const updated = await orderApi.updateOrderStatus(selectedOrder.id, targetStatus);
      // Cập nhật lại trong bảng
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
        };
      });

      setSuccessToast(`Đã chuyển trạng thái đơn #${selectedOrder.id.slice(0, 8)} sang ${targetStatus}`);
      setTimeout(() => setSuccessToast(""), 4000);

      setSelectedOrder(null);
      setTargetStatus(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Cập nhật trạng thái thất bại.";
      setUpdateError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsUpdating(false);
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
            Xử lý quy trình đơn hàng toàn hệ thống theo State Machine & Saga Pattern.
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
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="SHIPPED">Đang giao / Hoàn tất (SHIPPED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
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

      {/* Bảng đơn hàng */}
      <div className="bg-surface border border-border rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold text-muted uppercase bg-surface-soft border-b border-border">
              <tr>
                <th className="px-5 py-4">Mã đơn</th>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Chi nhánh</th>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4 text-right">Tổng tiền</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác State Machine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách đơn hàng...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && (!data || data.items.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <p className="font-semibold text-foreground">Không tìm thấy đơn hàng nào</p>
                    <p className="text-xs mt-1">Vui lòng điều chỉnh lại bộ lọc hoặc tìm kiếm.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                data &&
                data.items.map((order) => {
                  const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
                  const isTerminal = allowedNextStatuses.length === 0;

                  return (
                    <tr key={order.id} className="hover:bg-surface-soft/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-foreground">
                        <Link to={`/orders/${order.id}`} className="hover:text-primary transition-colors">
                          #{order.id.slice(0, 13)}...
                        </Link>
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

                      <td className="px-5 py-4 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Dropdown / Nút đổi trạng thái State Machine */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isTerminal ? (
                            <span className="text-[11px] text-muted italic font-medium px-2 py-1 rounded-md bg-surface-soft">
                              Trạng thái cuối
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {allowedNextStatuses.map((nextSt) => (
                                <button
                                  key={nextSt}
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setTargetStatus(nextSt);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all shadow-xs ${
                                    nextSt === "CONFIRMED"
                                      ? "bg-info-pastel hover:bg-info-pastel/80 text-info-dark border-info/30"
                                      : nextSt === "PAID"
                                      ? "bg-primary-tint hover:bg-primary-tint/80 text-primary-dark border-primary/30"
                                      : nextSt === "SHIPPED"
                                      ? "bg-success-pastel hover:bg-success-pastel/80 text-success-dark border-success/30"
                                      : "bg-danger-pastel hover:bg-danger-pastel/80 text-danger-dark border-danger/30"
                                  }`}
                                >
                                  &rarr; {nextSt}
                                </button>
                              ))}
                            </div>
                          )}

                          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Link to={`/orders/${order.id}`}>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </div>
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

      {/* Modal xác nhận đổi trạng thái đơn hàng */}
      {selectedOrder && targetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-primary-tint border border-primary/30 flex items-center justify-center text-primary font-bold text-xl">
              🔄
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">Xác nhận chuyển trạng thái?</h3>
              <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
                Đơn hàng: <b className="font-mono text-foreground">#{selectedOrder.id}</b>
                <br />
                Chuyển từ <b className="text-foreground">{selectedOrder.status}</b> &rarr;{" "}
                <b className="text-primary-dark">{targetStatus}</b>.
              </p>

              {/* Ghi chú Saga tương ứng */}
              <div className="mt-3 p-3 rounded-xl bg-surface-soft border border-border text-[11px] text-muted space-y-1">
                {selectedOrder.status === "PENDING" && (targetStatus === "CONFIRMED" || targetStatus === "PAID") && (
                  <p className="text-info-dark font-medium">
                    ⚡ Thao tác này sẽ kích hoạt Saga xác nhận trừ tồn kho thực tế (confirm-deduct).
                  </p>
                )}
                {selectedOrder.status === "PENDING" && targetStatus === "CANCELLED" && (
                  <p className="text-danger-dark font-medium">
                    ⚡ Thao tác huỷ đơn PENDING sẽ kích hoạt Saga giải phóng giữ kho (release-stock).
                  </p>
                )}
                {targetStatus === "SHIPPED" && (
                  <p className="text-success-dark font-medium">
                    ⚡ SHIPPED là trạng thái kết thúc cuối cùng, sau khi chuyển sẽ không thể thay đổi hay huỷ đơn.
                  </p>
                )}
              </div>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-danger-pastel text-danger-dark text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                disabled={isUpdating}
                onClick={() => {
                  setSelectedOrder(null);
                  setTargetStatus(null);
                }}
              >
                Huỷ bỏ
              </Button>
              <Button disabled={isUpdating} onClick={handleConfirmStatusChange} className="shadow-sm">
                {isUpdating ? "Đang xử lý..." : "Xác nhận chuyển"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderListPage;
