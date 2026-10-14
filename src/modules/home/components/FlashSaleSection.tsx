import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ArrowRight, ShoppingCart } from "lucide-react";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { Button } from "../../../components/ui/Button";

import { ProductImage } from "../../../components/ui/ProductImage";

interface FlashSaleSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
}

export function FlashSaleSection({ products, stockMap, branchName }: FlashSaleSectionProps) {
  const { addItem } = useCartStore();

  // Đồng hồ đếm ngược tới 23:59:59 của ngày hôm nay
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diffMs = endOfDay.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lọc sản phẩm có discount hoặc lấy danh sách nổi bật làm deal
  const flashSaleProducts = products.slice(0, 8);

  if (flashSaleProducts.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-pastel-peach/30 via-surface to-background border-y border-border/80">
      <div className="container mx-auto px-4 md:px-6 space-y-6">
        {/* Header Bar: Tiêu đề + Đồng hồ đếm ngược */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-surface border border-accent/25 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-tint border border-accent/30 flex items-center justify-center text-accent-dark shadow-xs animate-pulse">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-danger-pastel text-danger-dark border border-danger/20 uppercase tracking-wider">
                  HOT DEAL
                </span>
                <span className="text-xs text-muted">Chỉ áp dụng trong ngày</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                <span>GIỜ VÀNG GIẢM GIÁ</span>
              </h2>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 text-xs font-semibold self-start sm:self-auto">
            <span className="text-muted hidden sm:inline flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Kết thúc sau:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span className="px-2.5 py-1.5 rounded-xl bg-foreground text-background shadow-xs">
                {timeLeft.hours}
              </span>
              <span className="text-foreground font-black">:</span>
              <span className="px-2.5 py-1.5 rounded-xl bg-foreground text-background shadow-xs">
                {timeLeft.minutes}
              </span>
              <span className="text-foreground font-black">:</span>
              <span className="px-2.5 py-1.5 rounded-xl bg-accent text-white shadow-xs">
                {timeLeft.seconds}
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Products Row */}
        <div className="relative">
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory">
            {flashSaleProducts.map((product, idx) => {
              const availableStock = stockMap.get(product.id) ?? product.stock;
              const isOutOfStock = availableStock <= 0;
              const salePrice = product.discountPrice || Math.round(product.price * 0.85);
              const originalPrice = product.price;
              const percentOff = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

              // Mock tiến độ đã bán
              const soldPercent = Math.min(95, 45 + (idx * 12) % 50);

              return (
                <div
                  key={product.id}
                  className="w-[210px] sm:w-[230px] flex-shrink-0 snap-start rounded-3xl bg-surface border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col overflow-hidden p-3.5 group"
                >
                  {/* Image area */}
                  <Link to={`/products/${product.id}`} className="relative aspect-square rounded-2xl overflow-hidden bg-surface-soft block mb-3">
                    <ProductImage
                      src={product.images && product.images[0]}
                      alt={product.name}
                      productName={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shadow-xs">
                        -{percentOff}%
                      </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary-dark/80 block truncate">
                        {product.category?.name || "Tiện lợi"}
                      </span>
                      <Link to={`/products/${product.id}`} className="hover:text-primary transition-colors">
                        <h4 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1 mt-0.5">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-primary-dark font-extrabold text-sm sm:text-base">
                          {formatCurrency(salePrice)}
                        </span>
                        <span className="text-muted text-[11px] line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar đã bán */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                        <span>Đã bán {soldPercent}%</span>
                        <span className="text-accent-dark font-bold">Sắp cháy hàng</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-soft overflow-hidden border border-border/50">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-danger rounded-full transition-all duration-500"
                          style={{ width: `${soldPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Button thêm giỏ */}
                    <Button
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => addItem(product, 1)}
                      className="w-full mt-3 rounded-xl h-8 text-xs font-semibold gap-1.5 shadow-xs"
                      aria-label={`Thêm ${product.name} vào giỏ`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? "Hết hàng" : "Mua ngay"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View all flash sale link */}
        <div className="text-center pt-2">
          <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold">
            <Link to="/products?q=sale" className="flex items-center gap-1.5">
              <span>Xem tất cả ưu đãi hôm nay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
