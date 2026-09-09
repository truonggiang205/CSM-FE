import { useState } from "react";
import { useCartStore } from "../../../store/useCartStore";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Giỏ hàng trống</h2>
        <p className="text-muted mt-2">Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <Button asChild className="mt-4">
          <Link to="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  const handleCompleteOrder = () => {
    setStep(3);
    clearCart();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {step < 3 && (
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= i ? "bg-primary text-white" : "bg-surface border-2 border-border text-muted"
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold mb-6">Thông tin giao hàng</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" required placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" required placeholder="0912345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ giao hàng</Label>
                <Input id="address" required placeholder="Số nhà, tên đường, phường/xã..." />
              </div>
              <Button type="submit" className="w-full mt-4">Tiếp tục đến thanh toán</Button>
            </form>
          </div>
          <div>
            <OrderSummary items={items} total={getTotalPrice()} format={formatCurrency} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold mb-6">Phương thức thanh toán</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 border border-border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-primary" />
                <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center space-x-3 border border-border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="radio" name="payment" className="w-4 h-4 text-primary" />
                <span className="font-medium">Thanh toán qua Momo</span>
              </label>
              <label className="flex items-center space-x-3 border border-border p-4 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="radio" name="payment" className="w-4 h-4 text-primary" />
                <span className="font-medium">Thẻ tín dụng / Thẻ ghi nợ</span>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Quay lại</Button>
              <Button onClick={handleCompleteOrder} className="flex-1">Hoàn tất đặt hàng</Button>
            </div>
          </div>
          <div>
            <OrderSummary items={items} total={getTotalPrice()} format={formatCurrency} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-20">
          <CheckCircle2 className="w-20 h-20 text-success mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Đặt hàng thành công!</h1>
          <p className="text-muted mb-8">
            Cảm ơn bạn đã mua sắm tại CSM. Đơn hàng của bạn đang được xử lý.
          </p>
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ items, total, format }: any) {
  return (
    <div className="bg-neutral-50 p-6 rounded-xl border border-border">
      <h3 className="font-bold mb-4 text-lg">Đơn hàng của bạn</h3>
      <div className="space-y-4 mb-4">
        {items.map((item: any) => (
          <div key={item.product.id} className="flex justify-between text-sm">
            <span className="text-muted flex-1 pr-4">
              {item.quantity} x {item.product.name}
            </span>
            <span className="font-medium">
              {format((item.product.discountPrice || item.product.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
        <span>Tổng cộng</span>
        <span className="text-primary">{format(total)}</span>
      </div>
    </div>
  );
}
