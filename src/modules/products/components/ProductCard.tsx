import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingCart, Eye, Star, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProductImage } from "../../../components/ui/ProductImage";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { useTilt } from "../../../hooks/useTilt";

interface ProductCardProps {
  product: Product;
  availableStock?: number;
  branchName?: string;
  viewMode?: "grid" | "list";
  onQuickView?: (product: Product) => void;
}

function useFlashSaleCountdown(endTimeStr?: string) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!endTimeStr) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const parts = endTimeStr.split(":").map(Number);
      if (parts.length < 2) return;

      const target = new Date(now);
      target.setHours(parts[0], parts[1], parts[2] || 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("");
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  return { timeLeft, isExpired };
}

export function ProductCard({
  product,
  availableStock,
  branchName,
  viewMode = "grid",
  onQuickView,
}: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tilt = useTilt({ maxTilt: 3, perspective: 800 });
  const { timeLeft, isExpired } = useFlashSaleCountdown(product.flashSaleMeta?.endTime);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const effectiveStock = availableStock !== undefined ? availableStock : product.stock;
  const isOutOfStock = effectiveStock <= 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

  const isFlashSaleActive = !!product.flashSaleMeta && !product.flashSaleMeta.isSoldOut && !isExpired;

  const originalPrice = product.price;
  const salePrice = isFlashSaleActive && product.discountPrice ? product.discountPrice : originalPrice;
  const hasDiscount = isFlashSaleActive && !!product.discountPrice && product.discountPrice < originalPrice;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const targetPath = `/products/${product.id}`;
  const displayImage = product.images && product.images[0];

  const computedRating = product.rating || Number((4.3 + ((product.id.charCodeAt(product.id.length - 1) || 5) % 7) * 0.1).toFixed(1));
  const computedReviews = product.reviewsCount || (40 + ((product.id.charCodeAt(0) || 3) * 7) % 150);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, 1);
    useCartToastStore.getState().showToast(product.name);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        transition={{ duration: 0.18 }}
        className="group relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-3xl border border-border bg-surface shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-200 p-4"
      >
        <Link
          to={targetPath}
          className="relative w-full sm:w-44 aspect-square rounded-2xl overflow-hidden bg-surface-soft flex-shrink-0 block"
        >
          <ProductImage
            src={displayImage}
            alt={product.name}
            productName={product.name}
            className="object-cover w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
          {hasDiscount && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shadow-xs">
                -{percentOff}%
              </span>
            </div>
          )}

          {isFlashSaleActive && product.flashSaleMeta && (
            <div className="absolute inset-x-2 bottom-2 z-10 p-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-red-200/90 shadow-xs pointer-events-none space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-red-500">
                <span>🔥 {product.flashSaleMeta.soldCount}/{product.flashSaleMeta.quantityLimit}</span>
                {timeLeft && (
                  <span className="font-mono text-[9px] flex items-center gap-0.5 text-red-500">
                    <Clock className="w-2.5 h-2.5" />
                    {timeLeft}
                  </span>
                )}
              </div>
              <div className="w-full h-1 bg-red-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(8, Math.round(((product.flashSaleMeta.soldCount || 0) / (product.flashSaleMeta.quantityLimit || 1)) * 100)))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between w-full h-full">
          <div>
            <span
              className="text-xs font-semibold text-primary-dark truncate block max-w-full mb-1"
              title={product.category?.name || "Tiện lợi"}
            >
              {product.category?.name || "Tiện lợi"}
            </span>

            <Link to={targetPath} className="hover:text-primary transition-colors">
              <h3 className="font-bold text-foreground text-base sm:text-lg leading-snug line-clamp-1">
                {product.name}
              </h3>
            </Link>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>{computedRating}</span>
              <span className="text-muted font-normal text-[11px]">({computedReviews} đánh giá)</span>
            </div>

            <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
              {product.description || "Sản phẩm tươi ngon, tiện lợi mỗi ngày tại CSM Store."}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-baseline gap-2">
              <span className="text-primary-dark font-black text-lg">
                {formatCurrency(salePrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>

            <div>
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-[11px] font-bold">
                  Hết hàng
                </Badge>
              ) : isLowStock ? (
                <Badge variant="warning" className="text-[11px] font-bold">
                  Sắp hết ({effectiveStock})
                </Badge>
              ) : (
                <Badge variant="success" className="text-[11px] font-bold">
                  Còn hàng ({effectiveStock})
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center justify-end gap-2 w-full sm:w-36 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/50 sm:pl-4">
          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`w-full rounded-2xl h-10 text-xs font-bold gap-1.5 shadow-xs transition-all duration-300 ${
              isAdded ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>Đã thêm!</span>
              </>
            ) : isOutOfStock ? (
              <span>Hết hàng</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Thêm giỏ</span>
              </>
            )}
          </Button>

          {onQuickView && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickViewClick}
              className="w-full rounded-2xl h-9 text-xs font-semibold gap-1.5 text-muted hover:text-foreground"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem nhanh</span>
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={tilt.handleMouseLeave}
      style={tilt.style}
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      transition={{ duration: 0.18 }}
      className="group relative flex flex-col h-full rounded-3xl border border-border bg-surface shadow-card hover:shadow-card-hover overflow-hidden transition-shadow duration-200 transform-gpu"
    >
      <Link to={targetPath} className="relative aspect-square overflow-hidden bg-surface-soft block">
        <ProductImage
          src={displayImage}
          alt={product.name}
          productName={product.name}
          className="object-cover w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full bg-danger text-white text-[10px] font-black shadow-xs">
              -{percentOff}%
            </span>
          )}

          {isOutOfStock ? (
            <Badge variant="destructive" className="shadow-xs font-bold text-[10px]">
              Hết hàng
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" className="shadow-xs font-bold text-[10px]">
              Sắp hết ({effectiveStock})
            </Badge>
          ) : (
            <Badge variant="success" className="shadow-xs font-bold text-[10px]">
              Còn hàng
            </Badge>
          )}
        </div>

        {isFlashSaleActive && product.flashSaleMeta && (
          <div className="absolute inset-x-2.5 bottom-2.5 z-10 p-2 sm:px-2.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-xs border border-red-200/90 shadow-sm pointer-events-none transition-opacity duration-200 md:group-hover:opacity-0 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-500">
              <span className="flex items-center gap-1">
                🔥 Đã bán {product.flashSaleMeta.soldCount}/{product.flashSaleMeta.quantityLimit}
              </span>
              {timeLeft && (
                <span className="font-mono text-[10px] flex items-center gap-0.5 text-red-500">
                  <Clock className="w-2.5 h-2.5" />
                  {timeLeft}
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(8, Math.round(((product.flashSaleMeta.soldCount || 0) / (product.flashSaleMeta.quantityLimit || 1)) * 100)))}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 hidden md:flex items-center gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-20">
          <Button
            type="button"
            size="sm"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`flex-1 rounded-2xl h-10 text-xs font-bold shadow-md transition-all duration-300 ${
              isAdded
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isOutOfStock
                ? "bg-surface-soft text-muted cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-1 text-white animate-bounce" />
                Đã thêm!
              </>
            ) : isOutOfStock ? (
              "Hết hàng"
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 mr-1 text-white" />
                Thêm giỏ
              </>
            )}
          </Button>

          {onQuickView && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handleQuickViewClick}
              className="rounded-2xl h-10 w-10 bg-surface/90 backdrop-blur-md shadow-md text-foreground hover:bg-surface flex-shrink-0"
              title="Xem nhanh"
              aria-label={`Xem nhanh ${product.name}`}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <span
          className="text-xs font-semibold text-primary-dark truncate block max-w-full mb-1"
          title={product.category?.name || "Tiện lợi"}
        >
          {product.category?.name || "Tiện lợi"}
        </span>

        <Link to={targetPath} className="hover:text-primary transition-colors">
          <h3 className="font-bold text-foreground text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px] mt-1.5">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>{computedRating}</span>
            <span className="text-muted font-normal text-[10px]">({computedReviews})</span>
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-border/50">
          <div>
            <div className="text-primary-dark font-black text-sm sm:text-base">
              {formatCurrency(salePrice)}
            </div>
            {hasDiscount && (
              <div className="text-muted text-[11px] line-through">
                {formatCurrency(originalPrice)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {onQuickView && (
              <Button
                size="icon"
                variant="outline"
                className="rounded-2xl h-11 w-11 min-h-[44px] min-w-[44px] text-muted cursor-pointer"
                onClick={handleQuickViewClick}
                aria-label={`Xem nhanh ${product.name}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            <Button
              size="icon"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`rounded-2xl h-11 w-11 min-h-[44px] min-w-[44px] shadow-xs transition-all duration-300 cursor-pointer ${
                isAdded ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
            >
              {isAdded ? (
                <Check className="w-4 h-4 animate-bounce" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
