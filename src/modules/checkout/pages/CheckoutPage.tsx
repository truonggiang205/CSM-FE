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
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
        {[
          { stepNum: 1, title: "Thông tin" },
          { stepNum: 2, title: "Thanh toán" },
          { stepNum: 3, title: "Hoàn tất" }
        ].map((item) => (
          <div key={item.stepNum} className="flex flex-col items-center bg-background px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= item.stepNum 
                  ? "bg-primary text-white shadow-sm ring-4 ring-primary-tint" 
                  : "bg-surface border-2 border-border text-muted"
              }`}
            >
              {item.stepNum}
            </div>
            <span className={`text-xs mt-1 font-medium ${step >= item.stepNum ? "text-primary-dark font-semibold" : "text-muted"}`}>
              {item.title}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card">
            <h2 className="text-lg font-bold mb-6 text-foreground">Thông tin nhận hàng</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" required placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" required placeholder="0912345678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Địa chỉ giao hàng</Label>
                <Input id="address" required placeholder="Số nhà, tên đường, phường/xã..." />
              </div>
              <Button type="submit" className="w-full mt-4 h-11">Tiếp tục đến thanh toán</Button>
            </form>
          </div>
          <div>
            <OrderSummary items={items} total={getTotalPrice()} format={formatCurrency} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card">
            <h2 className="text-lg font-bold mb-6 text-foreground">Phương thức thanh toán</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 border border-border/80 p-4 rounded-2xl cursor-pointer hover:bg-primary-tint/40 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary-tint/30">
                <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-primary focus:ring-primary/40" />
                <span className="font-medium text-sm text-foreground">Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center space-x-3 border border-border/80 p-4 rounded-2xl cursor-pointer hover:bg-primary-tint/40 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary-tint/30">
                <input type="radio" name="payment" className="w-4 h-4 text-primary focus:ring-primary/40" />
                <span className="font-medium text-sm text-foreground">Thanh toán qua Ví MoMo / ZaloPay</span>
              </label>
              <label className="flex items-center space-x-3 border border-border/80 p-4 rounded-2xl cursor-pointer hover:bg-primary-tint/40 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary-tint/30">
                <input type="radio" name="payment" className="w-4 h-4 text-primary focus:ring-primary/40" />
                <span className="font-medium text-sm text-foreground">Thẻ ATM / Visa / Mastercard</span>
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
        <div className="text-center py-16 bg-surface rounded-3xl border border-border p-8 shadow-card max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-success-pastel border border-success/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success-dark" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Đặt hàng thành công!</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Cảm ơn bạn đã mua sắm tại <span className="font-semibold text-foreground">CSM Store</span>. Đơn hàng của bạn đang được cửa hàng chuẩn bị ngay.
          </p>
          <Button asChild className="px-8">
            <Link to="/">Về trang chủ mua sắm</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ items, total, format }: any) {
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card">
      <h3 className="font-bold mb-4 text-base text-foreground flex items-center justify-between">
        <span>Tóm tắt đơn hàng</span>
        <span className="text-xs font-normal text-muted">{items.length} món</span>
      </h3>
      <div className="space-y-3 mb-6 divide-y divide-border/60">
        {items.map((item: any) => (
          <div key={item.product.id} className="pt-3 first:pt-0 flex justify-between text-xs sm:text-sm">
            <span className="text-muted flex-1 pr-4">
              <span className="font-bold text-foreground mr-1.5">{item.quantity}x</span> {item.product.name}
            </span>
            <span className="font-semibold text-foreground">
              {format((item.product.discountPrice || item.product.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4 flex justify-between items-center">
        <span className="font-medium text-sm text-muted">Tổng thanh toán</span>
        <span className="text-primary-dark font-extrabold text-xl">{format(total)}</span>
      </div>
    </div>
  );
}
