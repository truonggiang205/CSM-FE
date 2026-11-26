import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Layers } from "lucide-react";
import { comboApi, Combo } from "../../../api/comboApi";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ComboCard, resolveComboMetrics } from "./ComboCard";

interface ComboCatalogProps {
  showSearchBar?: boolean;
}

export function ComboCatalog({ showSearchBar = true }: ComboCatalogProps) {
  const { selectedBranch } = useBranchStore();
  const { addCombo } = useCartStore();
  const { showToast } = useCartToastStore();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: combos = [], isLoading: isLoadingCombos } = useQuery({
    queryKey: ["public-combos"],
    queryFn: comboApi.getPublicCombos,
    refetchInterval: 30000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productApi.getProducts(),
  });

  const activeBranchId = selectedBranch?.id || "br-01";
  const { data: branchInventory = [] } = useQuery({
    queryKey: ["inventory", "branch", activeBranchId],
    queryFn: () => inventoryApi.getInventoryByBranch(activeBranchId),
    enabled: !!activeBranchId,
  });

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    branchInventory.forEach((item) => {
      const avail =
        item.available ??
        Math.max(0, (Number(item.quantity) || 0) - (Number(item.reserved_quantity) || 0));
      if (item.product_id) map.set(String(item.product_id), avail);
      if (item.sku) map.set(String(item.sku), avail);
    });
    return map;
  }, [branchInventory]);

  const filteredCombos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combos.filter((combo) => {
      if (!q) return true;
      const metrics = resolveComboMetrics(combo, products, stockMap);
      return (
        combo.name.toLowerCase().includes(q) ||
        (combo.description || "").toLowerCase().includes(q) ||
        metrics.resolvedItems.some((ri) => ri.name.toLowerCase().includes(q))
      );
    });
  }, [combos, products, stockMap, searchQuery]);

  const handleBuyCombo = (combo: Combo, maxComboStock: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const enriched: Combo = {
      ...combo,
      items: (combo.items || []).map((ci) => {
        const found = products.find((p) => p.id === ci.product_id);
        return {
          ...ci,
          product_name: found?.name || ci.product_name || ci.product_id,
          product_image: found?.images?.[0] || ci.product_image || null,
          original_price: Number(found?.price || ci.original_price || 0),
        };
      }),
    };
    addCombo(enriched, maxComboStock, 1);
    showToast(`Đã thêm ${combo.name} vào giỏ hàng`);
  };

  return (
    <div className="space-y-6">
      {showSearchBar && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Tìm combo hoặc món trong combo (vd: cà phê, bánh mì, mì ly)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl bg-surface text-xs"
            />
          </div>
        </div>
      )}

      {isLoadingCombos ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-96 bg-surface-soft rounded-3xl border border-border/60 animate-pulse" />
          ))}
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="p-14 rounded-3xl bg-surface border border-border text-center space-y-3 max-w-lg mx-auto shadow-card">
          <Layers className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Không tìm thấy Combo phù hợp</h2>
          <p className="text-xs text-muted">
            Hãy thử từ khóa khác để tìm kiếm Combo phù hợp.
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="rounded-2xl text-xs"
            >
              Xoá từ khóa tìm kiếm
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCombos.map((combo) => (
            <ComboCard
              key={combo.id}
              combo={combo}
              products={products}
              stockMap={stockMap}
              branchName={selectedBranch?.name}
              onBuyCombo={handleBuyCombo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
