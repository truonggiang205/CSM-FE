import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "../../../store/useCartStore";
import { Button } from "../../../components/ui/Button";

export function CartDrawer() {
  const { isOpen, setIsOpen, items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl z-[101] flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-bold flex items-center text-foreground">
                <span className="w-8 h-8 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center mr-2.5 text-primary">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                Giỏ hàng của bạn
              </h2>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-muted hover:text-foreground" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted py-12">
                  <div className="w-20 h-20 rounded-3xl bg-primary-tint/60 border border-primary/20 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs text-muted mt-1">Hãy chọn thêm một vài món ngon nhé!</p>
                  <Button variant="soft" size="sm" onClick={() => setIsOpen(false)} className="mt-4">
                    Tiếp tục mua sắm
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-3.5 p-3.5 bg-surface-soft border border-border/80 rounded-2xl">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl bg-white border border-border/60"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">{item.product.name}</h4>
                        <div className="text-primary-dark font-extrabold text-sm mt-1">
                          {formatCurrency(item.product.discountPrice || item.product.price)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                        <div className="flex items-center bg-surface border border-border rounded-xl p-0.5">
                          <button
                            className="p-1 rounded-lg text-muted hover:text-foreground disabled:opacity-40"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Giảm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                          <button
                            className="p-1 rounded-lg text-muted hover:text-foreground disabled:opacity-40"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            aria-label="Tăng"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-danger-dark hover:bg-danger-pastel/70 p-1.5 rounded-lg transition-colors"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border bg-surface-soft">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted text-sm">Tổng thanh toán</span>
                  <span className="text-xl font-extrabold text-primary-dark">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={clearCart}>
                    Làm trống
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = "/checkout";
                    }}
                  >
                    Thanh toán
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
