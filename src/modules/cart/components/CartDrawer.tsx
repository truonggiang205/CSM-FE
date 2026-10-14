import React, { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { productApi } from "../../../api/productApi";
import { Product } from "../../../types/product";
import { Button } from "../../../components/ui/Button";
import { ProductImage } from "../../../components/ui/ProductImage";
import { AnimatedNumber } from "../../../components/ui/AnimatedNumber";
import { getCartRecommendations } from "../utils/cartRecommendations";

const FREESHIP_THRESHOLD = 150000; // 150.000₫ để được freeship

export function CartDrawer() {
  const {
    isOpen,
    setIsOpen,
    items,
    updateQuantity,
    removeItem,
    addItem,
    getTotalPrice,
    clearCart,
  } = useCartStore();

  const { showToast } = useCartToastStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Lấy danh sách sản phẩm để gợi ý mua kèm theo rule-based
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
  const remainingForFreeship = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));
  const isFreeshipEligible = totalPrice >= FREESHIP_THRESHOLD;

  // Gợi ý mua kèm theo rule-based (tối đa 3 sản phẩm chưa có trong giỏ)
  const upsellProducts = useMemo(
    () => getCartRecommendations(items, allProducts, 3),
    [items, allProducts]
  );

  const handleAddUpsell = (product: Product) => {
    addItem(product, 1);
    showToast(product.name);
  };

  const handleCheckoutClick = () => {
    setIsOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/45 z-[100] backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl z-[101] flex flex-col border-l border-border"
            role="dialog"
            aria-modal="true"
            aria-label="Giỏ hàng của bạn"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
              <h2 className="text-base font-bold flex items-center text-foreground">
                <span className="w-9 h-9 rounded-2xl bg-primary-tint border border-primary/25 flex items-center justify-center mr-2.5 text-primary shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <span>Giỏ hàng ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl h-9 w-9 text-muted hover:text-foreground hover:bg-surface-soft"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng giỏ hàng"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Freeship Progress Bar */}
            <div
              className={`px-5 py-3.5 border-b border-border/80 transition-colors duration-300 ${
                isFreeshipEligible
                  ? "bg-emerald-50/80 border-emerald-200/80"
                  : "bg-gradient-to-r from-primary-tint/50 via-pastel-peach/30 to-surface-soft"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center gap-1.5 text-foreground">
                  {isFreeshipEligible ? (
                    <span className="text-emerald-700 font-bold">
                      🎉 Chúc mừng! Bạn được miễn phí giao hàng
                    </span>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-primary" />
                      <span>
                        Mua thêm{" "}
                        <strong className="text-primary-dark font-extrabold">
                          <AnimatedNumber value={remainingForFreeship} formatFn={formatCurrency} />
                        </strong>{" "}
                        để được Freeship
                      </span>
                    </>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted font-bold">
                  <AnimatedNumber value={freeshipProgress} formatFn={(v) => `${Math.round(v)}%`} />
                </span>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-2 rounded-full bg-border/60 overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? { width: `${freeshipProgress}%` } : { width: 0 }}
                  animate={{ width: `${freeshipProgress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors duration-300 ${
                    isFreeshipEligible
                      ? "bg-emerald-500 shadow-xs"
                      : "bg-gradient-to-r from-amber-400 to-primary"
                  }`}
                />
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                /* Empty Cart State */
                <div className="h-full flex flex-col items-center justify-center text-muted py-14 text-center px-4">
                  <div className="w-20 h-20 rounded-3xl bg-primary-tint/70 border border-primary/25 flex items-center justify-center mb-4 shadow-xs">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Giỏ hàng của bạn đang trống
                  </h3>
                  <p className="text-xs text-muted max-w-xs mb-6">
                    Hãy dạo quanh cửa hàng và chọn ngay những món ăn tiện lợi tươi ngon nhé!
                  </p>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl px-6 font-semibold shadow-xs"
                  >
                    Khám phá sản phẩm ngay
                  </Button>
                </div>
              ) : (
                /* Items with AnimatePresence */
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3.5 p-3.5 bg-surface-soft border border-border/80 rounded-2xl shadow-xs"
                      >
                        {/* Image */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-border/60 flex-shrink-0">
                          <ProductImage
                            src={item.product.images && item.product.images[0]}
                            alt={item.product.name}
                            productName={item.product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <span className="text-[10px] font-bold text-primary-dark uppercase tracking-wider block truncate">
                              {item.product.category?.name || "Tiện lợi"}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 mt-0.5">
                              {item.product.name}
                            </h4>
                            <div className="text-primary-dark font-black text-xs sm:text-sm mt-1">
                              {formatCurrency(item.product.discountPrice || item.product.price)}
                            </div>
                          </div>

                          {/* Controls: Quantity + Remove button */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                            <div className="flex items-center bg-surface border border-border rounded-xl p-0.5 shadow-xs">
                              <button
                                type="button"
                                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30 transition-all"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label={`Giảm số lượng ${item.product.name}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-soft disabled:opacity-30 transition-all"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                                aria-label={`Tăng số lượng ${item.product.name}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="text-muted hover:text-danger hover:bg-danger-pastel/60 p-1.5 rounded-xl transition-all"
                              aria-label={`Xoá ${item.product.name} khỏi giỏ`}
                              title="Xoá món này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Upsell / Gợi ý mua kèm tiện lợi (Rule-based) */}
                  {upsellProducts.length > 0 && (
                    <div className="pt-3 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span>Gợi ý mua kèm tiện lợi</span>
                        </div>
                        <span className="text-[10px] text-muted lowercase font-normal">
                          tối đa {upsellProducts.length} món
                        </span>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {upsellProducts.map((upsell) => (
                            <motion.div
                              key={upsell.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-surface border border-border/70 hover:border-primary/30 transition-all shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-soft border border-border/50 flex-shrink-0">
                                  <ProductImage
                                    src={upsell.images && upsell.images[0]}
                                    alt={upsell.name}
                                    productName={upsell.name}
                                    className="w-full h-full object-cover"
                                    iconClassName="w-4 h-4 text-primary"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-semibold text-xs text-foreground truncate">
                                    {upsell.name}
                                  </h5>
                                  <span className="text-[11px] font-bold text-primary-dark">
                                    {formatCurrency(upsell.discountPrice || upsell.price)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="soft"
                                onClick={() => handleAddUpsell(upsell)}
                                className="rounded-xl h-7 px-2.5 text-xs font-bold gap-1 flex-shrink-0 shadow-2xs cursor-pointer"
                                aria-label={`Thêm nhanh ${upsell.name}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Thêm</span>
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout Button */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border bg-surface-soft/80 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-muted">
                    <span>Tạm tính hàng hóa:</span>
                    <span className="font-semibold text-foreground">
                      <AnimatedNumber value={totalPrice} formatFn={formatCurrency} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted">
                    <span>Phí giao hàng:</span>
                    <span className="font-semibold text-foreground">
                      {isFreeshipEligible ? (
                        <span className="text-emerald-600 font-bold">Miễn phí</span>
                      ) : (
                        "Tính khi thanh toán"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
                    <span className="text-sm font-bold text-foreground">Tổng cộng:</span>
                    <AnimatedNumber
                      value={totalPrice}
                      formatFn={formatCurrency}
                      className="text-xl font-black text-primary-dark"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="rounded-2xl text-xs font-semibold h-11 text-muted hover:text-danger hover:border-danger/30 cursor-pointer"
                    >
                      Làm trống giỏ
                    </Button>
                    <Button
                      onClick={handleCheckoutClick}
                      className="rounded-2xl text-xs sm:text-sm font-extrabold h-11 gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Thanh toán</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/cart");
                    }}
                    className="w-full text-xs font-semibold text-primary hover:text-primary-dark hover:bg-primary-tint/50 h-8 rounded-xl cursor-pointer"
                  >
                    Xem chi tiết giỏ hàng
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

