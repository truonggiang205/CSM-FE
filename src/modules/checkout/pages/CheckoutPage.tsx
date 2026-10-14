import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Truck,
  Tag,
  Check,
  ChevronRight,
  Wallet,
  Landmark,
  Banknote,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "../../../store/useCartStore";
import { useBranchStore } from "../../../store/useBranchStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderApi, PaymentMethod } from "../../../api/orderApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { ProductImage } from "../../../components/ui/ProductImage";

const FREESHIP_THRESHOLD = 150000;

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { selectedBranch } = useBranchStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Payment, 3: Success
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // TODO: Mã giảm giá/Voucher và Phí ship hiện tại chỉ mang tính minh hoạ UI/UX và chưa được backend OrderService hỗ trợ trong contract POST /orders. Tổng tiền chính thức do hệ thống backend tự tính dựa trên đơn giá snapshot từ database.
  // Tuyệt đối không gửi giá hay mã giảm giá lên backend.
  const rawTotal = getTotalPrice();
  const shippingFee = rawTotal >= FREESHIP_THRESHOLD ? 0 : 15000;
  const finalTotal = Math.max(0, rawTotal + shippingFee - appliedDiscount);

  // Áp dụng voucher giảm giá (minh hoạ giao diện)
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError("");
    setVoucherSuccess("");

    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === "CSM20K" || code === "WELCOME" || code === "TIENLOI") {
      setAppliedDiscount(20000);
      setVoucherSuccess(`Đã áp dụng mã ${code}: Giảm 20.000₫!`);
    } else {
      setVoucherError("Mã giảm giá không hợp lệ hoặc đã hết hạn (Thử mã: CSM20K)");
    }
  };

  // Nếu giỏ hàng trống và chưa tạo đơn thành công
  if (items.length === 0 && step !== 3) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4 shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Giỏ hàng đang trống</h2>
        <p className="text-muted text-xs sm:text-sm mt-2">
          Vui lòng chọn thêm sản phẩm trước khi tiến hành thanh toán.
        </p>
        <Button asChild className="mt-6 rounded-2xl shadow-sm text-xs font-semibold">
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

  // Hoàn tất đặt hàng qua Backend API (TUYỆT ĐỐI KHÔNG GỬI GIÁ)
  const handleCompleteOrder = async () => {
    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const branchId = selectedBranch?.id || "br-01";
      const fullAddress = shippingAddress.trim() + (orderNotes.trim() ? ` (Ghi chú: ${orderNotes.trim()})` : "");

      const orderPayload = {
        branchId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        shippingAddress: fullAddress || "Tại quầy / Địa chỉ khách cung cấp",
        paymentMethod,
      };

      const res = await orderApi.createOrder(orderPayload);

      // Xoá giỏ hàng CHỈ SAU KHI tạo đơn thành công
      clearCart();
      setCreatedOrderId(res.orderId);

      // Nếu có paymentUrl (thanh toán online MoMo, ZaloPay, ATM) -> Chuyển hướng tới trang thanh toán
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

      if (
        rawMsg.toLowerCase().includes("tồn kho") ||
        rawMsg.toLowerCase().includes("không đủ") ||
        err.response?.status === 400
      ) {
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
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl space-y-8">
      {/* Back button */}
      {step < 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          className="rounded-2xl text-xs font-semibold gap-1.5 text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 2 ? "Quay lại thông tin giao hàng" : "Quay lại"}</span>
        </Button>
      )}

      {/* ================= STEPPER PROGRESS BAR ================= */}
      <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-8 right-8 top-5 -translate-y-1/2 h-1 bg-border -z-0" />
          <div
            className="absolute left-8 top-5 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-0"
            style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
          />

          {[
            { num: 1, label: "Thông tin giao nhận" },
            { num: 2, label: "Phương thức thanh toán" },
            { num: 3, label: "Hoàn tất đơn hàng" },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center relative z-10 bg-surface px-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shadow-xs ${
                    isDone
                      ? "bg-primary text-white"
                      : isCurrent
                      ? "bg-primary text-white ring-4 ring-primary-tint"
                      : "bg-surface-soft border border-border text-muted"
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5 text-white" /> : s.num}
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-2 font-semibold text-center whitespace-nowrap ${
                    isCurrent ? "text-primary-dark font-extrabold" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-danger-pastel border border-danger/25 text-danger-dark text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger-dark" />
          <div className="flex-1">
            <p className="font-semibold">Đã xảy ra lỗi khi tạo đơn hàng</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ================= STEP 1: SHIPPING INFO ================= */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider mb-1">
                <Truck className="w-4 h-4 text-accent" />
                Bước 1 / 3
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Thông Tin Giao Nhận</h2>
              <p className="text-muted text-xs mt-0.5">
                Vui lòng cung cấp địa chỉ chính xác để nhân viên giao hàng nhanh trong 30 phút.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleProceedToPayment}>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name" className="text-xs font-semibold">
                  Họ và tên người nhận *
                </Label>
                <Input
                  id="checkout-name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="rounded-2xl bg-surface-soft text-xs"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone" className="text-xs font-semibold">
                  Số điện thoại nhận hàng *
                </Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  className="rounded-2xl bg-surface-soft text-xs"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-address" className="text-xs font-semibold">
                  Địa chỉ giao hàng chi tiết *
                </Label>
                <Input
                  id="checkout-address"
                  required
                  placeholder="Số nhà, tên đường, toà nhà, phường/xã..."
                  className="rounded-2xl bg-surface-soft text-xs"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-notes" className="text-xs font-semibold">
                  Ghi chú cho shipper (tuỳ chọn)
                </Label>
                <Input
                  id="checkout-notes"
                  placeholder="Ví dụ: Giao lên lầu 3, gọi trước khi đến..."
                  className="rounded-2xl bg-surface-soft text-xs"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              {/* Branch Serving Info */}
              <div className="p-3.5 rounded-2xl bg-primary-tint/50 border border-primary/20 text-xs text-primary-dark flex items-center justify-between">
                <span>Chi nhánh phục vụ đơn:</span>
                <span className="font-bold text-foreground">
                  {selectedBranch?.name || "Chi nhánh Quận 1 (br-01)"}
                </span>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 h-11 text-xs sm:text-sm font-bold rounded-2xl shadow-sm gap-2"
              >
                <span>Tiếp tục đến phương thức thanh toán</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-5 sticky top-24">
            <OrderSummaryBox
              items={items}
              rawTotal={rawTotal}
              shippingFee={shippingFee}
              discount={appliedDiscount}
              finalTotal={finalTotal}
              format={formatCurrency}
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              onApplyVoucher={handleApplyVoucher}
              voucherError={voucherError}
              voucherSuccess={voucherSuccess}
            />
          </div>
        </div>
      )}

      {/* ================= STEP 2: PAYMENT METHOD ================= */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-card space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-dark uppercase tracking-wider mb-1">
                <CreditCard className="w-4 h-4 text-primary" />
                Bước 2 / 3
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Chọn Phương Thức Thanh Toán</h2>
              <p className="text-muted text-xs mt-0.5">
                Hỗ trợ thanh toán linh hoạt bằng tiền mặt hoặc qua các cổng thanh toán mô phỏng an toàn.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "COD" as PaymentMethod,
                  title: "Thanh toán khi nhận hàng (COD)",
                  desc: "Nhận hàng kiểm tra và gửi tiền mặt cho shipper",
                  icon: <Banknote className="w-5 h-5 text-emerald-600" />,
                  badge: "Tiền mặt",
                  badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
                {
                  id: "MOMO" as PaymentMethod,
                  title: "Ví điện tử MoMo",
                  desc: "Chuyển hướng cổng thanh toán MoMo mô phỏng",
                  icon: <Wallet className="w-5 h-5 text-pink-600" />,
                  badge: "Ví điện tử",
                  badgeStyle: "bg-pink-50 text-pink-700 border-pink-200",
                },
                {
                  id: "ZALOPAY" as PaymentMethod,
                  title: "Ví điện tử ZaloPay",
                  desc: "Quét mã QR qua cổng ZaloPay mô phỏng",
                  icon: <Sparkles className="w-5 h-5 text-blue-600" />,
                  badge: "QR Code",
                  badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
                },
                {
                  id: "ATM" as PaymentMethod,
                  title: "Thẻ ATM Nội địa / Thẻ Quốc tế",
                  desc: "Cổng thanh toán liên kết ngân hàng",
                  icon: <Landmark className="w-5 h-5 text-indigo-600" />,
                  badge: "Ngân hàng",
                  badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
                },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-4 p-4 rounded-3xl cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary-tint/40 shadow-xs ring-2 ring-primary/20"
                        : "border-border/80 hover:bg-surface-soft/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method-selector"
                      value={m.id}
                      checked={isSelected}
                      onChange={() => setPaymentMethod(m.id)}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary/40 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-surface border border-border/80 flex items-center justify-center shadow-2xs">
                            {m.icon}
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {m.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeStyle}`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1 pl-10">{m.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-surface-soft border border-border/80 text-xs text-muted flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
              <span>
                Đơn hàng được giữ tồn kho tự động trong hệ thống (Saga Pattern). Bạn có thể kiểm tra trạng thái đơn bất kỳ lúc nào.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
                className="flex-1 rounded-2xl h-11 text-xs font-semibold"
              >
                Quay lại
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={handleCompleteOrder}
                className="flex-1 rounded-2xl h-11 text-xs sm:text-sm font-bold shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý đơn...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Xác nhận đặt hàng
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-5 sticky top-24">
            <OrderSummaryBox
              items={items}
              rawTotal={rawTotal}
              shippingFee={shippingFee}
              discount={appliedDiscount}
              finalTotal={finalTotal}
              format={formatCurrency}
              voucherCode={voucherCode}
              setVoucherCode={setVoucherCode}
              onApplyVoucher={handleApplyVoucher}
              voucherError={voucherError}
              voucherSuccess={voucherSuccess}
            />
          </div>
        </div>
      )}

      {/* ================= STEP 3: SUCCESS ================= */}
      {step === 3 && (
        <div className="text-center py-16 bg-surface rounded-3xl border border-border p-8 shadow-card max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-success-pastel border border-success/30 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-success-dark animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Đặt Hàng Thành Công!</h1>
            {createdOrderId && (
              <p className="text-xs font-mono font-bold text-primary-dark mt-1">
                Mã đơn hàng: #{createdOrderId}
              </p>
            )}
            <p className="text-muted text-xs sm:text-sm mt-3 leading-relaxed">
              Cảm ơn bạn đã lựa chọn mua sắm tại <span className="font-bold text-foreground">CSM Store</span>. Đơn hàng đã được chuyển tới chi nhánh để chuẩn bị và giao ngay trong 30 phút.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {createdOrderId && (
              <Button asChild variant="outline" className="rounded-2xl text-xs font-semibold">
                <Link to={`/orders/${createdOrderId}`}>Xem chi tiết đơn hàng</Link>
              </Button>
            )}
            <Button asChild className="rounded-2xl text-xs font-semibold">
              <Link to="/orders">Danh sách đơn mua</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderSummaryBoxProps {
  items: any[];
  rawTotal: number;
  shippingFee: number;
  discount: number;
  finalTotal: number;
  format: (amount: number) => string;
  voucherCode: string;
  setVoucherCode: (val: string) => void;
  onApplyVoucher: (e: React.FormEvent) => void;
  voucherError: string;
  voucherSuccess: string;
}

function OrderSummaryBox({
  items,
  rawTotal,
  shippingFee,
  discount,
  finalTotal,
  format,
  voucherCode,
  setVoucherCode,
  onApplyVoucher,
  voucherError,
  voucherSuccess,
}: OrderSummaryBoxProps) {
  return (
    <div className="bg-surface p-6 rounded-3xl border border-border shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <h3 className="font-bold text-sm sm:text-base text-foreground">Tóm tắt đơn hàng</h3>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-tint text-primary-dark border border-primary/20">
          {items.reduce((acc, i) => acc + i.quantity, 0)} món
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-border/60">
        {items.map((item) => (
          <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-soft border border-border/60 flex-shrink-0">
              <ProductImage
                src={item.product.images && item.product.images[0]}
                alt={item.product.name}
                productName={item.product.name}
                className="w-full h-full object-cover"
                iconClassName="w-4 h-4 text-primary"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs text-foreground truncate">
                {item.product.name}
              </h4>
              <span className="text-[11px] text-muted font-mono">SL: x{item.quantity}</span>
            </div>
            <span className="font-bold text-xs text-primary-dark shrink-0">
              {format((item.product.discountPrice || item.product.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Voucher Input */}
      <form onSubmit={onApplyVoucher} className="pt-2 border-t border-border/60 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Mã voucher (CSM20K)..."
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="pl-8 text-xs rounded-xl bg-surface-soft uppercase"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold px-3"
          >
            Áp dụng
          </Button>
        </div>
        {voucherSuccess && (
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {voucherSuccess}
          </p>
        )}
        {voucherError && (
          <p className="text-[11px] font-medium text-danger">{voucherError}</p>
        )}
      </form>

      {/* Financial Breakdown */}
      <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
        <div className="flex justify-between items-center text-muted">
          <span>Tạm tính hàng hoá:</span>
          <span className="font-semibold text-foreground">{format(rawTotal)}</span>
        </div>

        <div className="flex justify-between items-center text-muted">
          <span>Phí giao hàng:</span>
          {shippingFee === 0 ? (
            <span className="text-emerald-600 font-bold">Miễn phí (Freeship)</span>
          ) : (
            <span className="font-semibold text-foreground">{format(shippingFee)}</span>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 font-semibold">
            <span>Giảm giá voucher:</span>
            <span>-{format(discount)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border/80 flex justify-between items-baseline">
          <span className="font-extrabold text-sm text-foreground">Tổng thanh toán:</span>
          <span className="text-xl font-black text-primary-dark">{format(finalTotal)}</span>
        </div>
        <p className="text-[11px] text-muted text-right italic">
          * Tổng tiền cuối cùng do hệ thống xác nhận
        </p>
      </div>
    </div>
  );
}

export default CheckoutPage;

