import { useState } from "react";
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
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
import { OrderStatusBadge } from "../../orders/components/OrderStatusBadge";
import { mockRevenueWeeklyData, mockRecentOrders } from "../../../mocks/dashboardMock";

export function DashboardPage() {
  const [metricView, setMetricView] = useState<"revenue" | "orders">("revenue");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "1y">("7d");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const stats = [
    {
      name: "Doanh thu hôm nay",
      value: "38.2M ₫",
      rawNumber: "38.200.000₫",
      icon: DollarSign,
      trend: "+18.4%",
      isPositive: true,
      bg: "bg-primary-tint",
      text: "text-primary-dark",
      border: "border-primary/20",
    },
    {
      name: "Đơn hàng hôm nay",
      value: "295 đơn",
      rawNumber: "295 đơn đặt",
      icon: ShoppingBag,
      trend: "+12.6%",
      isPositive: true,
      bg: "bg-accent-tint",
      text: "text-accent-dark",
      border: "border-accent/20",
    },
    {
      name: "Khách hàng mới",
      value: "1,204",
      rawNumber: "1.204 tài khoản",
      icon: Users,
      trend: "+15.2%",
      isPositive: true,
      bg: "bg-pastel-lavender",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    {
      name: "Cảnh báo kho hàng",
      value: "8 món",
      rawNumber: "8 sản phẩm sắp hết",
      icon: Package,
      trend: "-4%",
      isPositive: false,
      bg: "bg-pastel-butter",
      text: "text-warning-dark",
      border: "border-warning/30",
    },
  ];

  // Custom Tooltip cho biểu đồ Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-lg space-y-1">
          <p className="text-xs font-bold text-foreground">
            {data.dayName} ({data.date})
          </p>
          <p className="text-xs font-extrabold text-primary-dark">
            Doanh thu: {formatCurrency(data.revenue)}
          </p>
          <p className="text-xs font-semibold text-muted">
            Đơn hàng: {data.orders} đơn
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
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
            Tổng quan thời gian thực về doanh số, đơn hàng và vận hành kho của chuỗi cửa hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs text-muted font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.name}
              className="p-5 sm:p-6 border border-border shadow-card hover:shadow-card-hover rounded-3xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {stat.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} border ${stat.border} flex items-center justify-center shadow-xs`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-xs">
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
                <span className="text-muted ml-2 text-[11px]">so với ngày hôm qua</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= RECHARTS REVENUE CHART ================= */}
        <Card className="lg:col-span-7 p-6 sm:p-7 rounded-3xl border border-border shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-foreground text-base sm:text-lg">
                  {metricView === "revenue" ? "Doanh Thu 7 Ngày Qua" : "Lượng Đơn Hàng 7 Ngày Qua"}
                </h3>
                <span className="text-[10px] text-primary-dark font-bold bg-primary-tint px-2 py-0.5 rounded-full border border-primary/20">
                  Thời gian thực
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Xu hướng tăng trưởng liên tục các ngày trong tuần
              </p>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center bg-surface-soft p-1 rounded-2xl border border-border/80">
              <button
                type="button"
                onClick={() => setMetricView("revenue")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
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
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  metricView === "orders"
                    ? "bg-surface text-primary shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Số đơn
              </button>
            </div>
          </div>

          {/* Recharts Area Container */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockRevenueWeeklyData}
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
                  dataKey="dayName"
                  stroke="#64756D"
                  fontSize={12}
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
          </div>
        </Card>

        {/* ================= RECENT ORDERS TABLE ================= */}
        <Card className="lg:col-span-5 p-6 rounded-3xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div>
              <h3 className="font-extrabold text-foreground text-base sm:text-lg">
                Đơn Hàng Gần Đây
              </h3>
              <p className="text-xs text-muted">5 đơn hàng mới nhất trên toàn chuỗi</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl">
              <Link to="/orders" className="flex items-center gap-1">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {mockRecentOrders.map((ord) => (
              <div
                key={ord.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-surface-soft/60 px-2 rounded-2xl transition-colors"
              >
                {/* Customer info */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={ord.customerAvatar}
                    alt={ord.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-2xs flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      {ord.customerName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                      <span className="font-mono">#{ord.id}</span>
                      <span>&bull;</span>
                      <span className="truncate">{ord.branchName}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-xs sm:text-sm text-primary-dark">
                    {formatCurrency(ord.totalAmount)}
                  </div>
                  <div className="mt-1">
                    <OrderStatusBadge status={ord.status} className="text-[10px] px-2 py-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;

