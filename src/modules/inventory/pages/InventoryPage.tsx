import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  ChevronDown,
  Lock,
  Building2,
  CheckCircle2,
  History,
  ArrowRight,
  TrendingUp,
  TrendingDown,
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
import { inventoryApi } from "../../../api/inventoryApi";
import { StockTransactionRecord } from "../../../types/inventory";

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Đọc params từ URL
  const urlBranch = searchParams.get("branchId");
  const urlStatus = (searchParams.get("status") as StockFilterStatus) || "ALL";
  const urlSearch = searchParams.get("search") || "";
  const urlSort = searchParams.get("sort") || "available-asc";

  // Đồng bộ URL params vào state lúc khởi tạo hoặc khi URL đổi
  useEffect(() => {
    if (!isBranchManager && urlBranch && urlBranch !== activeBranchId) {
      setActiveBranchId(urlBranch);
    }
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    if (urlSort) {
      const [f, o] = urlSort.split("-") as ["name" | "quantity" | "available", "asc" | "desc"];
      if (f && o) {
        setSortField(f);
        setSortOrder(o);
      }
    }
  }, [urlBranch, urlStatus, urlSearch, urlSort, isBranchManager]);

  const updateUrlParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === "ALL" || (key === "search" && !val.trim())) {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | undefined>(undefined);
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Map tồn kho hiện tại để truyền cho RestockModal
  const currentStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredInventory.forEach((item) => {
      map[item.product_id] = item.quantity;
    });
    return map;
  }, [filteredInventory]);

  // Lịch sử giao dịch kho
  const [transactions, setTransactions] = useState<StockTransactionRecord[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [activeTab, setActiveTab] = useState<"stocks" | "transactions">("stocks");

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const txList = await inventoryApi.getTransactions();
      setTransactions(txList || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  // Phân trang danh sách tồn kho
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, activeBranchId, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pageSize));
  const paginatedInventory = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleSort = (field: "name" | "quantity" | "available") => {
    const nextOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(nextOrder);
    updateUrlParam({ sort: `${field}-${nextOrder}` });
  };

  const statusChips = [
    { id: "ALL", label: "Tất cả mặt hàng", count: stats.totalSkus, color: "bg-surface-soft text-foreground" },
    { id: "IN_STOCK", label: "Còn hàng (>5)", count: stats.totalSkus - stats.lowStockSkus - stats.outOfStockSkus, color: "bg-pastel-mint text-success-dark" },
    { id: "LOW_STOCK", label: "Sắp hết (1-5)", count: stats.lowStockSkus, color: "bg-warning-pastel text-warning-dark" },
    { id: "OUT_OF_STOCK", label: "Hết hàng (0)", count: stats.outOfStockSkus, color: "bg-danger-pastel text-danger-dark" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Branch Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-tint text-primary-dark border border-primary/25">
              {isBranchManager ? "QUẢN LÝ CHI NHÁNH" : "QUẢN TRỊ VIÊN HỆ THỐNG"}
            </span>

            {/* Khóa chi nhánh cho Manager */}
            {isBranchManager ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-primary-tint text-primary-dark border border-primary/25">
                <Lock className="w-3 h-3 text-primary" />
                Chi nhánh phụ trách: {activeBranch?.name} ({activeBranchId})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-surface-soft text-foreground border border-border">
                <Building2 className="w-3 h-3 text-primary" />
                Chi nhánh đang xem: {activeBranch?.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Quản Lý Tồn Kho Chi Nhánh
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Theo dõi số lượng tồn thực tế, số lượng giữ chỗ tạm thời và phân bổ hàng hóa cho các cửa hàng.
          </p>
        </div>

        {/* Nút Nhập kho & Chọn chi nhánh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isBranchManager && (
            <div className="relative flex items-center bg-surface p-1 rounded-2xl border border-border shadow-xs">
              <span className="text-xs font-bold text-muted px-2 hidden sm:inline">Chi nhánh:</span>
              <select
                aria-label="Chọn chi nhánh quản lý kho"
                value={activeBranchId}
                onChange={(e) => {
                  setActiveBranchId(e.target.value);
                  updateUrlParam({ branchId: e.target.value });
                }}
                className="bg-transparent text-xs font-bold text-foreground py-1.5 px-2 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏪 {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setRestockProductId(undefined);
              setIsRestockModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập hàng vào kho</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            title="Làm mới tồn kho"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-bold">Tổng SKU</span>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {isLoading ? <Skeleton className="h-7 w-16" /> : stats.totalSkus}
          </div>
          <span className="text-[11px] text-muted">Mặt hàng tại chi nhánh</span>
        </Card>

        <Card className="p-4 sm:p-5 border border-border shadow-card bg-surface rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-bold">Tổng sản phẩm tồn</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {isLoading ? <Skeleton className="h-7 w-16" /> : stats.totalQuantity.toLocaleString("vi-VN")}
          </div>
          <span className="text-[11px] text-muted">Tổng lượng hàng trong kho</span>
        </Card>

        <Card className="p-4 sm:p-5 border border-warning/30 shadow-card bg-warning-pastel/30 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-warning-dark text-xs">
            <span className="font-bold">Sắp hết hàng (≤5)</span>
            <AlertTriangle className="w-4 h-4 text-warning-dark" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-warning-dark">
            {isLoading ? <Skeleton className="h-7 w-16" /> : stats.lowStockSkus}
          </div>
          <span className="text-[11px] text-warning-dark font-semibold">SKU cần nhập thêm</span>
        </Card>

        <Card className="p-4 sm:p-5 border border-danger/30 shadow-card bg-danger-pastel/30 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-danger-dark text-xs">
            <span className="font-bold">Hết hàng (0)</span>
            <XCircle className="w-4 h-4 text-danger-dark" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-danger-dark">
            {isLoading ? <Skeleton className="h-7 w-16" /> : stats.outOfStockSkus}
          </div>
          <span className="text-[11px] text-danger-dark font-semibold">Khách không thể mua</span>
        </Card>
      </div>

      {/* Tabs Chuyển đổi: Bảng tồn kho vs Lịch sử giao dịch */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("stocks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "stocks"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface text-muted hover:text-foreground border border-border/60"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Danh Sách Tồn Kho ({filteredInventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface text-muted hover:text-foreground border border-border/60"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch Sử Giao Dịch Kho</span>
        </button>
      </div>

      {activeTab === "stocks" ? (
        <>
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {statusChips.map((chip) => {
              const isActive = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setStatusFilter(chip.id as StockFilterStatus);
                    updateUrlParam({ status: chip.id });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-xs ring-2 ring-primary/20"
                      : "bg-surface hover:bg-surface-soft text-muted hover:text-foreground border border-border/70"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/25 text-white" : chip.color
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bảng Quản Lý Tồn Kho */}
          <Card className="border border-border shadow-card bg-surface overflow-hidden rounded-3xl">
            {/* Controls: Search, Filter Tabs, Sort */}
            <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Tìm theo tên sản phẩm, mã SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    updateUrlParam({ search: e.target.value });
                  }}
                  className="pl-9.5 rounded-xl bg-surface-soft text-xs h-10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Sắp xếp thứ tự */}
                <div className="relative flex items-center min-w-[180px]">
                  <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-muted pointer-events-none" />
                  <select
                    id="inventory-sort-order"
                    aria-label="Sắp xếp danh sách tồn kho"
                    value={`${sortField}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-") as [
                        "name" | "quantity" | "available",
                        "asc" | "desc"
                      ];
                      setSortField(field);
                      setSortOrder(order);
                      updateUrlParam({ sort: `${field}-${order}` });
                    }}
                    className="w-full pl-8.5 pr-8 py-2 rounded-xl border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-xs cursor-pointer appearance-none"
                  >
                    <option value="available-asc">Khả dụng: Thấp &rarr; Cao</option>
                    <option value="available-desc">Khả dụng: Cao &rarr; Thấp</option>
                    <option value="quantity-desc">Tổng tồn: Nhiều nhất</option>
                    <option value="quantity-asc">Tổng tồn: Ít nhất</option>
                    <option value="name-asc">Tên sản phẩm: A &rarr; Z</option>
                    <option value="name-desc">Tên sản phẩm: Z &rarr; A</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>

                {(statusFilter !== "ALL" || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSearchTerm("");
                      updateUrlParam({ status: "ALL", search: null });
                    }}
                    className="text-xs text-danger-dark hover:underline font-bold px-2 py-1"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left" aria-label="Bảng tồn kho chi nhánh">
                <thead className="text-[11px] font-black uppercase text-muted bg-surface-soft border-b border-border">
                  <tr>
                    <th
                      className="px-5 py-3.5 cursor-pointer select-none"
                      onClick={() => handleToggleSort("name")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Sản phẩm</span>
                        <ArrowUpDown className="w-3 h-3 text-muted" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Mã SKU</th>
                    <th
                      className="px-5 py-3.5 text-right cursor-pointer select-none"
                      onClick={() => handleToggleSort("quantity")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Tổng tồn</span>
                        <ArrowUpDown className="w-3 h-3 text-muted" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-right">Đang giữ chỗ</th>
                    <th
                      className="px-5 py-3.5 text-right cursor-pointer select-none"
                      onClick={() => handleToggleSort("available")}
                    >
                      <div className="flex items-center justify-end gap-1.5 text-primary-dark">
                        <span>Khả dụng</span>
                        <ArrowUpDown className="w-3 h-3 text-primary-dark" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-5 py-3.5 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-5 py-3.5 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-5 py-3.5 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="px-5 py-3.5 text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></td>
                        <td className="px-5 py-3.5 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-xl" /></td>
                      </tr>
                    ))
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-muted">
                        Không tìm thấy sản phẩm nào trong kho chi nhánh này phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item) => {
                      const isOut = item.available <= 0;
                      const isLow = item.available > 0 && item.available <= 5;

                      return (
                        <tr key={item.id} className="hover:bg-surface-soft/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-foreground text-sm">{item.product_name}</div>
                            <span className="text-[11px] text-muted font-mono">ID: {item.product_id}</span>
                          </td>

                          <td className="px-5 py-3.5 font-mono text-xs text-muted">{item.sku}</td>

                          <td className="px-5 py-3.5 text-right font-bold text-foreground">
                            {item.quantity}
                          </td>

                          <td className="px-5 py-3.5 text-right text-xs font-semibold text-purple-700">
                            {item.reserved_quantity > 0 ? `+${item.reserved_quantity}` : "0"}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <span
                              className={`font-black text-sm ${
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

                          <td className="px-5 py-3.5 text-center">
                            {isOut ? (
                              <Badge variant="destructive">Hết hàng</Badge>
                            ) : isLow ? (
                              <Badge variant="warning">Sắp hết</Badge>
                            ) : (
                              <Badge variant="success">Còn hàng</Badge>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRestockProductId(item.product_id);
                                setIsRestockModalOpen(true);
                              }}
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/60">
              {paginatedInventory.map((item) => {
                const isOut = item.available <= 0;
                const isLow = item.available > 0 && item.available <= 5;
                return (
                  <div key={item.id} className="p-4 space-y-3 bg-surface">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-foreground truncate">{item.product_name}</h4>
                        <p className="text-[11px] font-mono text-muted">SKU: {item.sku}</p>
                      </div>
                      {isOut ? (
                        <Badge variant="destructive">Hết hàng</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Sắp hết</Badge>
                      ) : (
                        <Badge variant="success">Còn hàng</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-soft text-center text-xs border border-border/60">
                      <div>
                        <span className="text-[10px] text-muted block">Tổng tồn</span>
                        <strong className="font-bold text-foreground">{item.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-700 block">Đang giữ</span>
                        <strong className="font-bold text-purple-700">
                          {item.reserved_quantity > 0 ? `+${item.reserved_quantity}` : "0"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-primary-dark block font-semibold">Khả dụng</span>
                        <strong className="font-black text-primary-dark">{item.available}</strong>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRestockProductId(item.product_id);
                          setIsRestockModalOpen(true);
                        }}
                        className="rounded-xl text-xs font-semibold gap-1.5 h-8 border-primary/30 text-primary-dark hover:bg-primary-tint"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Nhập thêm kho
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs bg-surface-soft/40">
                <span className="text-muted">
                  Trang <b>{page}</b> / <b>{totalPages}</b> ({filteredInventory.length} mặt hàng)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl h-8 text-xs font-semibold"
                  >
                    &larr; Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl h-8 text-xs font-semibold"
                  >
                    Sau &rarr;
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* KHỐI LỊCH SỬ GIAO DỊCH KHO (STOCK TRANSACTIONS TỪ API BE) */
        <Card className="rounded-3xl border border-border shadow-card overflow-hidden bg-surface">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Lịch Sử Biến Động Kho Hàng
              </h3>
              <p className="text-xs text-muted">
                Dữ liệu trích xuất trực tiếp từ bảng <code>stock_transactions</code> qua API <code>GET /inventory/transactions</code>
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              disabled={loadingTx}
              className="rounded-xl text-xs font-bold"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingTx ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Tải lại</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Bảng lịch sử giao dịch kho">
              <thead className="bg-surface-soft text-[11px] font-black uppercase text-muted border-b border-border">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Thời gian</th>
                  <th scope="col" className="py-3.5 px-4">Loại giao dịch</th>
                  <th scope="col" className="py-3.5 px-4">Số lượng</th>
                  <th scope="col" className="py-3.5 px-4">Mã kho (Stock ID)</th>
                  <th scope="col" className="py-3.5 px-4">Mã tham chiếu (Reference ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loadingTx ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-40" /></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      Chưa có bản ghi giao dịch kho nào.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(-25).reverse().map((tx) => {
                    const isPlus = tx.type === "IN";
                    const isMinus = tx.type === "OUT";
                    return (
                      <tr key={tx.id} className="hover:bg-surface-soft/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {new Date(tx.created_at).toLocaleString("vi-VN")}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              tx.type === "IN"
                                ? "bg-pastel-mint text-success-dark border border-success/30"
                                : tx.type === "OUT"
                                ? "bg-danger-pastel text-danger-dark border border-danger/30"
                                : tx.type === "RESERVE"
                                ? "bg-warning-pastel text-warning-dark border border-warning/30"
                                : "bg-primary-tint text-primary-dark border border-primary/30"
                            }`}
                          >
                            {tx.type === "IN"
                              ? "NHẬP KHO (IN)"
                              : tx.type === "OUT"
                              ? "XUẤT KHO (OUT)"
                              : tx.type === "RESERVE"
                              ? "GIỮ CHỖ (RESERVE)"
                              : "HOÀN KHO (CANCEL_RESERVE)"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-black">
                          <span className={isPlus ? "text-success-dark" : isMinus ? "text-danger-dark" : "text-muted"}>
                            {isPlus ? `+${tx.quantity}` : isMinus ? `-${tx.quantity}` : `${tx.quantity}`}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                          {tx.stock_id ? `#${tx.stock_id.slice(0, 8)}` : "-"}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                          {tx.reference_id || "Khởi tạo seed"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockProductId(undefined);
          refetch();
        }}
        branch={activeBranch}
        products={products}
        currentStockMap={currentStockMap}
        initialProductId={restockProductId}
        onRestock={restock}
      />
    </div>
  );
}
