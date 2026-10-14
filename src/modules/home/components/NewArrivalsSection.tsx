import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { ProductCard } from "../../products/components/ProductCard";
import { Button } from "../../../components/ui/Button";

interface NewArrivalsSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
  onQuickView?: (product: Product) => void;
}

export function NewArrivalsSection({
  products,
  stockMap,
  branchName,
  onQuickView,
}: NewArrivalsSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  // Sắp xếp sản phẩm theo ngày tạo mới nhất (nếu có createdAt)
  const newProducts = useMemo(() => {
    const list = [...products];
    return list
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Fallback: ưu tiên các id mới hoặc đảo ngược danh sách ban đầu
        return b.id.localeCompare(a.id);
      })
      .slice(0, 4);
  }, [products]);

  return (
    <section className="py-14 sm:py-20 bg-background border-b border-border/70 relative">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 shadow-2xs text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vừa Cập Nhật Tại Quầy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <span>Mới Lên Kệ Tuần Này</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-white font-black tracking-wide align-middle">
                Mới
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg">
              Khám phá các món ăn vặt, nước giải khát theo xu hướng mới nhất vừa cập bến các kệ hàng của CSM.
            </p>
          </div>

          <Button variant="outline" asChild className="rounded-2xl text-xs sm:text-sm font-semibold shrink-0">
            <Link to="/products?sort=newest" className="flex items-center gap-1.5">
              <span>Xem hàng mới về</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Grid with whileInView scroll reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newProducts.map((product, index) => {
            const availableStock = stockMap.get(product.id) ?? product.stock;

            return (
              <motion.div
                key={product.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
                className="relative"
              >
                {/* Custom Floating 'Mới' Badge over ProductCard */}
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-md border border-white/20">
                    <Sparkles className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                    <span>Mới</span>
                  </span>
                </div>

                <ProductCard
                  product={product}
                  availableStock={availableStock}
                  branchName={branchName}
                  onQuickView={onQuickView}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
