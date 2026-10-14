import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { ArrowRight, Sparkles, Store, Utensils } from "lucide-react";
import { HeroOrbitBanner } from "../components/HeroOrbitBanner";
import { HeroPromoSlider } from "../components/HeroPromoSlider";
import { FlashSaleSection } from "../components/FlashSaleSection";
import { WhyChooseUsSection } from "../components/WhyChooseUsSection";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { productApi } from "../../../api/productApi";
import { inventoryApi } from "../../../api/inventoryApi";
import { useBranchStore } from "../../../store/useBranchStore";
import { ProductCard } from "../../products/components/ProductCard";
import { Skeleton } from "../../../components/ui/Skeleton";

const CATEGORY_STYLES = [
  { emoji: "🧃", color: "bg-pastel-sky/60", border: "border-info/20" },
  { emoji: "🍙", color: "bg-pastel-peach/60", border: "border-accent/20" },
  { emoji: "🍪", color: "bg-pastel-butter/60", border: "border-warning/20" },
  { emoji: "🧴", color: "bg-pastel-lavender/60", border: "border-primary/20" },
  { emoji: "🍜", color: "bg-pastel-rose/60", border: "border-rose-200" },
  { emoji: "☕", color: "bg-pastel-mint/60", border: "border-primary/20" },
];

export function HomePage() {
  const { selectedBranch } = useBranchStore();
  const shouldReduceMotion = useReducedMotion();

  // 1. Lấy danh mục từ API
  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: productApi.getCategories,
  });

  // 2. Lấy sản phẩm nổi bật từ API
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
  });

  // 3. Lấy tồn kho của chi nhánh đang chọn một lần
  const { data: branchInventory = [] } = useQuery({
    queryKey: ["inventory", "branch", selectedBranch?.id],
    queryFn: () => inventoryApi.getInventoryByBranch(selectedBranch!.id),
    enabled: !!selectedBranch?.id,
  });

  // Map product_id -> available stock
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    branchInventory.forEach((item) => {
      map.set(item.product_id, item.available ?? (item.quantity - item.reserved_quantity));
    });
    return map;
  }, [branchInventory]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Promo Banner Slider */}
      <section className="pt-6 pb-2 sm:pt-8 sm:pb-4 bg-gradient-to-b from-primary-tint/40 to-background">
        <div className="container mx-auto px-4 md:px-6">
          <HeroPromoSlider />
        </div>
      </section>

      {/* Quick Meal & Combo Interactive Station */}
      <section className="py-8 sm:py-10 bg-gradient-to-b from-background via-primary-tint/25 to-surface-soft/50 border-b border-border/80">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-5 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-primary/25 shadow-xs w-fit">
                <Utensils className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-bold text-primary-dark uppercase tracking-wider">
                  Gợi ý combo tiện lợi
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                  Bữa Ăn Nhanh Tiện Lợi <br />
                  <span className="text-primary underline decoration-pastel-peach decoration-wavy decoration-2">
                    Nạp Năng Lượng Tức Thì
                  </span>
                </h2>
                <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-lg">
                  Không cần chờ đợi lâu! Chỉ với vài thao tác đơn giản, chọn ngay combo bữa sáng, trưa hoặc ăn nhẹ kèm thức uống mát lạnh sẵn sàng phục vụ 24/7.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" asChild className="w-full sm:w-auto rounded-2xl shadow-sm text-xs sm:text-sm font-semibold">
                  <Link to="/products" className="flex items-center gap-2">
                    <span>Khám phá toàn bộ thực đơn</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-2xl text-xs sm:text-sm font-semibold">
                  <Link to="/products?q=combo">
                    Xem combo ưu đãi
                  </Link>
                </Button>
              </div>

              {/* Mini highlights */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/80 text-[11px] font-medium text-muted">
                <div>
                  <span className="block font-bold text-foreground text-xs sm:text-sm">24/7</span>
                  <span>Phục vụ liên tục</span>
                </div>
                <div>
                  <span className="block font-bold text-foreground text-xs sm:text-sm">30 Phút</span>
                  <span>Giao siêu tốc</span>
                </div>
                <div>
                  <span className="block font-bold text-foreground text-xs sm:text-sm">100%</span>
                  <span>Tươi ngon mỗi ngày</span>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Orbiting Combo Banner */}
            <div className="lg:col-span-6 flex justify-center items-center">
              <HeroOrbitBanner />
            </div>
          </div>
        </div>
      </section>

      {/* Flash Sale Section (Giờ vàng giảm giá với countdown & sold progress) */}
      <FlashSaleSection
        products={products}
        stockMap={stockMap}
        branchName={selectedBranch?.name}
      />

      {/* Featured Categories (Từ GET /categories với hiệu ứng Pastel Motion) */}
      <section className="py-14 sm:py-18 bg-surface-soft/60 border-b border-border/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider bg-surface px-3 py-1 rounded-full border border-primary/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Khám phá theo danh mục</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Danh Mục Nổi Bật</h2>
            <p className="text-muted text-xs sm:text-sm max-w-md mx-auto">
              Lựa chọn các nhóm mặt hàng thiết yếu hàng ngày với tiêu chuẩn chất lượng cao nhất.
            </p>
          </div>

          {isLoadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-6 rounded-3xl bg-surface border border-border flex flex-col items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <Skeleton className="w-20 h-4 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {categories.map((cat, i) => {
                const style = CATEGORY_STYLES[i % CATEGORY_STYLES.length];
                return (
                  <motion.div
                    key={cat.id}
                    whileHover={shouldReduceMotion ? {} : { y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={`/products?category=${cat.id}`}
                      className={`h-full p-5 sm:p-6 rounded-3xl ${style.color} border ${style.border} flex flex-col items-center text-center shadow-card hover:shadow-card-hover transition-all duration-200 block`}
                    >
                      <div className="text-3xl sm:text-4xl mb-2.5 transition-transform duration-200 group-hover:scale-110">
                        {style.emoji}
                      </div>
                      <h3 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">{cat.name}</h3>
                      <span className="text-[11px] text-muted mt-1 line-clamp-1">
                        {cat.description || "Khám phá"}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products (Từ GET /products kèm tồn kho theo chi nhánh) */}
      <section className="py-14 sm:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider bg-primary-tint/60 px-3 py-1 rounded-full border border-primary/20 shadow-xs mb-2.5">
                <Store className="w-3.5 h-3.5" />
                Sản phẩm sẵn có tại {selectedBranch ? selectedBranch.name : "cửa hàng"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Sản Phẩm Tươi Mới Trong Ngày
              </h2>
            </div>
            <Button variant="outline" asChild className="rounded-2xl text-xs sm:text-sm font-semibold">
              <Link to="/products" className="flex items-center gap-1.5">
                Xem tất cả ({products.length})
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-3xl border border-border bg-surface p-4 space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.slice(0, 8).map((product) => {
                const availableStock = stockMap.get(product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    availableStock={availableStock}
                    branchName={selectedBranch?.name}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section (4 giá trị cốt lõi) */}
      <WhyChooseUsSection />

      {/* Customer Testimonials Section (Đánh giá khách hàng) */}
      <TestimonialsSection />
    </div>
  );
}

