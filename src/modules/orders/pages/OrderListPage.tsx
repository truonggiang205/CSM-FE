import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Truck,
  CreditCard,
  Package,
  Clock,
  DollarSign,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Lock,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, Order, OrderStatus, Paginated } from "../../../api/orderApi";
import { branchApi } from "../../../api/branchApi";
import { Branch } from "../../../types/branch";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";

type AuthUser = NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;

export function OrderListPage() {
  const { user } = useAuthStore();

  // Chặn khách hàng thông thường không được vào quản trị đơn hàng.
  // Kiểm tra ở component bọc ngoài để mọi hook bên trong luôn được gọi đủ, đúng thứ tự (rules-of-hooks).
  if (!user || user.role === "CUSTOMER") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <OrderListContent user={user} />;
}

function OrderListContent({ user }: { user: AuthUser }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user.role === "ADMIN";
  const userBranchId = user.branch_id;

  // Lấy giá trị bộ lọc từ URL SearchParams (đảm bảo F5 hoặc tải lại không bị mất)
  const statusFilter = searchParams.get("status") || "ALL";
  const branchFilter = isAdmin ? searchParams.get("branchId") || "ALL" : userBranchId || "ALL";
  const searchQuery = searchParams.get("search") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Local state for immediate typing input
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Data states
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toàn bộ đơn hàng để tính số lượng chip đếm
  const [allStatusOrders, setAllStatusOrders] = useState<Order[]>([]);

  // Drawer xem chi tiết đơn hàng
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<Order | null>(null);

  // Trạng thái cập nhật nhanh
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<{
    order: Order;
    targetStatus: OrderStatus;
    title: string;
    description: string;
    isDangerous?: boolean;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Đồng bộ searchInput khi query param thay đổi từ ngoài
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Hàm cập nhật query string trên URL
  const updateQueryParam = useCallback(
    (updates: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === "" || (key === "status" && val === "ALL") || (key === "page" && val === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Tải danh sách chi nhánh
  useEffect(() => {
    branchApi.getBranches().then(setBranches).catch(() => {});
  }, []);

  // Tải danh sách đơn hàng cho bảng chính
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
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (fromDate) params.fromDate = new Date(fromDate).toISOString();
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        params.toDate = d.toISOString();
      }

      const [res, allRes] = await Promise.all([
        orderApi.getAllOrders(params),
        orderApi.getAllOrders({
          limit: 1000,
          ...(isAdmin && branchFilter !== "ALL" ? { branchId: branchFilter } : {}),
        }).catch(() => ({ items: [], total: 0, page: 1, limit: 1000, totalPages: 1 })),
      ]);

      setData(res);
      setAllStatusOrders(allRes.items || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể tải danh sách đơn hàng quản trị.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, branchFilter, searchQuery, fromDate, toDate, isAdmin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Tính số lượng đơn theo từng trạng thái để hiển thị trên Chip
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: allStatusOrders.length,
      PENDING: 0,
      CONFIRMED: 0,
      PAID: 0,
      SHIPPED: 0,
      CANCELLED: 0,
    };
    allStatusOrders.forEach((o) => {
      if (o.status in counts) {
        counts[o.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [allStatusOrders]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  // Tính thời gian tương đối
  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    if (diffMins > 0) return `${diffMins} phút trước`;
    return "vừa xong";
  };

  // Cập nhật trạng thái
  const handleExecuteStatusUpdate = async () => {
    if (!actionConfirm) return;
    const { order, targetStatus } = actionConfirm;
    setIsUpdatingStatus(true);
    try {
      const updated = await orderApi.updateOrderStatus(order.id, targetStatus);
      showToast(`Đã chuyển đơn #${order.id.slice(0, 8)} sang ${targetStatus} thành công!`);

      // Cập nhật state nội bộ
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((o) => (o.id === updated.id ? updated : o)),
        };
      });

      if (selectedDrawerOrder?.id === order.id) {
        setSelectedDrawerOrder(updated);
      }

      setActionConfirm(null);
      await fetchOrders();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Cập nhật trạng thái thất bại.";
      showToast(typeof msg === "string" ? msg : JSON.stringify(msg), "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusTabs: Array<{ id: string; label: string; count: number; color: string }> = [
    { id: "ALL", label: "Tất cả", count: statusCounts.ALL, color: "bg-surface-soft text-foreground" },
    { id: "PENDING", label: "Chờ xác nhận", count: statusCounts.PENDING, color: "bg-warning-pastel text-warning-dark" },
    { id: "CONFIRMED", label: "Đã duyệt kho", count: statusCounts.CONFIRMED, color: "bg-info-pastel text-info-dark" },
    { id: "PAID", label: "Đã thanh toán", count: statusCounts.PAID, color: "bg-pastel-mint text-success-dark" },
    { id: "SHIPPED", label: "Đã giao / Hoàn tất", count: statusCounts.SHIPPED, color: "bg-primary-tint text-primary-dark" },
    { id: "CANCELLED", label: "Đã hủy", count: statusCounts.CANCELLED, color: "bg-danger-pastel text-danger-dark" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast phản hồi */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold transition-all ${
            toastMsg.type === "success"
              ? "bg-pastel-mint border-success/30 text-success-dark"
              : "bg-danger-pastel border-danger/30 text-danger-dark"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-tint text-primary-dark border border-primary/25">
              {isAdmin ? "TOÀN MẠNG LƯỚI" : `CHI NHÁNH: ${userBranchId}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Theo dõi, lọc trạng thái và điều phối xuất kho cho đơn mua sắm trực tuyến của chuỗi cửa hàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            aria-label="Làm mới danh sách đơn"
            className="text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* TABS LỌC NHANH TRẠNG THÁI (KÈM CHIP SỐ LƯỢNG) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => updateQueryParam({ status: tab.id, page: 1 })}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                  : "bg-surface hover:bg-surface-soft text-muted hover:text-foreground border border-border/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  isActive ? "bg-white/20 text-white" : tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC CHI TIẾT */}
      <Card className="p-4 sm:p-5 rounded-3xl border border-border shadow-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Tìm kiếm theo mã đơn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateQueryParam({ search: searchInput.trim(), page: 1 });
            }}
            className="relative md:col-span-2"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Tìm theo mã đơn (ID hoặc UUID)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9.5 text-xs h-10 rounded-xl"
              aria-label="Tìm kiếm theo mã đơn hàng"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateQueryParam({ search: null, page: 1 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Lọc theo chi nhánh (Chỉ Admin chọn được, Manager bị khóa) */}
          {isAdmin ? (
            <div>
              <select
                value={branchFilter}
                onChange={(e) => updateQueryParam({ branchId: e.target.value, page: 1 })}
                aria-label="Lọc theo chi nhánh"
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="ALL">🌐 Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏪 {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center px-3 h-10 rounded-xl bg-surface-soft border border-border text-xs text-muted font-bold">
              <Lock className="w-3.5 h-3.5 text-primary mr-1.5" />
              <span>Khóa chi nhánh: <b>{userBranchId}</b></span>
            </div>
          )}

          {/* Nút Reset bộ lọc */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setSearchParams(new URLSearchParams());
              }}
              className="w-full h-10 rounded-xl text-xs font-semibold"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>

        {/* Lọc theo ngày tạo */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60 text-xs">
          <span className="font-bold text-muted flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Khoảng thời gian:
          </span>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => updateQueryParam({ fromDate: e.target.value, page: 1 })}
              aria-label="Lọc từ ngày"
              className="h-8 px-2.5 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <span className="text-muted font-bold">&rarr;</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => updateQueryParam({ toDate: e.target.value, page: 1 })}
              aria-label="Lọc đến ngày"
              className="h-8 px-2.5 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </Card>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-pastel border border-danger/30 text-danger-dark text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BẢNG DANH SÁCH ĐƠN HÀNG (DỄ QUÉT, TỐI ƯU CẢM ỨNG) */}
      <Card className="rounded-3xl border border-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-soft rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-soft border border-border flex items-center justify-center text-muted">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-foreground text-sm sm:text-base">
              Không tìm thấy đơn hàng nào phù hợp
            </h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm, chuyển tab trạng thái khác hoặc đặt lại bộ lọc ngày.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Bảng quản lý đơn hàng">
              <thead className="bg-surface-soft/80 border-b border-border/80 text-[11px] font-black uppercase text-muted tracking-wider">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Mã đơn</th>
                  <th scope="col" className="py-3.5 px-4">Thời gian</th>
                  <th scope="col" className="py-3.5 px-4">Chi nhánh</th>
                  <th scope="col" className="py-3.5 px-4">Thanh toán</th>
                  <th scope="col" className="py-3.5 px-4">Tổng tiền (VND)</th>
                  <th scope="col" className="py-3.5 px-4">Trạng thái</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((order) => {
                  const branch = branches.find((b) => b.id === order.branch_id);
                  const branchName = branch ? branch.name : order.branch_id;
                  const isoDate = new Date(order.created_at).toLocaleString("vi-VN");

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-soft/60 transition-colors group"
                    >
                      {/* Mã đơn */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-foreground">
                        <button
                          onClick={() => setSelectedDrawerOrder(order)}
                          className="hover:text-primary transition-colors cursor-pointer text-left font-mono"
                          title="Bấm để mở ngăn kéo chi tiết"
                        >
                          #{order.id.slice(0, 8)}
                        </button>
                      </td>

                      {/* Thời gian tương đối kèm tooltip đầy đủ */}
                      <td className="py-3.5 px-4" title={isoDate}>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{getTimeAgo(order.created_at)}</span>
                          <span className="text-[11px] text-muted">{new Date(order.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </td>

                      {/* Chi nhánh */}
                      <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[140px]">
                        {branchName}
                      </td>

                      {/* Phương thức thanh toán */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-surface-soft border border-border/80 font-bold text-muted text-[11px]">
                          {order.payment_method}
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 font-black text-primary-dark text-sm">
                        <div>{formatCurrency(Number(order.total_amount) || 0)}</div>
                        {Number(order.discount_amount) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold font-mono">
                            Voucher: -{formatCurrency(Number(order.discount_amount))}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDrawerOrder(order)}
                            className="rounded-xl text-xs font-bold text-muted hover:text-foreground flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Chi tiết</span>
                          </Button>

                          {order.status === "PENDING" && (
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isUpdatingStatus}
                              onClick={() =>
                                setActionConfirm({
                                  order,
                                  targetStatus: "CONFIRMED",
                                  title: `Duyệt đơn #${order.id.slice(0, 8)}?`,
                                  description: "Hệ thống sẽ gọi Saga trừ tồn kho thực tế (confirm-deduct).",
                                })
                              }
                              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white px-2.5"
                            >
                              Duyệt
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHÂN TRANG */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border/80 flex items-center justify-between text-xs bg-surface-soft/40">
            <span className="text-muted">
              Hiển thị trang <strong>{data.page}</strong> / <strong>{data.totalPages}</strong> ({data.total} đơn)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => updateQueryParam({ page: data.page - 1 })}
                className="rounded-xl h-8 text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => updateQueryParam({ page: data.page + 1 })}
                className="rounded-xl h-8 text-xs font-bold flex items-center gap-1"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* NGĂN KÉO (DRAWER) CHI TIẾT ĐƠN HÀNG */}
      {selectedDrawerOrder && (
        <OrderDetailDrawer
          isOpen={Boolean(selectedDrawerOrder)}
          onClose={() => setSelectedDrawerOrder(null)}
          order={selectedDrawerOrder}
          branchName={branches.find((b) => b.id === selectedDrawerOrder.branch_id)?.name}
          onUpdateStatus={async (orderId, targetStatus) => {
            const orderToUpdate = data?.items.find((o) => o.id === orderId) || selectedDrawerOrder;
            if (orderToUpdate) {
              setActionConfirm({
                order: orderToUpdate,
                targetStatus,
                title: `Xác nhận chuyển trạng thái sang ${targetStatus}?`,
                description: `Cập nhật trạng thái đơn #${orderId.slice(0, 8)} sang ${targetStatus}.`,
                isDangerous: targetStatus === "CANCELLED",
              });
            }
          }}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}

      {/* MODAL XÁC NHẬN HÀNH ĐỘNG HẬU QUẢ NGHIỆP VỤ */}
      {actionConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                {actionConfirm.isDangerous ? (
                  <AlertCircle className="w-5 h-5 text-danger" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
                {actionConfirm.title}
              </h3>
              <button
                onClick={() => setActionConfirm(null)}
                className="text-muted hover:text-foreground"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {actionConfirm.description}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionConfirm(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>

              <Button
                variant={actionConfirm.isDangerous ? "destructive" : "default"}
                size="sm"
                disabled={isUpdatingStatus}
                onClick={handleExecuteStatusUpdate}
                className="rounded-xl text-xs font-bold"
              >
                {isUpdatingStatus ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Xác nhận thực hiện"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
