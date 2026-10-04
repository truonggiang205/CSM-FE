import { useState } from "react";
import {
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  Clock,
  Plus,
  Search,
  RotateCcw,
  Store,
  ArrowUpDown,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useInventoryDashboard, StockFilterStatus } from "../hooks/useInventoryDashboard";
import { RestockModal } from "../components/RestockModal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";

export function InventoryPage() {
  const {
    branches,
    products,
    activeBranchId,
    setActiveBranchId,
    isBranchManager,
    stats,
    chartData,
    filteredInventory,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    isLoading,
    isError,
    refetch,
    restock,
  } = useInventoryDashboard();

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  const handleToggleSort = (field: "name" | "quantity" | "available") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Branch Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-tint text-primary-dark border border-primary/25">
              {isBranchManager ? "QUẢN LÝ CHI NHÁNH" : "QUẢN TRỊ VIÊN HỆ THỐNG"}
            </span>
            <span className="text-xs text-muted">&bull;</span>
            <span className="text-xs text-muted">Sprint 2 - Quản lý tồn kho thời gian thực</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Quản Lý Tồn Kho Chi Nhánh
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Theo dõi số lượng tồn thực tế, số lượng giữ chỗ tạm thời và phân bổ hàng hóa cho các cửa hàng.
          </p>
        </div>

        {/* Branch Selection & Restock Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {isBranchManager ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface border border-border shadow-xs text-xs">
              <Store className="w-4 h-4 text-primary" />
              <span className="text-muted">Chi nhánh phụ trách:</span>
              <strong className="text-foreground font-bold">{activeBranch?.name || activeBranchId}</strong>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Chi nhánh:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="px-3.5 py-2 rounded-2xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-xs cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={() => setIsRestockModalOpen(true)}
            className="rounded-2xl gap-2 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nhập hàng vào kho
          </Button>
        </div>
      </div>

      {/* 5 Thẻ Thống Kê (Stat Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng số SKU */}
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng số SKU</span>
            <div className="w-9 h-9 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.totalSkus}</p>
          <span className="text-[11px] text-muted">mặt hàng trong kho</span>
        </Card>

        {/* Card 2: Tổng tồn kho */}
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tổng số lượng</span>
            <div className="w-9 h-9 rounded-2xl bg-pastel-sky text-info-dark flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.totalQuantity.toLocaleString("vi-VN")}</p>
          <span className="text-[11px] text-muted">đơn vị sản phẩm</span>
        </Card>

        {/* Card 3: SKU Sắp hết */}
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">SKU Sắp hết</span>
            <div className="w-9 h-9 rounded-2xl bg-warning-pastel text-warning-dark border border-warning/25 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-warning-dark mt-2">{stats.lowStockSkus}</p>
          <span className="text-[11px] text-muted">tồn kho còn từ 1 - 5 món</span>
        </Card>

        {/* Card 4: SKU Hết hàng */}
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">SKU Hết hàng</span>
            <div className="w-9 h-9 rounded-2xl bg-danger-pastel text-danger-dark border border-danger/25 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-danger-dark mt-2">{stats.outOfStockSkus}</p>
          <span className="text-[11px] text-muted">cần nhập kho khẩn cấp</span>
        </Card>

        {/* Card 5: Đang giữ chỗ (Saga Reserved) */}
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Đang giữ chỗ</span>
            <div className="w-9 h-9 rounded-2xl bg-pastel-lavender text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-800 mt-2">{stats.totalReserved}</p>
          <span className="text-[11px] text-muted">hàng đang trong đơn chờ thanh toán</span>
        </Card>
      </div>

      {/* 2 Biểu đồ Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ cột: Top 5 sản phẩm tồn thấp nhất */}
        <Card className="p-5 sm:p-6 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top 5 Sản Phẩm Tồn Kho Thấp Nhất
              </h3>
              <p className="text-xs text-muted">Các mặt hàng cần ưu tiên nhập thêm</p>
            </div>
            <span className="text-[11px] text-primary-dark bg-primary-tint px-2.5 py-0.5 rounded-full font-semibold border border-primary/20">
              Chi nhánh: {activeBranch?.name}
            </span>
          </div>

          <div className="h-64 w-full">
            {chartData.lowestStockProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                Chưa có dữ liệu tồn kho.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.lowestStockProducts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64756D" }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#64756D" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E2EBE6",
                      fontSize: "12px",
                      boxShadow: "0 4px 16px rgba(78, 159, 118, 0.08)",
                    }}
                  />
                  <Bar dataKey="available" name="Khả dụng" fill="#4E9F76" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="reserved" name="Đang giữ" fill="#F59E6C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Biểu đồ tròn: Tỷ lệ trạng thái tồn kho */}
        <Card className="p-5 sm:p-6 border border-border shadow-card bg-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-accent" />
                Phân Bổ Trạng Thái Tồn Kho
              </h3>
              <p className="text-xs text-muted">Tỷ lệ các mặt hàng theo mức độ sẵn sàng</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData.statusDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                Chưa có dữ liệu thống kê.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E2EBE6",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Bảng Quản Lý Tồn Kho */}
      <Card className="border border-border shadow-card bg-surface overflow-hidden rounded-3xl">
        {/* Controls: Search, Filter Tabs, Refresh */}
        <div className="p-5 sm:p-6 border-b border-border flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Tìm theo tên sản phẩm, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 rounded-2xl bg-surface-soft"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "IN_STOCK", label: "Còn hàng (>5)" },
              { id: "LOW_STOCK", label: "Sắp hết (1-5)" },
              { id: "OUT_OF_STOCK", label: "Hết hàng (0)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StockFilterStatus)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-primary-tint text-primary-dark border border-primary/25 shadow-xs"
                    : "bg-surface-soft hover:bg-surface text-muted border border-border/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="rounded-xl h-9 w-9 text-muted hover:text-foreground"
              title="Làm mới bảng tồn kho"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-muted uppercase bg-surface-soft border-b border-border">
              <tr>
                <th
                  className="px-6 py-4 cursor-pointer select-none"
                  onClick={() => handleToggleSort("name")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sản phẩm</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-6 py-4">Mã SKU</th>
                <th
                  className="px-6 py-4 text-right cursor-pointer select-none"
                  onClick={() => handleToggleSort("quantity")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Tổng tồn</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Đang giữ</th>
                <th
                  className="px-6 py-4 text-right cursor-pointer select-none"
                  onClick={() => handleToggleSort("available")}
                >
                  <div className="flex items-center justify-end gap-1.5 text-primary-dark">
                    <span>Khả dụng</span>
                    <ArrowUpDown className="w-3 h-3 text-primary-dark" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-8 w-20 ml-auto rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-muted">
                    Không tìm thấy sản phẩm nào trong kho chi nhánh này phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOut = item.available <= 0;
                  const isLow = item.available > 0 && item.available <= 5;

                  return (
                    <tr key={item.id} className="hover:bg-surface-soft/60 transition-colors">
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{item.product_name}</div>
                        <span className="text-[11px] text-muted">ID: {item.product_id}</span>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 font-mono text-xs text-muted-dark">{item.sku}</td>

                      {/* Total Quantity */}
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {item.quantity}
                      </td>

                      {/* Reserved Quantity */}
                      <td className="px-6 py-4 text-right text-xs font-semibold text-purple-700">
                        {item.reserved_quantity > 0 ? `+${item.reserved_quantity}` : "0"}
                      </td>

                      {/* Available Quantity */}
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-extrabold text-sm ${
                            isOut
                              ? "text-danger-dark"
                              : isLow
                              ? "text-warning-dark"
                              : "text-primary-dark"
                          }`}
                        >
                          {item.available}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        {isOut ? (
                          <Badge variant="destructive">Hết hàng</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Sắp hết</Badge>
                        ) : (
                          <Badge variant="success">Còn hàng</Badge>
                        )}
                      </td>

                      {/* Quick Restock Action */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsRestockModalOpen(true)}
                          className="rounded-xl border-primary/25 hover:bg-primary-tint text-primary-dark text-xs font-bold h-8"
                        >
                          + Nhập thêm
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted bg-surface-soft/40">
          <span>
            Đang hiển thị {filteredInventory.length} trên tổng số {stats.totalSkus} mặt hàng tại chi nhánh {activeBranch?.name}
          </span>
          <span className="font-medium">Hệ thống đồng bộ tự động với Inventory Service</span>
        </div>
      </Card>

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        branch={activeBranch}
        products={products}
        onRestock={restock}
      />
    </div>
  );
}
