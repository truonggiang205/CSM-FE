import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { Button } from "../../../components/ui/Button";
import { comboApi, Combo } from "../../../api/comboApi";
import { ComboCard } from "../../discounts/components/ComboCard";

interface ComboSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
}

export function ComboSection({ products, stockMap, branchName }: ComboSectionProps) {
  const { addCombo } = useCartStore();
  const { showToast } = useCartToastStore();
  const shouldReduceMotion = useReducedMotion();

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["public-combos"],
    queryFn: comboApi.getPublicCombos,
    refetchInterval: 30000,
  });

  const handleBuyCombo = (combo: Combo, maxComboStock: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const enrichedCombo: Combo = {
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

    addCombo(enrichedCombo, maxComboStock, 1);
    showToast(`Đã thêm ${combo.name} vào giỏ hàng`);
  };

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-surface-soft/50 via-background to-surface-soft/40 border-b border-border/70">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-8 w-72 bg-surface-soft rounded-2xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-96 bg-surface-soft rounded-3xl border border-border/60 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (combos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-surface-soft/50 via-background to-surface-soft/40 border-b border-border/70 relative">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent-dark border border-accent/25 shadow-2xs text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mua Chung Giá Rẻ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              🔥 COMBO SIÊU TIẾT KIỆM - MUA CHUNG GIÁ RẺ
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-xl">
              Các set ăn được ghép hoàn hảo giữa món chính, đồ uống và món ăn vặt. Mua trọn bộ một chạm với mức giá ưu đãi đặc quyền.
            </p>
          </div>

          <Button variant="outline" asChild className="rounded-2xl text-xs sm:text-sm font-semibold shrink-0">
            <Link to="/deals?tab=combo" className="flex items-center gap-1.5">
              <span>Xem thêm combo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Combo Cards Grid (Reusing ComboCard) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {combos.map((combo, comboIdx) => (
            <motion.div
              key={combo.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: comboIdx * 0.08 }}
            >
              <ComboCard
                combo={combo}
                products={products}
                stockMap={stockMap}
                branchName={branchName}
                onBuyCombo={handleBuyCombo}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
