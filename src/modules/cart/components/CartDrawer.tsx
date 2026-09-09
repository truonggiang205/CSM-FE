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
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" /> Giỏ hàng của bạn
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p>Giỏ hàng đang trống.</p>
                  <Button variant="link" onClick={() => setIsOpen(false)} className="mt-2">
                    Tiếp tục mua sắm
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-3 bg-neutral-100 rounded-xl">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md bg-white"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        <div className="text-primary font-semibold mt-1">
                          {formatCurrency(item.product.discountPrice || item.product.price)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white border border-border rounded-md">
                          <button
                            className="p-1.5 text-muted hover:text-foreground disabled:opacity-50"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            className="p-1.5 text-muted hover:text-foreground disabled:opacity-50"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors"
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
              <div className="p-4 border-t border-border bg-neutral-50/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted">Tổng cộng</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={clearCart}>
                    Xóa tất cả
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
