import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { productApi } from "../../../api/productApi";
import { Button } from "../../../components/ui/Button";
import { ProductImage } from "../../../components/ui/ProductImage";
import { AnimatedNumber } from "../../../components/ui/AnimatedNumber";
import { getCartRecommendations } from "../utils/cartRecommendations";

const FREESHIP_THRESHOLD = 150000;

export function CartPage() {
  const { items, updateQuantity, removeItem, addItem, getTotalPrice, clearCart } =
    useCartStore();
  const { showToast } = useCartToastStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getProducts,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalPrice = getTotalPrice();
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const remainingForFreeship = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));
  const isFreeshipEligible = totalPrice >= FREESHIP_THRESHOLD;

  // Gợi ý mua kèm thông minh theo rule-based (tối đa 3 món)
  const recommendations = useMemo(
    () => getCartRecommendations(items, allProducts, 3),
    [items, allProducts]
  );

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleAddUpsell = (product: typeof recommendations[0]) => {
    addItem(product, 1);
    showToast(product.name);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">Giỏ hàng của bạn</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <span>Giỏ Hàng Của Bạn</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Quản lý danh sách sản phẩm và nhận ưu đãi miễn phí giao hàng từ CSM Store.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            className="rounded-2xl text-xs font-semibold text-muted hover:text-danger hover:border-danger/30 self-start sm:self-auto gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xoá toàn bộ giỏ</span>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="p-12 sm:p-16 rounded-3xl border border-border bg-surface text-center space-y-5 max-w-xl mx-auto shadow-card">
          <div className="w-20 h-20 rounded-3xl bg-primary-tint/70 border border-primary/25 flex items-center justify-center mx-auto text-primary shadow-xs">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Giỏ hàng của bạn đang trống</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Hãy khám phá các món ăn vặt, đồ uống mát lạnh và đồ ăn nhanh tiện lợi sẵn sàng phục vụ 24/7!
            </p>
          </div>
          <Button asChild size="lg" className="rounded-2xl px-8 font-bold text-xs sm:text-sm shadow-sm gap-2">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4" />
              <span>Khám phá thực đơn ngay</span>
            </Link>
          </Button>
        </div>
      ) : (
        /* Grid Layout: Danh sách món (8 cols) & Tóm tắt đơn hàng (4 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Dynamic Freeship Progress Banner */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-card ${
                isFreeshipEligible
                  ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-900"
                  : "bg-gradient-to-r from-primary-tint/60 via-pastel-peach/30 to-surface border-border text-foreground"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isFreeshipEligible
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-primary-tint text-primary-dark border border-primary/25"
                    }`}
                  >
                    {isFreeshipEligible ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    {isFreeshipEligible ? (
                      <span className="font-extrabold text-emerald-800">
                        🎉 Chúc mừng! Đơn hàng của bạn đã đủ điều kiện FREESHIP toàn quốc.
                      </span>
                    ) : (
                      <span>
                        Mua thêm{" "}
                        <strong className="text-primary-dark font-extrabold">
                          <AnimatedNumber value={remainingForFreeship} formatFn={formatCurrency} />
                        </strong>{" "}
                        để được Miễn phí giao hàng (Freeship)!
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-xs font-bold self-end sm:self-auto text-muted">
                  <AnimatedNumber value={freeshipProgress} formatFn={(v) => `${Math.round(v)}%`} />
                </span>
              </div>

              {/* Animated Progress Bar Line */}
              <div className="w-full h-2.5 rounded-full bg-border/60 overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? { width: `${freeshipProgress}%` } : { width: 0 }}
                  animate={{ width: `${freeshipProgress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors ${
                    isFreeshipEligible
                      ? "bg-emerald-500 shadow-xs"
                      : "bg-gradient-to-r from-amber-400 via-primary to-primary-dark"
                  }`}
                />
              </div>
            </div>

            {/* Items Table / Card Container */}
            <div className="bg-surface rounded-3xl border border-border p-4 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs font-bold text-muted uppercase tracking-wider">
                <span>Mặt hàng ({totalItems})</span>
                <span className="hidden sm:inline">Số lượng & Thành tiền</span>
              </div>

              <div className="divide-y divide-border/60 space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const price = item.product.discountPrice || item.product.price;
                    const itemTotal = price * item.quantity;

                    return (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Image + Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-soft border border-border/70 flex-shrink-0">
                            <ProductImage
                              src={item.product.images && item.product.images[0]}
                              alt={item.product.name}
                              productName={item.product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          <div className="space-y-1 min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-primary-dark uppercase tracking-wider block">
                              {item.product.category?.name || "Tiện lợi"}
                            </span>
                            <Link
                              to={`/products/${item.product.id}`}
                              className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                            >
                              {item.product.name}
                            </Link>
                            <span className="text-xs text-muted font-medium block">
                              Đơn giá: {formatCurrency(price)}
                            </span>
                          </div>
                        </div>

                        {/* Controls + Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-surface-soft border border-border rounded-xl p-0.5 shadow-2xs">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface disabled:opacity-30 transition-all cursor-pointer"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Giảm số lượng ${item.product.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-extrabold text-foreground font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              aria-label={`Tăng số lượng ${item.product.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Item Subtotal */}
                          <div className="text-right min-w-[90px]">
                            <span className="text-sm sm:text-base font-extrabold text-primary-dark">
                              {formatCurrency(itemTotal)}
                            </span>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id)}
                            className="p-1.5 rounded-xl text-muted hover:text-danger hover:bg-danger-pastel/60 transition-all cursor-pointer"
                            aria-label={`Xoá ${item.product.name} khỏi giỏ`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Rule-Based Upsell Section (Gợi ý mua kèm dựa trên danh mục trong giỏ) */}
            {recommendations.length > 0 && (
              <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-accent-tint text-accent-dark flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground">
                        Gợi ý mua kèm tiện lợi
                      </h3>
                      <p className="text-[11px] text-muted">
                        Món ngon kết hợp hoàn hảo cùng giỏ hàng của bạn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {recommendations.map((rec) => (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                        className="p-3 rounded-2xl bg-surface-soft border border-border hover:border-primary/30 transition-all flex flex-col justify-between shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border/60 shrink-0">
                            <ProductImage
                              src={rec.images && rec.images[0]}
                              alt={rec.name}
                              productName={rec.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {rec.name}
                            </h4>
                            <span className="text-xs font-black text-primary-dark mt-0.5 block">
                              {formatCurrency(rec.discountPrice || rec.price)}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => handleAddUpsell(rec)}
                          className="w-full rounded-xl h-8 text-xs font-bold gap-1 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm nhanh</span>
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-surface rounded-3xl border border-border p-6 shadow-card space-y-5">
              <h3 className="font-black text-lg text-foreground pb-3 border-b border-border/80">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-muted">
                  <span>Tạm tính ({totalItems} món):</span>
                  <span className="font-semibold text-foreground">
                    <AnimatedNumber value={totalPrice} formatFn={formatCurrency} />
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold">
                    {isFreeshipEligible ? (
                      <span className="text-emerald-600 font-bold">Miễn phí (Freeship)</span>
                    ) : (
                      <span className="text-foreground">Tính khi thanh toán</span>
                    )}
                  </span>
                </div>

                {!isFreeshipEligible && (
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-[11px] leading-relaxed">
                    💡 Thêm <strong>{formatCurrency(remainingForFreeship)}</strong> để tiết kiệm phí ship toàn quốc!
                  </div>
                )}

                <div className="pt-3 border-t border-border/80 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm sm:text-base text-foreground">
                    Tổng thanh toán:
                  </span>
                  <AnimatedNumber
                    value={totalPrice}
                    formatFn={formatCurrency}
                    className="text-2xl font-black text-primary-dark"
                  />
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full rounded-2xl h-12 text-sm sm:text-base font-extrabold shadow-sm gap-2 cursor-pointer"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-2xl h-11 text-xs sm:text-sm font-semibold bg-surface hover:bg-surface-soft border-border text-foreground"
                >
                  <Link to="/products">Tiếp tục mua sắm</Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-border/70 space-y-2 text-[11px] text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Cam kết 100% hàng tươi mới mỗi ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span>Giao siêu tốc 30 phút từ chi nhánh gần bạn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
