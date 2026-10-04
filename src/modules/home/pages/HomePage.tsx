import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { ArrowRight, Sparkles, Clock, ShieldCheck, Truck, MapPin, Store } from "lucide-react";
import { HeroOrbitBanner } from "../components/HeroOrbitBanner";
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
  const { selectedBranch, openModal } = useBranchStore();

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
      {/* Branch Notice Banner */}
      <div className="bg-primary-tint/70 border-b border-primary/20 px-4 py-2.5 text-xs text-primary-dark">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>
              Đang xem giá & tồn kho tại:{" "}
              <strong className="font-bold underline text-foreground">
                {selectedBranch ? selectedBranch.name : "Chưa chọn chi nhánh"}
              </strong>
            </span>
          </div>
          <button
            onClick={openModal}
            className="font-bold underline hover:text-primary transition-colors flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            Đổi chi nhánh khác
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-tint/50 via-pastel-peach/25 to-background py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-primary/25 shadow-sm w-fit">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-primary-dark">
                  Cửa hàng tiện lợi thế hệ mới 24/7
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-display font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl/tight">
                  Mua nhanh. <br />
                  <span className="text-primary underline decoration-pastel-peach decoration-wavy decoration-2">
                    Nhận tiện.
                  </span> <br />
                  Sống tiện hơn mỗi ngày.
                </h1>
                <p className="max-w-[560px] text-muted text-base sm:text-lg leading-relaxed">
                  Chuỗi cửa hàng tiện lợi <span className="font-semibold text-foreground">CSM</span> mang phong cách tươi mới, tinh tế, luôn sẵn sàng phục vụ đồ ăn nhanh, thức uống tươi ngon và nhu yếu phẩm chất lượng cao.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" asChild className="w-full sm:w-auto shadow-sm">
                  <Link to="/products" className="flex items-center gap-2">
                    Khám phá sản phẩm
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/products">
                    Xem toàn bộ thực đơn
                  </Link>
                </Button>
              </div>

              {/* Service Highlights */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/80 text-xs font-medium text-muted">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Mở cửa 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-accent" />
                  <span>Giao siêu tốc</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>100% An toàn</span>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Orbiting Combo Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full flex justify-center"
            >
              <HeroOrbitBanner />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Categories (Từ GET /categories) */}
      <section className="py-14 sm:py-18 bg-surface-soft/60 border-y border-border/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center space-y-2">
            <h2 className="text-h1 font-bold text-foreground">Danh Mục Nổi Bật</h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              Lựa chọn các nhóm mặt hàng thiết yếu hàng ngày với tiêu chuẩn chất lượng cao nhất.
            </p>
          </div>

          {isLoadingCats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-6 rounded-2xl bg-surface border border-border flex flex-col items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <Skeleton className="w-24 h-4 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat, i) => {
                const style = CATEGORY_STYLES[i % CATEGORY_STYLES.length];
                return (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    className={`p-6 rounded-2xl ${style.color} border ${style.border} flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-card`}
                  >
                    <div className="text-3xl mb-3">{style.emoji}</div>
                    <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                    <span className="text-xs text-muted mt-1">{cat.description || "Khám phá ngay"}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products (Từ GET /products kèm tồn kho theo chi nhánh) */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                Sản phẩm nổi bật tại {selectedBranch ? selectedBranch.name : "cửa hàng"}
              </div>
              <h2 className="text-h1 font-bold text-foreground">Sản Phẩm Tươi Mới Trong Ngày</h2>
            </div>
            <Button variant="outline" asChild className="rounded-2xl">
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
    </div>
  );
}
