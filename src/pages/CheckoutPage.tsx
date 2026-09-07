import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useSessionStore } from '../store/sessionStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { orderService } from '../api/orderService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useSessionStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0 && step !== 4) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600 mb-4">Giỏ hàng trống. Không thể thanh toán.</p>
        <Button onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderItems = items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      }));
      await orderService.createOrder(orderItems, getTotal(), address);
      clearCart();
      setStep(4);
    } catch (error) {
      alert('Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-h1 text-center">Thanh Toán</h1>
      
      {/* Stepper Indicator */}
      {step < 4 && (
        <div className="flex items-center justify-between relative mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-300 -z-10 translate-y-[-50%]"></div>
          {[1, 2, 3].map((s, idx) => (
            <div key={s} className="flex flex-col items-center gap-2 bg-surface px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= s ? 'bg-brand-primary' : 'bg-neutral-300'}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-brand-primary font-medium' : 'text-neutral-600'}`}>
                {s === 1 ? 'Địa chỉ' : s === 2 ? 'Thanh toán' : 'Xác nhận'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-50}}>
          <Card className="p-6">
            <h2 className="text-h2 mb-4">Thông tin giao hàng</h2>
            {!isAuthenticated() && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-md">
                Bạn chưa đăng nhập. <button onClick={() => navigate('/login')} className="font-bold underline">Đăng nhập ngay</button> để lưu thông tin.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng</label>
                <textarea 
                  className="w-full border border-neutral-300 rounded-sm p-3 focus:outline-brand-primary"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ của bạn (VD: 123 Lê Lợi, Q1, TP.HCM)"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!address.trim()}>Tiếp tục</Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-50}}>
          <Card className="p-6">
            <h2 className="text-h2 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-4 border border-brand-primary bg-brand-primary/5 rounded-md cursor-pointer">
                <input type="radio" name="payment" defaultChecked className="text-brand-primary" />
                <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center gap-3 p-4 border border-neutral-300 rounded-md opacity-50 cursor-not-allowed">
                <input type="radio" name="payment" disabled />
                <span>Ví điện tử / Thẻ tín dụng (Bảo trì)</span>
              </label>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
              <Button onClick={() => setStep(3)}>Tiếp tục</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-50}}>
          <Card className="p-6">
            <h2 className="text-h2 mb-4">Xác nhận đơn hàng</h2>
            <div className="divide-y divide-neutral-100 mb-6">
              {items.map(item => (
                <div key={item.product.id} className="py-3 flex justify-between">
                  <span>{item.quantity} x {item.product.name}</span>
                  <span className="font-medium">{(item.product.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-4 border-t-2 border-neutral-900 mb-6">
              <span className="text-lg font-bold">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-brand-primary">{getTotal().toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="bg-neutral-100 p-4 rounded-md mb-6 text-sm text-neutral-600">
              <p><strong>Giao đến:</strong> {address}</p>
              <p><strong>Thanh toán:</strong> Tiền mặt khi nhận hàng (COD)</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Quay lại</Button>
              <Button onClick={handlePlaceOrder} isLoading={isSubmitting}>Đặt Hàng</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}>
          <Card className="p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 text-4xl">
              ✓
            </div>
            <h2 className="text-h1 mb-2 text-success">Đặt hàng thành công!</h2>
            <p className="text-neutral-600 mb-8">
              Cảm ơn bạn đã mua sắm tại CSM. Đơn hàng của bạn đang được xử lý và sẽ giao trong thời gian sớm nhất.
            </p>
            <Button onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
