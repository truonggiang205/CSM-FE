import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ShoppingCart, Check, Plus, Minus, ArrowRight, ShieldCheck, Truck, Store } from "lucide-react";
import { Product } from "../../../types/product";
import { useCartStore } from "../../../store/useCartStore";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProductImage } from "../../../components/ui/ProductImage";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  availableStock?: number;
  branchName?: string;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  availableStock,
  branchName,
}: QuickViewModalProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const effectiveStock = availableStock !== undefined ? availableStock : product.stock;
  const isOutOfStock = effectiveStock <= 0;
  const displayImage = product.images && product.images[0];

  const originalPrice = product.price;
  const salePrice = product.discountPrice || originalPrice;
  const hasDiscount = !!product.discountPrice && product.discountPrice < originalPrice;
  const percentOff = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  const handleIncrement = () => {
    if (quantity < effectiveStock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-surface/90 border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft transition-all shadow-xs"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Image Area */}
          <div className="md:w-1/2 p-6 bg-surface-soft/60 flex items-center justify-center relative">
            <div className="relative aspect-square w-full max-w-[320px] rounded-2xl overflow-hidden border border-border/80 bg-surface shadow-xs">
              <ProductImage
                src={displayImage}
                alt={product.name}
                productName={product.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {hasDiscount && (
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-danger text-white text-xs font-black shadow-xs">
                    -{percentOff}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Category & Branch */}
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-bold text-primary-dark uppercase tracking-wider">
                  {product.category?.name || "Tiện lợi"}
                </span>
                {branchName && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-primary-tint/60 text-primary-dark px-2.5 py-0.5 rounded-full font-medium border border-primary/20">
                    <Store className="w-3 h-3" />
                    {branchName}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 id="quick-view-title" className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug">
                {product.name}
              </h2>

              {/* Rating & SKU */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current text-amber-400" />
                  <span>4.8</span>
                  <span className="text-muted font-normal">(124 đánh giá)</span>
                </div>
                {product.sku && (
                  <span className="font-mono text-muted text-[11px]">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              {/* Price Box */}
              <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/80 flex items-baseline gap-3">
                <span className="text-2xl font-black text-primary-dark">
                  {formatCurrency(salePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted line-through font-medium">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Tình trạng:</span>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="rounded-lg text-xs font-bold">
                    Hết hàng tại chi nhánh
                  </Badge>
                ) : effectiveStock <= 5 ? (
                  <Badge variant="warning" className="rounded-lg text-xs font-bold">
                    Sắp hết (Còn {effectiveStock} món)
                  </Badge>
                ) : (
                  <Badge variant="success" className="rounded-lg text-xs font-bold">
                    Còn hàng ({effectiveStock} món sẵn sàng)
                  </Badge>
                )}
              </div>

              {/* Brief Description */}
              <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3">
                {product.description ||
                  "Sản phẩm tươi ngon, nguồn gốc rõ ràng, luôn được bảo quản ở điều kiện tiêu chuẩn tại chuỗi cửa hàng tiện lợi CSM."}
              </p>

              {/* Small Service badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted pt-1">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-accent" />
                  <span>Giao nhanh 30 phút</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Đổi trả nếu lỗi</span>
                </div>
              </div>
            </div>

            {/* Actions: Quantity + Add Button */}
            <div className="pt-6 border-t border-border/80 mt-6 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-border rounded-2xl bg-surface-soft p-1">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface disabled:opacity-40 transition-all"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={isOutOfStock || quantity >= effectiveStock}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface disabled:opacity-40 transition-all"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to cart button with instant green checkmark */}
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-2xl h-11 text-xs sm:text-sm font-bold gap-2 shadow-sm transition-all duration-300 ${
                    isAdded
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce" />
                      <span>Đã thêm vào giỏ!</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Tạm hết hàng</span>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Thêm vào giỏ</span>
                    </>
                  )}
                </Button>
              </div>

              {/* View Full Product Details Link */}
              <div className="text-center pt-1">
                <Link
                  to={`/products/${product.id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark hover:underline hover:text-primary transition-colors"
                >
                  <span>Xem thông tin chi tiết đầy đủ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
