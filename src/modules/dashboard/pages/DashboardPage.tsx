import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  RefreshCw,
  Calendar,
  Building2,
  Lock,
  ExternalLink,
  Store,
  ChevronDown,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OrderStatusBadge } from "../../orders/components/OrderStatusBadge";
import { OrderDetailModal } from "../../orders/components/OrderDetailModal";
import { orderApi, Order, OrderStatus } from "../../../api/orderApi";
import { authApi, UserProfile } from "../../../api/authApi";
import { branchApi } from "../../../api/branchApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { productApi } from "../../../api/productApi";
import { Branch } from "../../../types/branch";
import { useAuthStore } from "../../../store/useAuthStore";
import { RestockModal } from "../../inventory/components/RestockModal";

export type DashboardPeriod = "7_DAYS" | "30_DAYS" | "MONTH" | "YEAR" | "CUSTOM";

export interface LowStockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  branchName: string;
  quantity: number;
  reserved: number;
  available: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
}

// Custom Tooltip cho biểu đồ Recharts (khai báo ngoài component để không tạo lại mỗi lần render)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-lg space-y-1.5 text-xs">
        <p className="font-bold text-foreground">{data.label}</p>
        <p className="font-extrabold text-primary-dark">
          Doanh thu PAID:{" "}
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.revenue)}
        </p>
        <p className="font-semibold text-muted">Tổng đơn: {data.orders} đơn</p>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "BRANCH_MANAGER";
  const userBranchId = user?.branch_id;

  // Branch filter state (Admin can switch, Manager is locked)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isManager && userBranchId ? userBranchId : "ALL"
  );

  const [metricView, setMetricView] = useState<"revenue" | "orders">("revenue");
  const [period, setPeriod] = useState<DashboardPeriod>("7_DAYS");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allLowStockItems, setAllLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Modal xem chi tiết đơn hàng
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Modal xác nhận chuyển trạng thái nhanh
  const [actionConfirmOrder, setActionConfirmOrder] = useState<{
    order: Order;
    targetStatus: OrderStatus;
    title: string;
    description: string;
    isDangerous?: boolean;
  } | null>(null);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal nhập kho nhanh
  const [restockItem, setRestockItem] = useState<{ branch: Branch; productId: string } | null>(null);
  const [productsList, setProductsList] = useState<any[]>([]);

  // Đảm bảo Manager luôn bị khóa chi nhánh
  useEffect(() => {
    if (isManager && userBranchId) {
      setSelectedBranchId(userBranchId);
    }
  }, [isManager, userBranchId]);

  // Thông báo toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionToast({ type, text });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Tải dữ liệu toàn hệ thống
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, branchesRes, productsRes] = await Promise.all([
        orderApi.getAllOrders({ limit: 1000 }).catch((e) => {
          console.error("Lỗi tải danh sách đơn hàng:", e);
          return { items: [], total: 0, page: 1, limit: 1000, totalPages: 1 };
        }),
        authApi.getUsers().catch(() => []),
        branchApi.getBranches().catch(() => []),
        productApi.getProducts().catch(() => []),
      ]);

      setAllOrders(ordersRes.items || []);
      setUsers(usersRes || []);
      setBranches(branchesRes || []);
      setProductsList(productsRes || []);

      const productMap = new Map<string, any>();
      productsRes.forEach((p) => {
        if (p.id) productMap.set(String(p.id), p);
        if (p.sku) productMap.set(String(p.sku), p);
      });

      // Lấy danh sách tồn kho thực tế của các chi nhánh để tính SKU sắp hết (<= 5)
      const warnings: LowStockItem[] = [];
      if (branchesRes && branchesRes.length > 0) {
        const invPromises = branchesRes.map((b) =>
          inventoryApi.getInventoryByBranch(b.id).catch(() => [])
        );
        const invLists = await Promise.all(invPromises);
        invLists.forEach((branchStock, idx) => {
          const bId = branchesRes[idx].id;
          const bName = branchesRes[idx].name;
          branchStock.forEach((item) => {
            const avail =
              typeof item.available === "number"
                ? item.available
                : Number(item.quantity) - Number(item.reserved_quantity);
            if (avail <= 5) {
              const prod =
                productMap.get(String(item.product_id)) ||
                (item.sku ? productMap.get(String(item.sku)) : undefined);
              warnings.push({
                id: item.id || `${bId}-${item.product_id}`,
                productId: String(item.product_id),
                productName:
                  prod?.name ||
                  item.product_name ||
                  `Sản phẩm ${String(item.product_id).slice(0, 8)}`,
                sku:
                  item.sku ||
                  prod?.sku ||
                  `SKU-${String(item.product_id).slice(0, 6)}`,
                branchId: bId,
                branchName: bName,
                quantity: Number(item.quantity) || 0,
                reserved: Number(item.reserved_quantity) || 0,
                available: Math.max(0, avail),
                status: avail <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
              });
            }
          });
        });
      }
      setAllLowStockItems(warnings);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lọc dữ liệu theo Chi nhánh đã chọn hoặc theo vai trò Manager
  const activeBranchName = useMemo(() => {
    if (isManager && userBranchId) {
      const b = branches.find((br) => br.id === userBranchId);
      return b ? b.name : `Chi nhánh ${userBranchId}`;
    }
    if (selectedBranchId !== "ALL") {
      const b = branches.find((br) => br.id === selectedBranchId);
      return b ? b.name : "Chi nhánh đã chọn";
    }
    return "Toàn chuỗi hệ thống";
  }, [isManager, userBranchId, selectedBranchId, branches]);

  const orders = useMemo(() => {
    if (isManager && userBranchId) {
      return allOrders.filter((o) => o.branch_id === userBranchId);
    }
    if (selectedBranchId !== "ALL") {
      return allOrders.filter((o) => o.branch_id === selectedBranchId);
    }
    return allOrders;
  }, [allOrders, isManager, userBranchId, selectedBranchId]);

  const lowStockItems = useMemo(() => {
    if (isManager && userBranchId) {
      return allLowStockItems.filter((i) => i.branchId === userBranchId);
    }
    if (selectedBranchId !== "ALL") {
      return allLowStockItems.filter((i) => i.branchId === selectedBranchId);
    }
    return allLowStockItems;
  }, [allLowStockItems, isManager, userBranchId, selectedBranchId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Đơn hàng cần xử lý ngay (PENDING hoặc CONFIRMED)
  const urgentOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "PENDING" || o.status === "CONFIRMED")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  // Thực thi cập nhật trạng thái đơn hàng
  const handleExecuteStatusUpdate = async () => {
    if (!actionConfirmOrder) return;
    const { order, targetStatus } = actionConfirmOrder;
    setIsUpdatingStatusId(order.id);
    try {
      await orderApi.updateOrderStatus(order.id, targetStatus);
      showToast(
        `Đã chuyển trạng thái đơn #${order.id.slice(0, 8)} thành công sang ${targetStatus}!`
      );
      setActionConfirmOrder(null);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể chuyển trạng thái.";
      showToast(msg, "error");
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  // Tính toán số liệu thống kê & biểu đồ theo kỳ đã chọn (100% dữ liệu thật, không số giả)
  const {
    statsList,
    chartPoints,
    periodSummary,
    chartTitle,
  } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;

    // 1. Thống kê hôm nay & hôm qua
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).getTime() >= startOfToday
    );
    // DOANH THU THẬT: Chỉ tính từ các đơn hàng ĐÃ THANH TOÁN (PAID)
    const todayPaidOrders = todayOrders.filter((o) => o.status === "PAID");
    const todayPaidRevenue = todayPaidOrders.reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0),
      0
    );

    const yesterdayOrders = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= startOfYesterday && t < startOfToday;
    });
    const yesterdayPaidOrders = yesterdayOrders.filter((o) => o.status === "PAID");
    const yesterdayPaidRevenue = yesterdayPaidOrders.reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0),
      0
    );

    // Tính trend thật (chỉ tính khi có số liệu hôm qua > 0)
    let revTrendText = "Hôm qua: 0 ₫";
    let revIsPositive: boolean | undefined = undefined;
    if (yesterdayPaidRevenue > 0) {
      const diff = ((todayPaidRevenue - yesterdayPaidRevenue) / yesterdayPaidRevenue) * 100;
      revTrendText = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}% vs hôm qua`;
      revIsPositive = diff >= 0;
    }

    let orderTrendText = "Hôm qua: 0 đơn";
    let orderIsPositive: boolean | undefined = undefined;
    if (yesterdayOrders.length > 0) {
      const diff = ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100;
      orderTrendText = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}% vs hôm qua`;
      orderIsPositive = diff >= 0;
    }

    // Đơn chờ xử lý (PENDING hoặc CONFIRMED)
    const pendingCount = orders.filter((o) => o.status === "PENDING").length;
    const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
    const totalProcessing = pendingCount + confirmedCount;

    // Tồn kho cảnh báo
    const outCount = lowStockItems.filter((i) => i.status === "OUT_OF_STOCK").length;
    const lowCount = lowStockItems.filter((i) => i.status === "LOW_STOCK").length;
    const totalWarn = lowStockItems.length;

    const statsCards = [
      {
        name: "Đơn hàng hôm nay",
        value: `${todayOrders.length} đơn`,
        rawNumber: `${todayOrders.length} đơn đặt trong ngày`,
        icon: ShoppingBag,
        trend: orderTrendText,
        isPositive: orderIsPositive,
        bg: "bg-primary-tint",
        text: "text-primary-dark",
        border: "border-primary/20",
      },
      {
        name: "Đơn chờ xử lý",
        value: `${totalProcessing} đơn`,
        rawNumber: `${pendingCount} Chờ xác nhận • ${confirmedCount} Đã duyệt`,
        icon: Clock,
        trend: totalProcessing > 0 ? "Cần thao tác ngay" : "Đã xử lý hết",
        isPositive: totalProcessing === 0,
        bg: totalProcessing > 0 ? "bg-warning-pastel" : "bg-pastel-mint",
        text: totalProcessing > 0 ? "text-warning-dark" : "text-success-dark",
        border: totalProcessing > 0 ? "border-warning/30" : "border-success/30",
        anchorId: "urgent-orders-block",
        subtext: "cuộn tới danh sách",
      },
      {
        name: "Doanh thu hôm nay (Đơn PAID)",
        value: formatCurrency(todayPaidRevenue),
        rawNumber: `${todayPaidOrders.length} đơn đã thu tiền`,
        icon: DollarSign,
        trend: revTrendText,
        isPositive: revIsPositive,
        bg: "bg-accent-tint",
        text: "text-accent-dark",
        border: "border-accent/20",
      },
      {
        name: "Cảnh báo kho hàng",
        value: totalWarn === 0 ? "An toàn" : `${totalWarn} mặt hàng`,
        rawNumber:
          totalWarn === 0
            ? "Tồn kho các mặt hàng > 5"
            : `${outCount > 0 ? `${outCount} hết hàng • ` : ""}${lowCount} sắp hết (≤5)`,
        icon: AlertTriangle,
        trend: totalWarn === 0 ? "Kho ổn định" : `${totalWarn} SKU cần nhập`,
        isPositive: totalWarn === 0,
        bg: totalWarn === 0 ? "bg-pastel-mint" : "bg-danger-pastel",
        text: totalWarn === 0 ? "text-success-dark" : "text-danger-dark",
        border: totalWarn === 0 ? "border-success/30" : "border-danger/30",
        anchorId: "stock-alerts-block",
        subtext: "cuộn tới danh sách",
      },
    ];

    // 2. Tạo dữ liệu biểu đồ và tiêu đề theo Bộ lọc thời gian
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    let points: Array<{
      label: string;
      shortLabel: string;
      date: string;
      revenue: number;
      orders: number;
    }> = [];
    let titleStr = "";

    if (period === "7_DAYS") {
      titleStr = metricView === "revenue" ? "Doanh Thu 7 Ngày Qua (Đơn PAID)" : "Lượng Đơn Hàng 7 Ngày Qua";
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const startDay = d.getTime();
        const endDay = startDay + 86400000;

        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startDay && t < endDay;
        });

        const dayRev = dayOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const dayName = i === 0 ? "Hôm nay" : dayNames[d.getDay()];
        const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

        points.push({
          label: `${dayName} (${dateStr})`,
          shortLabel: dayName,
          date: dateStr,
          revenue: dayRev,
          orders: dayOrders.length,
        });
      }
    } else if (period === "30_DAYS") {
      titleStr = metricView === "revenue" ? "Doanh Thu 30 Ngày Gần Nhất (Đơn PAID)" : "Lượng Đơn Hàng 30 Ngày Gần Nhất";
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const startDay = d.getTime();
        const endDay = startDay + 86400000;

        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startDay && t < endDay;
        });

        const dayRev = dayOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

        points.push({
          label: `Ngày ${dateStr}`,
          shortLabel: dateStr,
          date: dateStr,
          revenue: dayRev,
          orders: dayOrders.length,
        });
      }
    } else if (period === "MONTH") {
      titleStr =
        metricView === "revenue"
          ? `Doanh Thu Theo 12 Tháng Năm ${selectedYear} (Đơn PAID)`
          : `Lượng Đơn Hàng Theo 12 Tháng Năm ${selectedYear}`;

      for (let m = 0; m < 12; m++) {
        const monthOrders = orders.filter((o) => {
          const d = new Date(o.created_at);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        const monthRev = monthOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        points.push({
          label: `Tháng ${m + 1}/${selectedYear}`,
          shortLabel: `T${m + 1}`,
          date: `T${m + 1}`,
          revenue: monthRev,
          orders: monthOrders.length,
        });
      }
    } else if (period === "YEAR") {
      titleStr = metricView === "revenue" ? "Doanh Thu Theo Các Năm (Đơn PAID)" : "Lượng Đơn Hàng Theo Các Năm";
      const curYear = now.getFullYear();
      const years = [curYear - 3, curYear - 2, curYear - 1, curYear];

      points = years.map((y) => {
        const yearOrders = orders.filter((o) => new Date(o.created_at).getFullYear() === y);
        const yearRev = yearOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        return {
          label: `Năm ${y}`,
          shortLabel: `${y}`,
          date: `${y}`,
          revenue: yearRev,
          orders: yearOrders.length,
        };
      });
    } else if (period === "CUSTOM") {
      const from = customFromDate
        ? new Date(customFromDate).getTime()
        : startOfToday - 6 * 86400000;
      const to = customToDate
        ? new Date(customToDate).setHours(23, 59, 59, 999)
        : startOfToday + 86400000;

      titleStr =
        metricView === "revenue"
          ? `Doanh Thu (${customFromDate || "..."} đến ${customToDate || "..."}) (Đơn PAID)`
          : `Lượng Đơn Hàng (${customFromDate || "..."} đến ${customToDate || "..."})`;

      const diffDays = Math.max(1, Math.min(60, Math.ceil((to - from) / 86400000)));

      for (let i = 0; i < diffDays; i++) {
        const cur = new Date(from + i * 86400000);
        const startDay = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).getTime();
        const endDay = startDay + 86400000;

        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startDay && t < endDay;
        });

        const dayRev = dayOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const dateStr = `${String(cur.getDate()).padStart(2, "0")}/${String(cur.getMonth() + 1).padStart(2, "0")}`;

        points.push({
          label: `Ngày ${dateStr}`,
          shortLabel: dateStr,
          date: dateStr,
          revenue: dayRev,
          orders: dayOrders.length,
        });
      }
    }

    // 3. Tổng kết số liệu theo khoảng thời gian được chọn
    const totalPeriodRevenue = points.reduce((sum, p) => sum + p.revenue, 0);
    const totalPeriodOrders = points.reduce((sum, p) => sum + p.orders, 0);
    const aov = totalPeriodOrders > 0 ? totalPeriodRevenue / totalPeriodOrders : 0;

    return {
      statsList: statsCards,
      chartPoints: points,
      periodSummary: {
        totalRevenue: totalPeriodRevenue,
        totalOrders: totalPeriodOrders,
        aov,
      },
      chartTitle: titleStr,
    };
  }, [orders, lowStockItems, period, selectedYear, customFromDate, customToDate, metricView]);

  // Cuộn mượt đến anchor
  const scrollToAnchor = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast thông báo */}
      {actionToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold transition-all ${
            actionToast.type === "success"
              ? "bg-pastel-mint border-success/30 text-success-dark"
              : "bg-danger-pastel border-danger/30 text-danger-dark"
          }`}
        >
          {actionToast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{actionToast.text}</span>
          <button
            onClick={() => setActionToast(null)}
            className="ml-2 text-muted hover:text-foreground"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header: Phân quyền vai trò & Chọn chi nhánh */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={isAdmin ? "primary" : "secondary"} className="font-bold tracking-wide">
              {isAdmin ? "👑 QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN)" : "🏪 QUẢN LÝ CỬA HÀNG (MANAGER)"}
            </Badge>

            {/* Hiển thị chi nhánh rõ ràng */}
            {isManager ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-tint text-primary-dark border border-primary/25 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Chi nhánh phụ trách: {activeBranchName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-soft text-foreground border border-border">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Đang xem: {activeBranchName}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Bảng Điều Khiển Vận Hành
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Theo dõi tức thời đơn hàng cần xử lý, doanh thu đơn hoàn tất và cảnh báo tồn kho theo thời gian thực.
          </p>
        </div>

        {/* Nút thao tác & Bộ lọc chi nhánh (Nếu là Admin) */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-border shadow-xs">
              <span className="text-xs font-bold text-muted px-2.5 hidden sm:inline">Chi nhánh:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                aria-label="Lọc chi nhánh vận hành"
                className="bg-transparent text-xs font-bold text-foreground py-1.5 px-2 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="ALL">🌐 Toàn chuỗi (Tất cả chi nhánh)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏪 {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            aria-label="Làm mới dữ liệu dashboard"
            className="rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs hover:border-primary/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ chỉ số kinh doanh chính (100% dữ liệu API thật) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-surface p-5 rounded-3xl border border-border/70 shadow-card animate-pulse space-y-3"
              >
                <div className="h-4 w-24 bg-surface-soft rounded-lg" />
                <div className="h-7 w-32 bg-surface-soft rounded-xl" />
                <div className="h-3 w-28 bg-surface-soft rounded-lg" />
              </div>
            ))
          : statsList.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={i}
                  onClick={() => stat.anchorId && scrollToAnchor(stat.anchorId)}
                  className={`p-5 rounded-3xl border ${stat.border} shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden ${
                    stat.anchorId ? "cursor-pointer group" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted uppercase tracking-wider">{stat.name}</p>
                      <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {stat.value}
                      </h3>
                      <p className="text-[11px] font-semibold text-muted/90 truncate">{stat.rawNumber}</p>
                    </div>

                    <div
                      className={`w-11 h-11 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center shrink-0 shadow-xs border ${stat.border}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        stat.isPositive === true
                          ? "text-success-dark"
                          : stat.isPositive === false
                          ? "text-danger-dark"
                          : "text-muted"
                      }`}
                    >
                      {stat.isPositive === true && <TrendingUp className="w-3.5 h-3.5" />}
                      {stat.isPositive === false && <TrendingDown className="w-3.5 h-3.5" />}
                      {stat.trend}
                    </span>

                    {stat.subtext && (
                      <span className="text-[11px] font-bold text-primary group-hover:underline">
                        {stat.subtext} &darr;
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
      </div>

      {/* KHỐI 1: CẦN XỬ LÝ NGAY (Ưu tiên vận hành cao nhất) */}
      <section id="urgent-orders-block" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                Đơn Hàng Cần Xử Lý Ngay ({urgentOrders.length})
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              Các đơn hàng mới đang chờ duyệt (PENDING) hoặc đã duyệt cần xuất kho/giao hàng (CONFIRMED)
            </p>
          </div>

          <Link
            to="/admin/orders?status=PENDING"
            className="text-xs font-bold text-primary-dark hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Xem toàn bộ đơn hàng &rarr;
          </Link>
        </div>

        {urgentOrders.length === 0 ? (
          <Card className="p-8 text-center rounded-3xl border border-success/30 bg-pastel-mint/30 shadow-card">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-mint border border-success/30 flex items-center justify-center text-success-dark mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-foreground text-sm sm:text-base">
              🎉 Tuyệt vời! Hiện không có đơn hàng nào cần xử lý ngay
            </h4>
            <p className="text-xs text-muted max-w-md mx-auto mt-1">
              Toàn bộ các đơn hàng đã được xác nhận hoặc hoàn tất. Hệ thống sẵn sàng tiếp nhận các đơn mới từ khách hàng.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {urgentOrders.slice(0, 6).map((order) => {
              const branch = branches.find((b) => b.id === order.branch_id);
              const branchLabel = branch ? branch.name : order.branch_id;
              const isUpdating = isUpdatingStatusId === order.id;

              return (
                <Card
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Thông tin đơn */}
                  <div
                    onClick={() => setSelectedDetailOrder(order)}
                    className="flex-1 cursor-pointer space-y-1.5 min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-extrabold text-sm text-foreground hover:text-primary">
                        #{order.id.slice(0, 8)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-surface-soft text-muted border border-border">
                        {order.payment_method}
                      </span>
                      <span className="text-xs text-muted">
                        • {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {" "}({new Date(order.created_at).toLocaleDateString("vi-VN")})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span>
                        Chi nhánh: <strong className="text-foreground">{branchLabel}</strong>
                      </span>
                      <span>
                        Sản phẩm: <strong className="text-foreground">{order.items?.length || 0} món</strong>
                      </span>
                      <span>
                        Tổng tiền:{" "}
                        <strong className="text-primary-dark font-extrabold text-sm">
                          {formatCurrency(Number(order.total_amount) || 0)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động nhanh theo State Machine */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDetailOrder(order)}
                      className="rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                    >
                      Chi tiết
                    </Button>

                    {/* Actions cho PENDING */}
                    {order.status === "PENDING" && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            setActionConfirmOrder({
                              order,
                              targetStatus: "CANCELLED",
                              title: `Hủy đơn hàng #${order.id.slice(0, 8)}?`,
                              description:
                                "Thao tác này sẽ hủy đơn và gọi Saga giải phóng số lượng giữ chỗ (release-stock) tại kho chi nhánh.",
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
                          disabled={isUpdating}
                          onClick={() =>
                            setActionConfirmOrder({
                              order,
                              targetStatus: "CONFIRMED",
                              title: `Xác nhận đơn hàng #${order.id.slice(0, 8)}?`,
                              description:
                                "Xác nhận đơn hàng sẽ thực thi Saga trừ tồn kho thực tế (confirm-deduct) tại Inventory Service.",
                            })
                          }
                          className="rounded-xl text-xs font-bold flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Xác nhận đơn
                        </Button>
                      </>
                    )}

                    {/* Actions cho CONFIRMED */}
                    {order.status === "CONFIRMED" && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            setActionConfirmOrder({
                              order,
                              targetStatus: "CANCELLED",
                              title: `Hủy đơn hàng #${order.id.slice(0, 8)}?`,
                              description:
                                "Hủy đơn hàng đã xác nhận sẽ ghi nhận trạng thái CANCELLED trên hệ thống.",
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
                          disabled={isUpdating}
                          onClick={() =>
                            setActionConfirmOrder({
                              order,
                              targetStatus: "PAID",
                              title: `Xác nhận thanh toán đơn #${order.id.slice(0, 8)}?`,
                              description:
                                "Ghi nhận khách hàng đã thanh toán đầy đủ cho đơn hàng này (PAID).",
                            })
                          }
                          className="rounded-xl text-xs font-bold text-success-dark border-success/30 hover:bg-pastel-mint"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Đã thanh toán
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            setActionConfirmOrder({
                              order,
                              targetStatus: "SHIPPED",
                              title: `Bàn giao vận chuyển / Hoàn tất #${order.id.slice(0, 8)}?`,
                              description:
                                "Chuyển đơn sang trạng thái SHIPPED (Đang vận chuyển / Đã giao).",
                            })
                          }
                          className="rounded-xl text-xs font-bold flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Giao hàng
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* KHỐI 2: CẢNH BÁO TỒN KHO & ĐIỀU PHỐI NHẬP HÀNG */}
      <section id="stock-alerts-block" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-dark" />
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                Cảnh Báo Tồn Kho ({lowStockItems.length} mặt hàng)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted">
              Sản phẩm có lượng tồn khả dụng (available) ≤ 5 hoặc đã hết sạch hàng cần bổ sung gấp
            </p>
          </div>

          <Link
            to="/admin/inventory"
            className="text-xs font-bold text-primary-dark hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Đến trang Quản lý tồn kho &rarr;
          </Link>
        </div>

        {lowStockItems.length === 0 ? (
          <Card className="p-8 text-center rounded-3xl border border-success/30 bg-pastel-mint/30 shadow-card">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-mint border border-success/30 flex items-center justify-center text-success-dark mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-foreground text-sm sm:text-base">
              Tồn kho hiện tại đạt ngưỡng an toàn!
            </h4>
            <p className="text-xs text-muted max-w-md mx-auto mt-1">
              Không có mặt hàng nào bị hết hàng hoặc dưới ngưỡng cảnh báo (≤ 5) tại {activeBranchName}.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.slice(0, 6).map((item) => {
              const isOut = item.status === "OUT_OF_STOCK";
              return (
                <Card
                  key={item.id}
                  className={`p-4 rounded-2xl border shadow-card flex flex-col justify-between gap-3 ${
                    isOut ? "border-danger/30 bg-danger-pastel/20" : "border-warning/30 bg-warning-pastel/20"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={isOut ? "destructive" : "warning"} className="text-[10px] font-bold">
                        {isOut ? "HẾT HÀNG (0)" : `SẮP HẾT (${item.available})`}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted">{item.sku}</span>
                    </div>

                    <h4 className="font-bold text-sm text-foreground line-clamp-1" title={item.productName}>
                      {item.productName}
                    </h4>

                    <p className="text-xs text-muted flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-muted/70" />
                      {item.branchName}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-border/40">
                      <span className="text-muted">
                        Tồn thực: <strong className="text-foreground">{item.quantity}</strong>
                      </span>
                      <span className="text-muted">
                        Giữ chỗ: <strong className="text-foreground">{item.reserved}</strong>
                      </span>
                      <span className="font-bold text-foreground">
                        Khả dụng: <strong className={isOut ? "text-danger-dark font-black" : "text-warning-dark font-black"}>{item.available}</strong>
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      const branch = branches.find((b) => b.id === item.branchId) || branches[0];
                      if (branch) {
                        setRestockItem({ branch, productId: item.productId });
                      }
                    }}
                    className="w-full rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-surface hover:bg-primary-tint hover:text-primary-dark border border-border shadow-xs"
                  >
                    <span>Nhập kho ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* BIỂU ĐỒ DOANH THU & ĐƠN HÀNG (Dữ liệu thật, bộ lọc thời gian) */}
      <Card className="p-5 sm:p-6 rounded-3xl border border-border shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {chartTitle}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Tổng kết:{" "}
              <strong className="text-foreground">{periodSummary.totalOrders} đơn hàng</strong> • Doanh thu PAID:{" "}
              <strong className="text-primary-dark font-extrabold">{formatCurrency(periodSummary.totalRevenue)}</strong>
              {periodSummary.totalOrders > 0 && (
                <span> • AOV: <strong>{formatCurrency(periodSummary.aov)}</strong></span>
              )}
            </p>
          </div>

          {/* Toggle metric & Filter period */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-surface-soft p-1 rounded-2xl border border-border flex items-center">
              <button
                onClick={() => setMetricView("revenue")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  metricView === "revenue"
                    ? "bg-surface text-primary-dark shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Doanh thu
              </button>
              <button
                onClick={() => setMetricView("orders")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  metricView === "orders"
                    ? "bg-surface text-primary-dark shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Lượng đơn
              </button>
            </div>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              aria-label="Chọn khoảng thời gian phân tích"
              className="bg-surface text-xs font-bold text-foreground py-1.5 px-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer shadow-xs"
            >
              <option value="7_DAYS">7 Ngày qua</option>
              <option value="30_DAYS">30 Ngày gần nhất</option>
              <option value="MONTH">12 Tháng trong năm</option>
              <option value="YEAR">Theo các năm</option>
            </select>
          </div>
        </div>

        {/* Vùng vẽ biểu đồ Recharts */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4E9F76" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4E9F76" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2EBE6" />
              <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64756D" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64756D" }}
                tickFormatter={(val) =>
                  metricView === "revenue"
                    ? val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : `${val}`
                    : `${val}`
                }
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey={metricView}
                stroke="#4E9F76"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Modal Chi Tiết Đơn Hàng */}
      {selectedDetailOrder && (
        <OrderDetailModal
          isOpen={Boolean(selectedDetailOrder)}
          onClose={() => setSelectedDetailOrder(null)}
          order={selectedDetailOrder}
        />
      )}

      {/* Modal Xác nhận Chuyển trạng thái nhanh */}
      {actionConfirmOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                {actionConfirmOrder.isDangerous ? (
                  <AlertTriangle className="w-5 h-5 text-danger" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
                {actionConfirmOrder.title}
              </h3>
              <button
                onClick={() => setActionConfirmOrder(null)}
                className="text-muted hover:text-foreground"
                aria-label="Đóng hộp thoại xác nhận"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {actionConfirmOrder.description}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionConfirmOrder(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>

              <Button
                variant={actionConfirmOrder.isDangerous ? "destructive" : "default"}
                size="sm"
                disabled={Boolean(isUpdatingStatusId)}
                onClick={handleExecuteStatusUpdate}
                className="rounded-xl text-xs font-bold"
              >
                {isUpdatingStatusId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Xác nhận thực hiện"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập kho nhanh */}
      {restockItem && (
        <RestockModal
          isOpen={Boolean(restockItem)}
          onClose={() => {
            setRestockItem(null);
            loadData();
          }}
          branch={restockItem.branch}
          products={productsList}
          onRestock={async (payload) => {
            await inventoryApi.addStock(payload);
          }}
        />
      )}
    </div>
  );
}
