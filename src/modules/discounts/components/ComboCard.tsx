import React from "react";
import { Package, Plus, ShoppingCart, AlertCircle } from "lucide-react";
import { Combo } from "../../../api/comboApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { ProductImage } from "../../../components/ui/ProductImage";

interface ComboCardProps {
  combo: Combo;
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
  onBuyCombo: (combo: Combo, maxComboStock: number, e: React.MouseEvent) => void;
}

export function resolveComboMetrics(
  combo: Combo,
  products: Product[],
  stockMap: Map<string, number>
) {
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
}

export function ComboCard({
  combo,
  products,
  stockMap,
  branchName,
  onBuyCombo,
}: ComboCardProps) {
  const {
    resolvedItems,
    originalTotal,
    comboPrice,
    savings,
    discountPercent,
    outOfStockItems,
    isOutOfStock,
    remainingQuota,
    maxComboStock,
  } = resolveComboMetrics(combo, products, stockMap);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  return (
    <div className="bg-surface rounded-3xl border border-border/80 hover:border-primary/40 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Top Badge */}
      <div>
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
          <h3 className="text-lg font-black text-foreground">{combo.name}</h3>
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

          <div className="flex items-stretch justify-center flex-wrap gap-2 mt-4 relative z-10 max-h-56 overflow-y-auto pr-1">
            {resolvedItems.map((item, itemIdx) => {
              const itemOutOfStock = item.stock < item.requiredQty;
              return (
                // Gộp dấu "+" với món phía sau để khi xuống dòng dấu cộng không bị treo ở cuối dòng
                <div
                  key={`${item.product_id}-${itemIdx}`}
                  className="flex items-center gap-2 flex-1 min-w-[80px] max-w-[140px]"
                >
                  {itemIdx > 0 && (
                    <div className="flex items-center justify-center text-primary font-black shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col items-center text-center p-2 rounded-2xl bg-surface/90 border border-border/80 shadow-2xs relative">
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
                </div>
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
              {branchName || "chi nhánh này"}
            </span>
          </div>
        )}
      </div>

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
          onClick={(e) => onBuyCombo(combo, maxComboStock, e)}
          className="rounded-2xl text-xs font-bold gap-1.5 shadow-sm px-4 h-10 cursor-pointer"
          aria-label={`Thêm ${combo.name} vào giỏ`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isOutOfStock ? "Tạm hết hàng" : "Thêm Combo Vào Giỏ"}</span>
        </Button>
      </div>
    </div>
  );
}
