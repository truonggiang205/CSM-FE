import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../../../api/inventoryApi";
import { branchApi } from "../../../api/branchApi";
import { productApi } from "../../../api/productApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { AddStockPayload, StockStats } from "../../../types/inventory";

export type StockFilterStatus = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function useInventoryDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isBranchManager = user?.role === "BRANCH_MANAGER";
  const defaultBranchId = isBranchManager && user?.branch_id ? user.branch_id : "br-01";

  const [selectedBranchId, setSelectedBranchId] = useState<string>(defaultBranchId);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockFilterStatus>("ALL");
  const [sortField, setSortField] = useState<"name" | "quantity" | "available">("available");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 1. Lấy danh sách chi nhánh
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: branchApi.getBranches,
  });

  // 2. Lấy danh sách sản phẩm để làm giàu thông tin tên/SKU/ảnh
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
  });

  // Map product_id -> Product
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Đảm bảo activeBranchId hợp lệ
  const activeBranchId = useMemo(() => {
    if (isBranchManager && user?.branch_id) {
      return user.branch_id;
    }
    return selectedBranchId || (branches[0]?.id ?? "br-01");
  }, [isBranchManager, user?.branch_id, selectedBranchId, branches]);

  // 3. Lấy tồn kho của chi nhánh
  const {
    data: rawInventory = [],
    isLoading: isLoadingInventory,
    isError: isErrorInventory,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ["inventory", "branch", activeBranchId],
    queryFn: () => inventoryApi.getInventoryByBranch(activeBranchId),
    enabled: !!activeBranchId,
  });

  // Làm giàu dữ liệu tồn kho với thông tin Product
  const enrichedInventory = useMemo(() => {
    return rawInventory.map((item) => {
      const prod = productMap.get(item.product_id);
      const available = Math.max(0, (Number(item.quantity) || 0) - (Number(item.reserved_quantity) || 0));
      return {
        ...item,
        quantity: Number(item.quantity) || 0,
        reserved_quantity: Number(item.reserved_quantity) || 0,
        available,
        product_name: item.product_name || prod?.name || `Sản phẩm #${item.product_id}`,
        sku: item.sku || prod?.sku || `SKU-${item.product_id.slice(0, 6)}`,
        price: item.price || prod?.price || 0,
        image_url: prod?.images?.[0],
      };
    });
  }, [rawInventory, productMap]);

  // Tính toán số liệu thống kê (Stats Cards)
  const stats: StockStats = useMemo(() => {
    let totalQuantity = 0;
    let totalReserved = 0;
    let lowStockSkus = 0;
    let outOfStockSkus = 0;

    enrichedInventory.forEach((item) => {
      totalQuantity += item.quantity;
      totalReserved += item.reserved_quantity;
      if (item.available <= 0) {
        outOfStockSkus += 1;
      } else if (item.available <= 5) {
        lowStockSkus += 1;
      }
    });

    return {
      totalSkus: enrichedInventory.length,
      totalQuantity,
      lowStockSkus,
      outOfStockSkus,
      totalReserved,
    };
  }, [enrichedInventory]);

  // Dữ liệu cho biểu đồ Recharts
  const chartData = useMemo(() => {
    // 1. Top 5 sản phẩm tồn thấp nhất
    const lowestStockProducts = [...enrichedInventory]
      .sort((a, b) => a.available - b.available)
      .slice(0, 5)
      .map((item) => ({
        name: item.product_name.length > 14 ? item.product_name.slice(0, 14) + "…" : item.product_name,
        available: item.available,
        reserved: item.reserved_quantity,
      }));

    // 2. Tỷ lệ trạng thái tồn kho
    const inStockCount = enrichedInventory.filter((i) => i.available > 5).length;
    const statusDistribution = [
      { name: "Còn hàng (>5)", value: inStockCount, color: "#4E9F76" },
      { name: "Sắp hết (1-5)", value: stats.lowStockSkus, color: "#F59E6C" },
      { name: "Hết hàng (0)", value: stats.outOfStockSkus, color: "#EF4444" },
    ].filter((item) => item.value > 0);

    return { lowestStockProducts, statusDistribution };
  }, [enrichedInventory, stats]);

  // Danh sách đã lọc và sắp xếp
  const filteredInventory = useMemo(() => {
    let result = enrichedInventory.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.product_name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === "IN_STOCK") return item.available > 5;
      if (statusFilter === "LOW_STOCK") return item.available > 0 && item.available <= 5;
      if (statusFilter === "OUT_OF_STOCK") return item.available <= 0;

      return true;
    });

    result.sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.product_name.localeCompare(b.product_name, "vi")
          : b.product_name.localeCompare(a.product_name, "vi");
      }
      const valA = sortField === "quantity" ? a.quantity : a.available;
      const valB = sortField === "quantity" ? b.quantity : b.available;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [enrichedInventory, searchTerm, statusFilter, sortField, sortOrder]);

  // Mutation Nhập kho
  const restockMutation = useMutation({
    mutationFn: (payload: AddStockPayload) => inventoryApi.addStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "branch", activeBranchId] });
    },
  });

  return {
    branches,
    products,
    activeBranchId,
    setActiveBranchId: setSelectedBranchId,
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
    isLoading: isLoadingBranches || isLoadingInventory || isLoadingProducts,
    isError: isErrorInventory,
    refetch: refetchInventory,
    restock: restockMutation.mutateAsync,
    isRestocking: restockMutation.isPending,
  };
}
