import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Plus,
  ShoppingCart,
  AlertCircle,
  Sparkles,
  Search,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { comboApi, Combo } from "../../../api/comboApi";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ProductImage } from "../../../components/ui/ProductImage";

export function CombosPage() {
  const { selectedBranch } = useBranchStore();
  const { addCombo } = useCartStore();
  const { showToast } = useCartToastStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const enrichedCombos = useMemo(() => {
    return combos.map((combo) => {
      const resolvedItems = (combo.items || []).map((ci) => {
        const found = products.find((p) => p.id === ci.product_id);
        const unitPrice = Number(found?.price ?? ci.original_price ?? 0);
        const stock = stockMap.get(ci.product_id) ?? found?.stock ?? 50;
        const requiredQty = Math.max(1, Number(ci.quantity) || 1);
        return {
          ...ci,
          name: found?.name || ci.product_name || ci.product_id,
          image: found?.images?.[0] || ci.product_image || undefined,
          unitPrice,
          stock,
          requiredQty,
        };
      });

      const originalTotal =
        Number(combo.original_price) > 0
          ? Number(combo.original_price)
          : resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.requiredQty, 0);

      const comboPrice = Number(combo.combo_price);
      const savings = Math.max(0, originalTotal - comboPrice);
      const discountPercent =
        originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

      const outOfStockItems = resolvedItems.filter((item) => item.stock < item.requiredQty);
      const isOutOfStock = outOfStockItems.length > 0;

      const maxComboFromStock =
        resolvedItems.length > 0
          ? Math.min(...resolvedItems.map((i) => Math.floor(i.stock / i.requiredQty)))
          : 0;
      const remainingQuota =
        combo.max_quantity !== null && combo.max_quantity !== undefined
          ? Math.max(0, Number(combo.max_quantity) - Number(combo.sold_count || 0))
          : 99;
      const maxComboStock = Math.max(0, Math.min(maxComboFromStock, remainingQuota));

      return {
        combo,
        resolvedItems,
        originalTotal,
        comboPrice,
        savings,
        discountPercent,
        outOfStockItems,
        isOutOfStock,
        remainingQuota,
        maxComboStock,
      };
    });
  }, [combos, products, stockMap]);

  const filteredCombos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedCombos.filter((entry) => {
      const matchesQuery =
        !q ||
        entry.combo.name.toLowerCase().includes(q) ||
        (entry.combo.description || "").toLowerCase().includes(q) ||
        entry.resolvedItems.some((ri) => ri.name.toLowerCase().includes(q));
      const matchesStock = onlyInStock ? !entry.isOutOfStock && entry.maxComboStock > 0 : true;
      return matchesQuery && matchesStock;
    });
  }, [enrichedCombos, searchQuery, onlyInStock]);

  const handleBuyCombo = (combo: Combo, maxComboStock: number) => {
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
    <div className="min-h-screen bg-background pb-16">
      {/* Banner Header */}
      <div className="bg-gradient-to-b from-pastel-peach/40 via-surface to-background border-b border-border/80 pt-8 pb-10">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl space-y-5">
          <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Combo Tiết Kiệm</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint border border-accent/25 text-xs font-bold text-accent-dark uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mua Chung Giá Rẻ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <span>🔥 Combo Siêu Tiết Kiệm CSM</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted max-w-2xl">
                Lựa chọn các set ăn và thức uống được ghép sẵn với mức giá ưu đãi đặc quyền. Tồn kho được kiểm tra trực tiếp tại chi nhánh{" "}
                <strong className="text-foreground">{selectedBranch?.name || "hiện tại"}</strong>.
              </p>
            </div>

            <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold shrink-0 self-start md:self-auto">
              <Link to="/products" className="flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Xem sản phẩm lẻ</span>
              </Link>
            </Button>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm combo hoặc món trong combo (vd: cà phê, bánh mì, mì ly)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl bg-surface text-xs"
              />
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-border text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span>Chỉ hiện combo còn hàng</span>
            </label>
          </div>
        </div>
      </div>

      {/* Combos Grid */}
      <div className="container mx-auto px-4 md:px-6 max-w-7xl pt-8">
        {isLoadingCombos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-96 bg-surface-soft rounded-3xl border border-border/60 animate-pulse" />
            ))}
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="p-14 rounded-3xl bg-surface border border-border text-center space-y-3 max-w-lg mx-auto shadow-card">
            <Layers className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Không tìm thấy Combo phù hợp</h2>
            <p className="text-xs text-muted">
              Hãy thử từ khóa khác hoặc bỏ lọc chỉ hiện combo còn hàng.
            </p>
            {searchQuery || onlyInStock ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setOnlyInStock(false);
                }}
                className="rounded-2xl text-xs"
              >
                Đặt lại bộ lọc
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCombos.map(
              ({
                combo,
                resolvedItems,
                originalTotal,
                comboPrice,
                savings,
                discountPercent,
                outOfStockItems,
                isOutOfStock,
                remainingQuota,
                maxComboStock,
              }) => (
                <div
                  key={combo.id}
                  className="bg-surface rounded-3xl border border-border/80 hover:border-primary/40 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs bg-amber-100 text-amber-800 border-amber-300">
                      TIẾT KIỆM {formatCurrency(savings)}
                      {discountPercent > 0 ? ` (-${discountPercent}%)` : ""}
                    </span>
                    {combo.max_quantity !== null && combo.max_quantity !== undefined && (
                      <span className="text-[11px] font-bold text-muted font-mono">
                        Còn {remainingQuota} suất
                      </span>
                    )}
                  </div>

                  {/* Combo Title & Description */}
                  <div className="space-y-1 mb-5">
                    <h2 className="text-lg font-black text-foreground">{combo.name}</h2>
                    {combo.description && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {combo.description}
                      </p>
                    )}
                  </div>

                  {/* Visual Packaging */}
                  <div className="relative py-5 my-2 bg-gradient-to-b from-surface-soft/60 via-primary-tint/20 to-surface-soft/60 rounded-3xl border border-border/60 p-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md border-2 border-primary/30 mx-auto flex flex-col items-center justify-center text-primary relative z-10 overflow-hidden">
                      {combo.image_url ? (
                        <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Package className="w-6 h-6 stroke-[2.2]" />
                          <span className="text-[8px] font-black uppercase tracking-wider text-primary-dark mt-0.5">
                            Combo
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-stretch justify-center flex-wrap gap-2 mt-4 relative z-10">
                      {resolvedItems.map((item, itemIdx) => {
                        const itemOutOfStock = item.stock < item.requiredQty;
                        return (
                          <React.Fragment key={`${item.product_id}-${itemIdx}`}>
                            {itemIdx > 0 && (
                              <div className="flex items-center justify-center text-primary font-black">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-[80px] max-w-[115px] flex flex-col items-center text-center p-2 rounded-2xl bg-surface/90 border border-border/80 shadow-2xs relative">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-soft border border-border/60 mb-1.5 relative">
                                <ProductImage
                                  src={item.image}
                                  alt={item.name}
                                  productName={item.name}
                                  className="w-full h-full object-cover"
                                  iconClassName="w-4 h-4 text-primary"
                                  loading="lazy"
                                />
                                {itemOutOfStock && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-white">Hết</span>
                                  </div>
                                )}
                              </div>
                              <span
                                className="text-[11px] font-bold text-foreground line-clamp-1 w-full truncate"
                                title={item.name}
                              >
                                {item.name}
                              </span>
                              <span className="text-[10px] text-muted font-medium mt-0.5">
                                {item.requiredQty > 1 ? `x${item.requiredQty} · ` : ""}
                                {formatCurrency(item.unitPrice)}
                              </span>
                              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                                {item.requiredQty}
                              </span>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Warning */}
                  {isOutOfStock && (
                    <div className="mt-4 p-2.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                      <span>
                        Tạm hết món:{" "}
                        <strong>{outOfStockItems.map((i) => i.name).join(", ")}</strong> tại{" "}
                        {selectedBranch?.name || "chi nhánh này"}
                      </span>
                    </div>
                  )}

                  {/* Pricing & CTA */}
                  <div className="pt-5 border-t border-border/60 mt-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-muted line-through">
                        {formatCurrency(originalTotal)}
                      </div>
                      <div className="text-xl font-black text-rose-600 font-mono">
                        {formatCurrency(comboPrice)}
                      </div>
                    </div>

                    <Button
                      disabled={isOutOfStock || maxComboStock <= 0}
                      onClick={() => handleBuyCombo(combo, maxComboStock)}
                      className="rounded-2xl text-xs font-bold gap-1.5 shadow-sm px-4 h-10 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isOutOfStock ? "Tạm hết hàng" : "Thêm Combo Vào Giỏ"}</span>
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
