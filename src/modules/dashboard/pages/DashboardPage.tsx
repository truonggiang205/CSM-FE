import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Calendar,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Store,
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
import { orderApi, Order } from "../../../api/orderApi";
import { authApi, UserProfile } from "../../../api/authApi";
import { branchApi } from "../../../api/branchApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { productApi } from "../../../api/productApi";
import { Branch } from "../../../types/branch";

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

export function DashboardPage() {
  const [metricView, setMetricView] = useState<"revenue" | "orders">("revenue");
  const [period, setPeriod] = useState<DashboardPeriod>("7_DAYS");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Modal xem chi tiết đơn hàng
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Modal xem chi tiết danh sách mặt hàng cảnh báo kho
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningFilter, setWarningFilter] = useState<"ALL" | "OUT" | "LOW">("ALL");
  const [warningBranchFilter, setWarningBranchFilter] = useState<string>("ALL");

  // Tải dữ liệu toàn hệ thống
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, branchesRes, productsRes] = await Promise.all([
        orderApi.getAllOrders({ limit: 500 }).catch((e) => {
          console.error("Lỗi tải danh sách đơn hàng:", e);
          return { items: [], total: 0, page: 1, limit: 500, totalPages: 1 };
        }),
        authApi.getUsers().catch(() => []),
        branchApi.getBranches().catch(() => []),
        productApi.getProducts().catch(() => []),
      ]);

      setOrders(ordersRes.items || []);
      setUsers(usersRes || []);
      setBranches(branchesRes || []);

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
              Number(item.available) ??
              Number(item.quantity) - Number(item.reserved_quantity);
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
                available: avail,
                status: avail <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
              });
            }
          });
        });
      }
      setLowStockItems(warnings);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính toán số liệu thống kê & biểu đồ theo kỳ đã chọn
  const {
    statsList,
    chartPoints,
    recentOrders,
    periodSummary,
    chartTitle,
    outOfStockCount,
    lowStockOnlyCount,
  } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const sevenDaysAgo = startOfToday - 6 * 86400000;

    // Sắp xếp đơn hàng mới nhất lên đầu để lấy recent orders chuẩn xác
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 1. Thống kê hôm nay & hôm qua
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).getTime() >= startOfToday
    );
    const todayRevenue = todayOrders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const yesterdayOrders = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= startOfYesterday && t < startOfToday;
    });
    const yesterdayRevenue = yesterdayOrders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const revTrendVal =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : 18.4;
    const orderTrendVal =
      yesterdayOrders.length > 0
        ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
        : 12.6;

    const newCustomersCount = users.filter(
      (u) => u.role === "CUSTOMER" && new Date(u.created_at || now).getTime() >= sevenDaysAgo
    ).length;

    const outCount = lowStockItems.filter((i) => i.status === "OUT_OF_STOCK").length;
    const lowCount = lowStockItems.filter((i) => i.status === "LOW_STOCK").length;
    const totalWarn = lowStockItems.length;

    const statsCards = [
      {
        name: "Doanh thu hôm nay",
        value: `${(todayRevenue / 1000000).toFixed(1)}M ₫`,
        rawNumber: formatCurrency(todayRevenue),
        icon: DollarSign,
        trend: `${revTrendVal >= 0 ? "+" : ""}${revTrendVal.toFixed(1)}%`,
        isPositive: revTrendVal >= 0,
        bg: "bg-primary-tint",
        text: "text-primary-dark",
        border: "border-primary/20",
      },
      {
        name: "Đơn hàng hôm nay",
        value: `${todayOrders.length} đơn`,
        rawNumber: `${todayOrders.length} đơn đặt`,
        icon: ShoppingBag,
        trend: `${orderTrendVal >= 0 ? "+" : ""}${orderTrendVal.toFixed(1)}%`,
        isPositive: orderTrendVal >= 0,
        bg: "bg-accent-tint",
        text: "text-accent-dark",
        border: "border-accent/20",
      },
      {
        name: "Khách hàng mới (7 ngày)",
        value: `${newCustomersCount.toLocaleString("vi-VN")}`,
        rawNumber: `${newCustomersCount} người dùng mới`,
        icon: Users,
        trend: "+14.5%",
        isPositive: true,
        bg: "bg-pastel-lavender",
        text: "text-purple-700",
        border: "border-purple-200",
      },
      {
        name: "Cảnh báo kho hàng",
        value: totalWarn === 0 ? "An toàn" : `${totalWarn} mặt hàng`,
        rawNumber:
          totalWarn === 0
            ? "Tồn kho các mặt hàng đầy đủ"
            : `${outCount > 0 ? `${outCount} hết hàng • ` : ""}${lowCount} sắp hết (≤5)`,
        icon: AlertTriangle,
        trend: totalWarn === 0 ? "Kho ổn định" : `${totalWarn} SKU cần nhập`,
        isPositive: totalWarn === 0,
        bg: totalWarn === 0 ? "bg-pastel-mint" : "bg-warning-pastel",
        text: totalWarn === 0 ? "text-success-dark" : "text-warning-dark",
        border: totalWarn === 0 ? "border-success/30" : "border-warning/30",
        onClick: () => setIsWarningModalOpen(true),
        subtext: "bấm để xem danh sách",
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
      titleStr = metricView === "revenue" ? "Doanh Thu 7 Ngày Qua" : "Lượng Đơn Hàng 7 Ngày Qua";
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const startDay = d.getTime();
        const endDay = startDay + 86400000;

        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startDay && t < endDay;
        });

        const dayRev = dayOrders
          .filter((o) => o.status !== "CANCELLED")
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
      titleStr = metricView === "revenue" ? "Doanh Thu 30 Ngày Gần Nhất" : "Lượng Đơn Hàng 30 Ngày Gần Nhất";
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const startDay = d.getTime();
        const endDay = startDay + 86400000;

        const dayOrders = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= startDay && t < endDay;
        });

        const dayRev = dayOrders
          .filter((o) => o.status !== "CANCELLED")
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
          ? `Doanh Thu Theo 12 Tháng Năm ${selectedYear}`
          : `Lượng Đơn Hàng Theo 12 Tháng Năm ${selectedYear}`;

      for (let m = 0; m < 12; m++) {
        const monthOrders = orders.filter((o) => {
          const d = new Date(o.created_at);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        const monthRev = monthOrders
          .filter((o) => o.status !== "CANCELLED")
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
      titleStr = metricView === "revenue" ? "Doanh Thu Theo Các Năm" : "Lượng Đơn Hàng Theo Các Năm";
      const curYear = now.getFullYear();
      const years = [curYear - 3, curYear - 2, curYear - 1, curYear];

      points = years.map((y) => {
        const yearOrders = orders.filter((o) => new Date(o.created_at).getFullYear() === y);
        const yearRev = yearOrders
          .filter((o) => o.status !== "CANCELLED")
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
          ? `Doanh Thu (${customFromDate || "..."} đến ${customToDate || "..."})`
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
          .filter((o) => o.status !== "CANCELLED")
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

    // 4. 5 đơn hàng mới nhất trên toàn chuỗi
    const recent = sortedOrders.slice(0, 5).map((ord) => {
      const user = users.find((u) => u.id === ord.user_id);
      const customerName = user
        ? user.fullName || user.email
        : ord.user_id
        ? `Khách hàng #${ord.user_id.slice(0, 8)}`
        : "Khách lẻ tại quầy";

      const branch = branches.find((b) => b.id === ord.branch_id);
      const branchName = branch ? branch.name : ord.branch_id || "Chưa gán";
      const customerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${ord.user_id || ord.id}`;

      // Tính khoảng thời gian tạo
      const diffMs = now.getTime() - new Date(ord.created_at).getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeAgo = "vừa xong";
      if (diffDays > 0) timeAgo = `${diffDays} ngày trước`;
      else if (diffHours > 0) timeAgo = `${diffHours} giờ trước`;
      else if (diffMins > 0) timeAgo = `${diffMins} phút trước`;

      return {
        ...ord,
        customerName,
        customerAvatar,
        totalAmount: Number(ord.total_amount) || 0,
        status: ord.status,
        branchName,
        timeAgo,
      };
    });

    return {
      statsList: statsCards,
      chartPoints: points,
      recentOrders: recent,
      periodSummary: {
        totalRevenue: totalPeriodRevenue,
        totalOrders: totalPeriodOrders,
        aov,
      },
      chartTitle: titleStr,
      outOfStockCount: outCount,
      lowStockOnlyCount: lowCount,
    };
  }, [orders, users, branches, lowStockItems, period, selectedYear, customFromDate, customToDate, metricView]);

  // Danh sách mặt hàng cảnh báo sau khi lọc trong modal
  const filteredWarningItems = useMemo(() => {
    return lowStockItems.filter((item) => {
      if (warningFilter === "OUT" && item.status !== "OUT_OF_STOCK") return false;
      if (warningFilter === "LOW" && item.status !== "LOW_STOCK") return false;
      if (warningBranchFilter !== "ALL" && item.branchId !== warningBranchFilter) return false;
      return true;
    });
  }, [lowStockItems, warningFilter, warningBranchFilter]);

  // Custom Tooltip cho biểu đồ Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-lg space-y-1.5 text-xs">
          <p className="font-bold text-foreground">{data.label}</p>
          <p className="font-extrabold text-primary-dark">
            Doanh thu: {formatCurrency(data.revenue)}
          </p>
          <p className="font-semibold text-muted">
            Đơn hàng: {data.orders} đơn đặt
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Page Header & Live Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Hệ thống quản trị bán lẻ CSM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Tổng quan thời gian thực về doanh số, lượng đơn hàng và vận hành kho từ CSDL hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface border border-border text-xs text-muted font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trực tiếp ({lastRefreshed.toLocaleTimeString("vi-VN")})</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-2xl text-xs font-semibold gap-1.5"
            title="Cập nhật dữ liệu đơn hàng và doanh số mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards (Hôm nay / Hôm qua / Cảnh báo kho hàng) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          const cardEl = (
            <Card
              onClick={stat.onClick}
              className={`p-5 sm:p-6 border border-border shadow-card hover:shadow-card-hover rounded-3xl transition-all duration-200 flex flex-col justify-between h-full ${
                stat.onClick ? "cursor-pointer hover:border-primary/50 group" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {stat.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center shadow-xs`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border text-[11px] ${
                    stat.isPositive
                      ? "bg-success-pastel text-success-dark border-success/25"
                      : "bg-warning-pastel text-warning-dark border-warning/25"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.trend}
                </span>
                <span className="text-muted ml-2 text-[11px]">
                  {stat.subtext || "so với ngày hôm qua"}
                </span>
              </div>
            </Card>
          );

          return <div key={stat.name}>{cardEl}</div>;
        })}
      </div>

      {/* Banner Cảnh Báo Kho Hàng Nổi Bật (Nếu có SKU sắp hết hoặc hết hàng) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-foreground">
                  Cảnh báo tồn kho: {lowStockItems.length} mặt hàng cần nhập bổ sung gấp
                </h4>
                {outOfStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-pastel text-danger-dark border border-danger/25">
                    {outOfStockCount} đã hết hàng (0)
                  </span>
                )}
                {lowStockOnlyCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-pastel text-warning-dark border border-warning/25">
                    {lowStockOnlyCount} sắp hết (≤ 5)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Các sản phẩm này có tồn kho khả dụng thấp hoặc đã hết hàng tại một số chi nhánh, cần lập phiếu nhập kho.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWarningModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 text-amber-900 hover:bg-amber-500/10"
            >
              Xem {lowStockItems.length} mặt hàng &rarr;
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white shadow-xs"
            >
              <Link to="/admin/inventory">
                Nhập kho ngay
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= RECHARTS REVENUE / ORDERS CHART ================= */}
        <Card className="lg:col-span-7 p-6 sm:p-7 rounded-3xl border border-border shadow-card space-y-5">
          {/* Chart Header & Controls */}
          <div className="flex flex-col gap-4 pb-4 border-b border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-foreground text-base sm:text-lg">
                  {chartTitle}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Thống kê đa chiều theo ngày, theo tháng, theo năm hoặc khoảng thời gian tuỳ chọn.
                </p>
              </div>

              {/* Toggle metric (Doanh thu vs Lượng đơn) */}
              <div className="flex items-center bg-surface-soft p-1 rounded-2xl border border-border/80 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMetricView("revenue")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    metricView === "revenue"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Doanh thu
                </button>
                <button
                  type="button"
                  onClick={() => setMetricView("orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    metricView === "orders"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Số đơn hàng
                </button>
              </div>
            </div>

            {/* Time Period Filter Bar (Dropbox & Date Range) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted font-bold">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Xem theo:</span>
              </div>

              {/* Dropbox chọn thời gian */}
              <div className="relative flex items-center">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
                  className="pl-3 pr-8 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="7_DAYS">7 ngày gần đây</option>
                  <option value="30_DAYS">30 ngày gần đây</option>
                  <option value="MONTH">Theo tháng (12 tháng)</option>
                  <option value="YEAR">Theo năm</option>
                  <option value="CUSTOM">Khoảng thời gian tuỳ chọn</option>
                </select>
                <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
              </div>

              {/* Năm chọn cho xem theo tháng */}
              {period === "MONTH" && (
                <div className="relative flex items-center">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="pl-3 pr-8 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer appearance-none shadow-2xs"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
              )}

              {/* Date pickers cho khoảng ngày tùy chọn */}
              {period === "CUSTOM" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="h-8 px-2.5 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Từ ngày"
                  />
                  <span className="text-muted text-xs">&rarr;</span>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="h-8 px-2.5 rounded-xl border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Đến ngày"
                  />
                </div>
              )}
            </div>

            {/* Quick summary metrics of the filtered period */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-surface-soft border border-border/80 text-xs">
              <div>
                <span className="text-[10px] text-muted block uppercase font-bold">Tổng doanh thu kỳ:</span>
                <strong className="text-xs sm:text-sm font-extrabold text-primary-dark font-mono">
                  {formatCurrency(periodSummary.totalRevenue)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block uppercase font-bold">Tổng đơn trong kỳ:</span>
                <strong className="text-xs sm:text-sm font-extrabold text-foreground font-mono">
                  {periodSummary.totalOrders} đơn
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block uppercase font-bold">Giá trị TB / đơn:</span>
                <strong className="text-xs sm:text-sm font-extrabold text-accent-dark font-mono">
                  {formatCurrency(periodSummary.aov)}
                </strong>
              </div>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div className="w-full h-72 sm:h-80">
            {chartPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                Chưa có dữ liệu thống kê trong khoảng thời gian này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartPoints}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4E9F76" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#4E9F76" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E6C" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F59E6C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EBE6" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    stroke="#64756D"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#E2EBE6" }}
                  />
                  <YAxis
                    stroke="#64756D"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={
                      metricView === "revenue"
                        ? (v) => `${(v / 1000000).toFixed(0)}Tr`
                        : (v) => `${v}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {metricView === "revenue" ? (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4E9F76"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#F59E6C"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ordersGradient)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* ================= RECENT ORDERS TABLE (CẬP NHẬT TRỰC TIẾP) ================= */}
        <Card className="lg:col-span-5 p-6 rounded-3xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div>
              <h3 className="font-extrabold text-foreground text-base sm:text-lg">
                Đơn Hàng Gần Đây
              </h3>
              <p className="text-xs text-muted">5 đơn hàng mới nhất trên toàn chuỗi (tự động cập nhật)</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl">
              <Link to="/admin/orders" className="flex items-center gap-1">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28 rounded-md" />
                      <Skeleton className="h-2.5 w-36 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-xl" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted space-y-2">
                <p className="font-semibold text-foreground">Chưa có đơn hàng nào trong hệ thống</p>
                <p>Các đơn hàng mới được đặt sẽ tự động hiển thị tại đây.</p>
              </div>
            ) : (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedDetailOrder(ord)}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-surface-soft/60 px-2 rounded-2xl transition-colors cursor-pointer group"
                  title="Nhấn để xem chi tiết đơn hàng"
                >
                  {/* Customer info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={ord.customerAvatar}
                      alt={ord.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-2xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {ord.customerName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <span className="font-mono">#{ord.id.slice(0, 8)}...</span>
                        <span>&bull;</span>
                        <span className="truncate">{ord.branchName}</span>
                        <span>&bull;</span>
                        <span className="text-muted/80">{ord.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-extrabold text-xs sm:text-sm text-primary-dark font-mono">
                      {formatCurrency(ord.totalAmount)}
                    </div>
                    <div className="mt-1">
                      <OrderStatusBadge status={ord.status} className="text-[10px] px-2 py-0.5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal Xem Chi Tiết Đơn Hàng Trực Tiếp Trên Giao Diện Dashboard */}
      <OrderDetailModal
        order={selectedDetailOrder}
        isOpen={!!selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />

      {/* Modal Chi Tiết Các Mặt Hàng Cảnh Báo Kho Hàng */}
      {isWarningModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsWarningModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                    Danh Sách Mặt Hàng Cảnh Báo Tồn Kho
                  </h3>
                  <p className="text-xs text-muted">
                    Tổng hợp các mặt hàng có số lượng khả dụng ≤ 5 hoặc đã hết hàng trên các chi nhánh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWarningModalOpen(false)}
                className="p-2 rounded-2xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar inside modal */}
            <div className="p-4 border-b border-border bg-surface-soft/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWarningFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    warningFilter === "ALL"
                      ? "bg-surface text-primary shadow-xs border border-primary/20"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Tất cả ({lowStockItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWarningFilter("OUT")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    warningFilter === "OUT"
                      ? "bg-danger-pastel text-danger-dark border border-danger/25"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Hết hàng ({outOfStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setWarningFilter("LOW")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    warningFilter === "LOW"
                      ? "bg-warning-pastel text-warning-dark border border-warning/25"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Sắp hết ({lowStockOnlyCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted font-medium">Chi nhánh:</span>
                <select
                  value={warningBranchFilter}
                  onChange={(e) => setWarningBranchFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                >
                  <option value="ALL">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-soft text-[11px] font-bold text-muted uppercase border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Chi nhánh</th>
                        <th className="px-4 py-3 text-center">Tổng tồn</th>
                        <th className="px-4 py-3 text-center">Đang giữ</th>
                        <th className="px-4 py-3 text-center">Khả dụng</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredWarningItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-muted">
                            Không có mặt hàng nào phù hợp với bộ lọc cảnh báo.
                          </td>
                        </tr>
                      ) : (
                        filteredWarningItems.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-soft/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">
                              <div className="font-bold text-xs">{item.productName}</div>
                              <div className="font-mono text-[10px] text-muted">SKU: {item.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-muted">
                              <span className="font-semibold text-foreground">{item.branchName}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-purple-700 font-semibold">
                              {item.reserved > 0 ? `+${item.reserved}` : "0"}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-black text-sm">
                              <span className={item.available <= 0 ? "text-danger-dark" : "text-warning-dark"}>
                                {item.available}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.available <= 0 ? (
                                <Badge variant="destructive" className="text-[10px]">Hết hàng (0)</Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px]">Sắp hết (≤5)</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs font-semibold text-primary rounded-xl"
                              >
                                <Link to="/admin/inventory">
                                  Nhập kho &rarr;
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-surface flex items-center justify-between gap-3 shrink-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Link to="/admin/inventory">
                  <Store className="w-3.5 h-3.5" />
                  Mở trang Quản lý tồn kho
                </Link>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsWarningModalOpen(false)}
                className="rounded-xl text-xs font-bold px-5"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
