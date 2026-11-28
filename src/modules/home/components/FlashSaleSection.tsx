import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ArrowRight, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { Button } from "../../../components/ui/Button";
import type { HomeSection } from "../../../api/storefrontApi";
import { ProductImage } from "../../../components/ui/ProductImage";
import { flashSaleApi, formatFlashSaleDiscount } from "../../../api/flashSaleApi";

interface FlashSaleSectionProps {
  products: Product[];
  stockMap: Map<string, number>;
  branchName?: string;
  /** Cấu hình từ trang "Giao diện trang chủ"; null/rỗng thì lấy 8 sản phẩm đầu như mặc định */
  section?: HomeSection | null;
}

export function FlashSaleSection({ products, stockMap, branchName: _branchName, section }: FlashSaleSectionProps) {
  const { addItem } = useCartStore();
  const { showToast } = useCartToastStore();

  const {
    data: flashSaleData = { status: "NONE" as const, campaign: null, items: [] },
    refetch,
  } = useQuery({
    queryKey: ["active-flash-sale"],
    queryFn: flashSaleApi.getActiveOrUpcoming,
    refetchInterval: 15000,
  });

  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const hasTriggeredExpireRefetch = useRef(false);

  const isLiveCampaign = flashSaleData.status !== "NONE" && !!flashSaleData.campaign;
  const isUpcoming = flashSaleData.status === "UPCOMING";
  const campaign = flashSaleData.campaign;

  useEffect(() => {
    hasTriggeredExpireRefetch.current = false;
  }, [flashSaleData.status, flashSaleData.targetTime, flashSaleData.targetDateTime, campaign?.id]);

  useEffect(() => {
    const rawTarget = flashSaleData.targetDateTime || flashSaleData.targetTime;
    // Không có chiến dịch: khối tự ẩn (return null bên dưới) nên không cần đếm ngược
    if (!isLiveCampaign || !rawTarget) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      let targetDate: Date;
      if (rawTarget.includes("T")) {
        targetDate = new Date(rawTarget);
      } else {
        targetDate = new Date();
        const parts = rawTarget.split(":");
        const th = parseInt(parts[0], 10) || 0;
        const tm = parseInt(parts[1], 10) || 0;
        const ts = parseInt(parts[2], 10) || 0;
        targetDate.setHours(th, tm, ts, 0);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        if (!hasTriggeredExpireRefetch.current) {
          hasTriggeredExpireRefetch.current = true;
          refetch();
        }
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
  }, [isLiveCampaign, flashSaleData.targetTime, flashSaleData.targetDateTime, refetch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (!isLiveCampaign || !campaign?.items || campaign.items.length === 0) {
    return null;
  }

  const displayItems = campaign.items.map((item) => {
    const matchingProduct = products.find((p) => p.id === item.product_id);
    const originalPrice = Number(item.original_price) || 20000;
    const salePrice = Number(item.sale_price) || Math.round(originalPrice * 0.8);
    const discountLabel = formatFlashSaleDiscount({ ...item, original_price: originalPrice, sale_price: salePrice });
    const limit = Number(item.quantity_limit) || 50;
    // Không bao giờ hiển thị số đã bán vượt quá số suất mở bán
    const sold = Math.min(limit, Number(item.sold_count) || 0);
    const soldPercent = Math.min(100, Math.round((sold / Math.max(1, limit)) * 100));

    return {
      id: item.product_id,
      name: item.product_name || matchingProduct?.name || "Sản phẩm ưu đãi",
      image: item.product_image || (matchingProduct?.images && matchingProduct.images[0]) || "",
      categoryName: matchingProduct?.category?.name || "Giờ Vàng",
      originalPrice,
      salePrice,
      discountLabel,
      soldPercent,
      quantityLimit: limit,
      soldCount: sold,
      maxPerUser: Number(item.max_per_user) || 2,
      rawProduct: matchingProduct,
    };
  });

  if (displayItems.length === 0) return null;

  const handleBuyNow = (item: (typeof displayItems)[0]) => {
    // Vượt giới hạn suất Giờ Vàng vẫn cho mua: phần vượt tính giá gốc (giỏ hàng ghi rõ, server tính giống hệt)

    if (item.rawProduct) {
      addItem({ ...item.rawProduct, discountPrice: item.salePrice }, 1);
    } else {
      addItem(
        {
          id: item.id,
          name: item.name,
          slug: "flash-sale-product",
          price: item.originalPrice,
          discountPrice: item.salePrice,
          images: item.image ? [item.image] : [],
          category: { id: "deal", name: item.categoryName },
          stock: 50,
          description: "Món ưu đãi Giờ Vàng CSM",
        },
        1
      );
    }
    showToast(item.name);
  };

  return (
    <section id="flash-sale-section" className="py-12 sm:py-16 bg-gradient-to-b from-pastel-peach/30 via-surface to-background border-y border-border/80">
      <div className="container mx-auto px-4 md:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-surface border border-accent/25 shadow-card">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                isUpcoming
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-accent-tint border border-accent/30 text-accent-dark animate-pulse"
              }`}
            >
              {isUpcoming ? <Clock className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    isUpcoming
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-danger-pastel text-danger-dark border-danger/20"
                  }`}
                >
                  {isUpcoming ? "⚡ SẮP MỞ BÁN" : "🔥 ĐANG DIỄN RA"}
                </span>

                <span className="text-xs text-muted">
                  {section?.subtitle ? `${section.subtitle} · ` : ""}
                  {isUpcoming
                    ? `Mở bán lúc ${campaign?.start_time?.slice(0, 5) || "hôm nay"}`
                    : `Áp dụng đến ${campaign?.end_time?.slice(0, 5) || "23:59"}`}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                <span>{section?.title || campaign?.name || "GIỜ VÀNG GIẢM GIÁ CSM"}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold self-start sm:self-auto">
            <span className="text-muted hidden sm:inline flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {isUpcoming ? "Bắt đầu sau:" : "Kết thúc sau:"}
            </span>

            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span
                className={`px-2.5 py-1.5 rounded-xl shadow-xs ${
                  isUpcoming ? "bg-amber-800 text-white" : "bg-foreground text-background"
                }`}
              >
                {timeLeft.hours}
              </span>
              <span className="text-foreground font-black">:</span>
              <span
                className={`px-2.5 py-1.5 rounded-xl shadow-xs ${
                  isUpcoming ? "bg-amber-800 text-white" : "bg-foreground text-background"
                }`}
              >
                {timeLeft.minutes}
              </span>
              <span className="text-foreground font-black">:</span>
              <span
                className={`px-2.5 py-1.5 rounded-xl shadow-xs ${
                  isUpcoming ? "bg-amber-500 text-white" : "bg-accent text-white"
                }`}
              >
                {timeLeft.seconds}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory">
            {displayItems.map((item) => {
              const availableStock = stockMap.get(item.id) ?? item.quantityLimit;
              const isOutOfStock = availableStock <= 0;

              return (
                <div
                  key={item.id}
                  className="w-[210px] sm:w-[230px] flex-shrink-0 snap-start rounded-3xl bg-surface border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col overflow-hidden p-3.5 group"
                >
                  <Link
                    to={`/products/${item.id}`}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-surface-soft block mb-3"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      productName={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shadow-xs">
                        {item.discountLabel}
                      </span>
                    </div>
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary-dark/80 block truncate">
                        {item.categoryName}
                      </span>
                      <Link to={`/products/${item.id}`} className="hover:text-primary transition-colors">
                        <h4 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1 mt-0.5">
                          {item.name}
                        </h4>
                      </Link>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-danger-dark font-extrabold text-sm sm:text-base">
                          {formatCurrency(item.salePrice)}
                        </span>
                        <span className="text-muted text-[11px] line-through">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                        <span>
                          Đã bán {item.soldCount}/{item.quantityLimit} suất · tối đa {item.maxPerUser}/khách
                        </span>
                        <span className="text-accent-dark font-bold">
                          {isOutOfStock ? "Hết hàng" : "Sắp cháy hàng"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-soft overflow-hidden border border-border/50">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-danger rounded-full transition-all duration-500"
                          style={{ width: `${item.soldPercent}%` }}
                        />
                      </div>
                    </div>

                    {isUpcoming ? (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="w-full mt-3 rounded-xl h-8 text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-50"
                      >
                        <Link to={`/products/${item.id}`}>Xem trước</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={() => handleBuyNow(item)}
                        className="w-full mt-3 rounded-xl h-8 text-xs font-semibold gap-1.5 shadow-xs"
                        aria-label={`Thêm ${item.name} vào giỏ`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? "Hết hàng" : "Mua ngay"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-2">
          <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold">
            <Link to="/deals" className="flex items-center gap-1.5">
              <span>Xem tất cả ưu đãi hôm nay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
