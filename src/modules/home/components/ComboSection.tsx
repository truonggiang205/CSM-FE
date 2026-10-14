import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Package, Plus, ShoppingCart, Check, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { ProductImage } from "../../../components/ui/ProductImage";
import { Button } from "../../../components/ui/Button";
import { mockCombos, ComboItem } from "../../../mocks/brandMock";

interface ComboSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
}

export function ComboSection({ products, stockMap, branchName }: ComboSectionProps) {
  const { addItem } = useCartStore();
  const { showToast } = useCartToastStore();
  const shouldReduceMotion = useReducedMotion();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Helper để lấy 3 sản phẩm theo ID từ danh sách sản phẩm thật
  const getComboProducts = (combo: ComboItem): Product[] => {
    return combo.productIds.map((id, index) => {
      const found = products.find((p) => p.id === id);
      if (found) return found;
      // Fallback nếu sản phẩm chưa tồn tại
      return {
        id: `fb-${combo.id}-${index}`,
        name: index === 0 ? "Bánh mì tươi" : index === 1 ? "Cà phê sữa" : "Snack giòn",
        slug: "san-pham-combo",
        price: 20000,
        description: "Món ăn trong combo",
        images: [],
        category: { id: "cat-1", name: "Combo" },
        stock: 50,
      };
    });
  };

  const handleBuyCombo = (combo: ComboItem, comboItems: Product[], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Thêm đủ cả 3 sản phẩm vào giỏ hàng bằng addItem hiện có
    comboItems.forEach((product) => {
      addItem(product, 1);
    });

    showToast(`Đã thêm ${combo.name} (3 món)`);
  };

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-surface-soft/50 via-background to-surface-soft/40 border-b border-border/70 relative">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent-dark border border-accent/25 shadow-2xs text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiết Kiệm Lên Đến 20%</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              Combo Tiết Kiệm — Trọn Vẹn Bữa Ăn
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xl">
              Các set ăn được ghép hoàn hảo giữa món chính, đồ uống và món ăn vặt. Mua trọn bộ một chạm với mức giá ưu đãi đặc quyền.
            </p>
          </div>

          <Button variant="outline" asChild className="rounded-2xl text-xs sm:text-sm font-semibold shrink-0">
            <Link to="/products?q=combo" className="flex items-center gap-1.5">
              <span>Xem tất cả combo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* 3 Combo Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {mockCombos.map((combo, comboIdx) => {
            const comboItems = getComboProducts(combo);

            // Tính giá gốc từ các sản phẩm thật qua Number()
            const originalTotal = comboItems.reduce(
              (sum, item) => sum + Number(item.discountPrice || item.price),
              0
            );

            // Giá combo sau khi áp dụng % giảm giá
            const comboPrice =
              Math.round((originalTotal * (1 - combo.discountPercent / 100)) / 1000) * 1000;
            const savings = originalTotal - comboPrice;

            // Kiểm tra tồn kho tại chi nhánh: nếu bất kỳ món nào hết hàng thì báo rõ và disabled
            const outOfStockItems = comboItems.filter((item) => {
              const stock = stockMap.get(item.id) ?? item.stock;
              return stock <= 0;
            });
            const isOutOfStock = outOfStockItems.length > 0;

            return (
              <motion.div
                key={combo.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: comboIdx * 0.1 }}
                className="bg-surface rounded-3xl border border-border/80 hover:border-primary/40 shadow-card hover:shadow-card-hover transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs ${combo.badgeColor}`}
                  >
                    {combo.badge}
                  </span>
                  <span className="text-xs font-bold text-accent font-mono">
                    Tiết kiệm {formatCurrency(savings)}
                  </span>
                </div>

                {/* Combo Title & Tagline */}
                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-black text-foreground">{combo.name}</h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {combo.tagline}
                  </p>
                </div>

                {/* Visual Packaging: 3 Sản phẩm quanh 1 chiếc Hộp trung tâm */}
                <div className="relative py-6 my-2 bg-gradient-to-b from-surface-soft/60 via-primary-tint/20 to-surface-soft/60 rounded-3xl border border-border/60 p-4">
                  {/* Central Box / Packaging Hub */}
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-primary/30 mx-auto flex flex-col items-center justify-center text-primary relative z-10">
                    <Package className="w-7 h-7 stroke-[2.2]" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary-dark mt-0.5">
                      CSM Box
                    </span>
                    {/* Ring ping animation */}
                    <span className="absolute -inset-1 rounded-2xl border border-primary/20 animate-pulse pointer-events-none" />
                  </div>

                  {/* 3 Products positioned around the central box */}
                  <div className="grid grid-cols-3 gap-2 mt-5 relative z-10">
                    {comboItems.map((item, itemIdx) => {
                      const itemPrice = item.discountPrice || item.price;
                      const itemStock = stockMap.get(item.id) ?? item.stock;
                      const itemOutOfStock = itemStock <= 0;

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col items-center text-center p-2 rounded-2xl bg-surface/90 border border-border/80 shadow-2xs relative group/item"
                        >
                          {/* Image thumbnail */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-soft border border-border/60 mb-1.5 relative">
                            <ProductImage
                              src={item.images && item.images[0]}
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

                          {/* Item name */}
                          <span
                            className="text-[11px] font-bold text-foreground line-clamp-1 w-full truncate"
                            title={item.name}
                          >
                            {item.name}
                          </span>

                          {/* Item individual price */}
                          <span className="text-[10px] text-muted font-medium mt-0.5">
                            {formatCurrency(Number(itemPrice))}
                          </span>

                          {/* Badge ordinal */}
                          <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                            {itemIdx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Warning Notice if any item is out of stock */}
                {isOutOfStock && (
                  <div className="mt-4 p-2.5 rounded-2xl bg-danger-pastel/70 border border-danger/30 text-danger-dark text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                    <span>
                      Tạm hết món:{" "}
                      <strong>{outOfStockItems.map((i) => i.name).join(", ")}</strong> tại chi nhánh{" "}
                      {branchName || "này"}
                    </span>
                  </div>
                )}

                {/* Pricing & CTA */}
                <div className="pt-5 border-t border-border/60 mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-muted line-through">
                      Giá gốc: {formatCurrency(originalTotal)}
                    </div>
                    <div className="text-xl font-black text-primary-dark font-mono">
                      {formatCurrency(comboPrice)}
                    </div>
                  </div>

                  <Button
                    disabled={isOutOfStock}
                    onClick={(e) => handleBuyCombo(combo, comboItems, e)}
                    className="rounded-2xl text-xs font-bold gap-1.5 shadow-sm px-4 h-10 cursor-pointer"
                    aria-label={`Mua ${combo.name}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isOutOfStock ? "Tạm hết hàng" : "Mua combo"}</span>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
