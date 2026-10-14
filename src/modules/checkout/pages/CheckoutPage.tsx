import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, ShieldCheck } from "lucide-react";
import { useCartStore } from "../../../store/useCartStore";
import { useBranchStore } from "../../../store/useBranchStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, PaymentMethod } from "../../../api/orderApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Payment, 3: Success
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Nếu giỏ hàng trống và chưa tạo đơn thành công
  if (items.length === 0 && step !== 3) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Giỏ hàng đang trống</h2>
        <p className="text-muted text-sm mt-2">Vui lòng chọn thêm sản phẩm trước khi tiến hành thanh toán.</p>
        <Button asChild className="mt-6 shadow-sm">
          <Link to="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  // Chuyển sang bước 2: Thanh toán (yêu cầu đăng nhập)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }

    setStep(2);
  };

  // Hoàn tất đặt hàng thật qua Backend API
  const handleCompleteOrder = async () => {
    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const branchId = selectedBranch?.id || "br-01";
      const orderPayload = {
        branchId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        shippingAddress: shippingAddress.trim() || "Tại quầy / Địa chỉ khách cung cấp",
        paymentMethod,
      };

      const res = await orderApi.createOrder(orderPayload);

      // Xoá giỏ hàng CHỈ SAU KHI tạo đơn thành công
      clearCart();
      setCreatedOrderId(res.orderId);

      // Nếu có paymentUrl (thanh toán online MoMo, ZaloPay, ATM) -> Chuyển hướng tới trang mô phỏng
      if (res.paymentUrl && res.paymentUrl.trim() !== "") {
        window.location.href = res.paymentUrl;
        return;
      }

      // Thanh toán COD thành công: Chuyển thẳng tới trang chi tiết đơn hàng
      if (res.orderId) {
        navigate(`/orders/${res.orderId}`);
        return;
      }

      setStep(3);
    } catch (err: any) {
      let rawMsg = err.response?.data?.message || err.message || "Lỗi tạo đơn hàng";
      if (Array.isArray(rawMsg)) {
        rawMsg = rawMsg.join(", ");
      }

      // Thông báo thân thiện khi hết hàng / tồn kho không đủ
      if (rawMsg.toLowerCase().includes("tồn kho") || rawMsg.toLowerCase().includes("không đủ") || err.response?.status === 400) {
        setErrorMessage(
          `⚠️ Không thể tạo đơn hàng: ${rawMsg}. Vui lòng kiểm tra lại số lượng hoặc chọn chi nhánh khác.`
        );
      } else {
        setErrorMessage(`⚠️ Đặt hàng thất bại: ${rawMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {step < 3 && (
        <Button variant="ghost" onClick={() => (step === 2 ? setStep(1) : navigate(-1))} className="mb-6 -ml-4 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 2 ? "Quay lại thông tin giao hàng" : "Quay lại"}
        </Button>
      )}

      {/* Thanh tiến trình (Step Indicator) */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
        {[
          { stepNum: 1, title: "Thông tin giao nhận" },
          { stepNum: 2, title: "Phương thức thanh toán" },
          { stepNum: 3, title: "Hoàn tất đơn hàng" },
        ].map((item) => (
          <div key={item.stepNum} className="flex flex-col items-center bg-background px-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= item.stepNum
                  ? "bg-primary text-white shadow-sm ring-4 ring-primary-tint"
                  : "bg-surface border-2 border-border text-muted"
              }`}
            >
              {item.stepNum}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium ${
                step >= item.stepNum ? "text-primary-dark font-bold" : "text-muted"
              }`}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger-dark" />
          <div className="flex-1">
            <p className="font-semibold">Đã xảy ra lỗi khi tạo đơn hàng</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* BƯỚC 1: THÔNG TIN GIAO HÀNG */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Thông tin giao nhận</h2>
              <p className="text-muted text-xs mt-0.5">Vui lòng điền địa chỉ để cửa hàng giao đến bạn nhanh nhất.</p>
            </div>

            <form className="space-y-4" onSubmit={handleProceedToPayment}>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name">Họ và tên người nhận</Label>
                <Input
                  id="checkout-name"
                  required
                  placeholder="Nguyễn Văn A"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone">Số điện thoại liên hệ</Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  required
                  placeholder="0912345678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-address">Địa chỉ nhận hàng</Label>
                <Input
                  id="checkout-address"
                  required
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-soft border border-border/80 text-xs text-muted flex items-center justify-between">
                <span>Chi nhánh phục vụ:</span>
                <span className="font-bold text-foreground">{selectedBranch?.name || "Chi nhánh Quận 1 (br-01)"}</span>
              </div>

              <Button type="submit" className="w-full mt-4 h-11 text-sm font-semibold shadow-sm">
                Tiếp tục đến thanh toán &rarr;
              </Button>
            </form>
          </div>

          <div>
            <OrderSummary items={items} total={getTotalPrice()} format={formatCurrency} />
          </div>
        </div>
      )}

      {/* BƯỚC 2: CHỌN PHƯƠNG THỨC THANH TOÁN */}
      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Chọn phương thức thanh toán</h2>
              <p className="text-muted text-xs mt-0.5">Lựa chọn thanh toán khi nhận hàng hoặc qua cổng mô phỏng.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "COD" as PaymentMethod,
                  title: "Thanh toán khi nhận hàng (COD)",
                  desc: "Nhận hàng kiểm tra và trả tiền mặt cho shipper",
                  icon: "💵",
                },
                {
                  id: "MOMO" as PaymentMethod,
                  title: "Ví điện tử MoMo (Mô phỏng trực tuyến)",
                  desc: "Chuyển hướng cổng thanh toán mô phỏng an toàn",
                  icon: "🌸",
                },
                {
                  id: "ZALOPAY" as PaymentMethod,
                  title: "Ví điện tử ZaloPay (Mô phỏng trực tuyến)",
                  desc: "Quét mã QR qua ứng dụng ZaloPay mô phỏng",
                  icon: "⚡",
                },
                {
                  id: "ATM" as PaymentMethod,
                  title: "Thẻ ATM Nội địa / Thẻ quốc tế",
                  desc: "Cổng thanh toán thẻ ngân hàng liên kết",
                  icon: "💳",
                },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer border transition-all ${
                    paymentMethod === m.id
                      ? "border-primary bg-primary-tint/50 shadow-sm"
                      : "border-border/80 hover:bg-surface-soft/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-payment-method"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                    className="mt-1 w-4 h-4 text-primary focus:ring-primary/40"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.icon}</span>
                      <span className="font-bold text-sm text-foreground">{m.title}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-primary-tint/40 border border-primary/20 text-xs text-primary-dark flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>Đơn hàng được bảo mật và giữ tồn kho theo thời gian thực (Saga Pattern).</span>
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
                className="flex-1 h-11"
              >
                Quay lại
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={handleCompleteOrder}
                className="flex-1 h-11 text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo đơn...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Xác nhận đặt hàng
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div>
            <OrderSummary items={items} total={getTotalPrice()} format={formatCurrency} />
          </div>
        </div>
      )}

      {/* BƯỚC 3: HOÀN TẤT */}
      {step === 3 && (
        <div className="text-center py-16 bg-surface rounded-3xl border border-border p-8 shadow-card max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-success-pastel border border-success/30 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-success-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Đặt hàng thành công!</h1>
            {createdOrderId && (
              <p className="text-xs font-mono font-bold text-primary-dark mt-1">
                Mã đơn: #{createdOrderId}
              </p>
            )}
            <p className="text-muted text-sm mt-3 leading-relaxed">
              Cảm ơn bạn đã mua sắm tại <span className="font-semibold text-foreground">CSM Store</span>. Đơn hàng của bạn đã được ghi nhận trên hệ thống và chuyển đến chi nhánh để xử lý.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {createdOrderId && (
              <Button asChild variant="outline">
                <Link to={`/orders/${createdOrderId}`}>Xem chi tiết đơn hàng</Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/orders">Danh sách đơn của tôi</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ items, total, format }: any) {
  return (
    <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <h3 className="font-bold text-base text-foreground">Tóm tắt đơn hàng</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-tint text-primary-dark">
          {items.length} món
        </span>
      </div>

      <div className="space-y-3 divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
        {items.map((item: any) => (
          <div key={item.product.id} className="pt-3 first:pt-0 flex justify-between text-xs sm:text-sm">
            <div className="pr-4 flex-1">
              <span className="font-bold text-foreground mr-1.5">{item.quantity}x</span>
              <span className="text-foreground">{item.product.name}</span>
            </div>
            <span className="font-bold text-primary-dark shrink-0">
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

export default CheckoutPage;
