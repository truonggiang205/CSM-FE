import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, ShoppingBag, Sparkles, Heart, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { ProductImage } from "../../../components/ui/ProductImage";
import { Button } from "../../../components/ui/Button";
import { mockCsmPickMetadata } from "../../../mocks/brandMock";

interface CsmPicksSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
}

export function CsmPicksSection({ products, stockMap, branchName }: CsmPicksSectionProps) {
  const { addItem } = useCartStore();
  const { showToast } = useCartToastStore();
  const shouldReduceMotion = useReducedMotion();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Chọn 4 sản phẩm đặc trưng của cửa hàng (ưu tiên p2, p4, p5, p3 hoặc 4 sản phẩm đầu tiên)
  const pickIds = ["p2", "p4", "p5", "p3"];
  const pickedProducts: Product[] = [];

  for (const id of pickIds) {
    const found = products.find((p) => p.id === id);
    if (found) pickedProducts.push(found);
  }

  // Nếu thiếu thì bổ sung từ products chung
  if (pickedProducts.length < 4) {
    for (const p of products) {
      if (!pickedProducts.some((item) => item.id === p.id)) {
        pickedProducts.push(p);
      }
      if (pickedProducts.length === 4) break;
    }
  }

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    showToast(product.name);
  };

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-surface to-surface-soft/40 border-b border-border/70 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-tint/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pastel-peach/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative">
        {/* Editorial Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-surface border border-primary/30 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-accent-dark" />
            <span className="text-[11px] font-bold text-primary-dark tracking-widest uppercase">
              CSM Curated Collection
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-serif italic">
            CSM Picks
            <span className="not-italic font-sans text-2xl sm:text-3xl font-extrabold text-foreground ml-2">
              — Món Ngon Chọn Lọc
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans max-w-lg mx-auto">
            Những hương vị được đội ngũ CSM đặc biệt yêu thích và giới thiệu trong tuần. Tuyển chọn khắt khe từ nguồn gốc nguyên liệu đến độ tươi mới để gửi gắm trọn vẹn đến bạn.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pickedProducts.map((product, idx) => {
            const availableStock = stockMap.get(product.id) ?? product.stock;
            const isOutOfStock = availableStock <= 0;
            const meta = mockCsmPickMetadata[product.id] || {
              tagline: "Hương vị tinh hoa",
              curatorNote: "Sản phẩm chọn lọc với chất lượng hảo hạng và độ tươi mới mỗi ngày.",
              pairingNote: "Phù hợp cho mọi bữa ăn nhẹ tiện lợi.",
            };

            const price = product.discountPrice || product.price;

            return (
              <motion.div
                key={product.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="group flex flex-col justify-between bg-surface rounded-3xl border border-border/80 hover:border-primary/40 shadow-card hover:shadow-card-hover transition-all duration-300 p-5 relative overflow-hidden"
              >
                {/* Badge "CSM Pick" */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-black tracking-wide shadow-md">
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>CSM Pick</span>
                </div>

                {/* Wishlist subtle indicator */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="w-8 h-8 rounded-full bg-surface/90 backdrop-blur-xs border border-border flex items-center justify-center text-rose-500 shadow-2xs">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>

                <div>
                  {/* Image container */}
                  <Link
                    to={`/products/${product.id}`}
                    className="block aspect-square w-full rounded-2xl overflow-hidden bg-surface-soft border border-border/50 mb-4 mt-8 relative"
                  >
                    <ProductImage
                      src={product.images && product.images[0]}
                      alt={product.name}
                      productName={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      loading="lazy"
                    />
                  </Link>

                  {/* Category & Tagline */}
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-bold text-accent-dark uppercase tracking-wider block">
                      {meta.tagline}
                    </span>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  {/* Editorial Curator Note */}
                  <div className="p-2.5 rounded-xl bg-surface-soft/80 border border-border/60 text-[11px] text-muted italic leading-relaxed mb-3">
                    &ldquo;{meta.curatorNote}&rdquo;
                  </div>
                </div>

                {/* Bottom Row: Price & Add Button */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                  <div>
                    <span className="text-xs text-muted block">Giá ưu đãi</span>
                    <span className="text-base font-black text-primary-dark font-mono">
                      {formatCurrency(price)}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    disabled={isOutOfStock}
                    onClick={(e) => handleAddToCart(product, e)}
                    className="rounded-2xl text-xs font-bold gap-1.5 shadow-2xs cursor-pointer h-9 px-3.5"
                    aria-label={`Thêm ${product.name} vào giỏ hàng`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? "Hết hàng" : "Thêm giỏ"}</span>
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
