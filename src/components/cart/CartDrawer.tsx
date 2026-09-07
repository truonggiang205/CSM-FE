import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, getTotal } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
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
            onClick={toggleCart}
            className="fixed inset-0 bg-neutral-900/50 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-300 bg-neutral-100">
              <h2 className="text-h2 flex items-center gap-2 text-brand-primary">
                <ShoppingBag size={24} />
                Giỏ Hàng
              </h2>
              <button onClick={toggleCart} className="p-2 text-neutral-600 hover:text-neutral-900 bg-white rounded-full shadow-sm hover:shadow-md transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4">
                  <ShoppingBag size={64} className="text-neutral-300" />
                  <p>Giỏ hàng của bạn đang trống</p>
                  <Button variant="outline" onClick={toggleCart}>Tiếp tục mua sắm</Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.product.id} 
                    className="flex gap-4 p-3 border border-neutral-100 rounded-md shadow-sm items-center bg-white"
                  >
                    <div className="w-20 h-20 bg-neutral-100 rounded-sm flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-body font-medium line-clamp-1">{item.product.name}</h3>
                      <div className="text-brand-primary font-bold mt-1">
                        {item.product.price.toLocaleString('vi-VN')}đ
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-neutral-300 rounded-sm w-24">
                          <button 
                            className="px-2 py-1 hover:bg-neutral-100 text-neutral-600 w-8"
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </button>
                          <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            className="px-2 py-1 hover:bg-neutral-100 text-neutral-600 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-danger hover:bg-red-50 rounded-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-neutral-300 p-4 bg-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-body font-medium">Tổng tiền:</span>
                  <span className="text-xl font-bold text-brand-primary">
                    {getTotal().toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <Button size="lg" className="w-full" onClick={handleCheckout}>
                  Tiến hành thanh toán
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
