import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Zap, Clock, ShoppingCart, Flame, RefreshCw, Layers } from "lucide-react";
import { flashSaleApi, TodayDealsResponse, TodayDealItem, formatFlashSaleDiscount } from "../../../api/flashSaleApi";
import { comboApi } from "../../../api/comboApi";
import { useCartStore } from "../../../store/useCartStore";
import { useCartToastStore } from "../../../store/useCartToastStore";
import { useBranchStore } from "../../../store/useBranchStore";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ComboCatalog } from "../components/ComboCatalog";

export function DealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "combo" ? "combo" : "flash-sale";
  const [activeTab, setActiveTab] = useState<"flash-sale" | "combo">(initialTab);

  const { addItem, items: cartItems } = useCartStore();
  const { showToast } = useCartToastStore();
  const { selectedBranch } = useBranchStore();

  const [data, setData] = useState<TodayDealsResponse>({
    flashSale: { status: "NONE", campaign: null, items: [] },
    vouchers: [],
    deals: [],
  });
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const hasTriggeredExpireRefetch = useRef(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "combo" || tabParam === "flash-sale") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSwitchTab = (tab: "flash-sale" | "combo") => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await flashSaleApi.getTodayDeals();
      setData(res);
    } catch {
      setData({
        flashSale: { status: "NONE", campaign: null, items: [] },
        vouchers: [],
        deals: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const isLiveCampaign = data.flashSale.status !== "NONE" && !!data.flashSale.campaign;
  const isUpcoming = data.flashSale.status === "UPCOMING";

  useEffect(() => {
    hasTriggeredExpireRefetch.current = false;
  }, [data.flashSale.status, data.flashSale.targetTime, data.flashSale.targetDateTime, data.flashSale.campaign?.id]);

  useEffect(() => {
    const rawTarget = data.flashSale.targetDateTime || data.flashSale.targetTime;
    if (!isLiveCampaign || !rawTarget) {
      setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      let targetDate: Date;
      if (rawTarget.includes("T")) {
        targetDate = new Date(rawTarget);
      } else {
        targetDate = new Date();
        const parts = rawTarget.split(":");
        const th = parseInt(parts[0], 10) || 0;
        const tm = parseInt(parts[1], 10) || 0;
        const ts = parseInt(parts[2], 10) || 0;
        targetDate.setHours(th, tm, ts, 0);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        if (!hasTriggeredExpireRefetch.current) {
          hasTriggeredExpireRefetch.current = true;
          fetchDeals();
        }
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [isLiveCampaign, data.flashSale.targetTime]);

  // Combo count for Tab 2 badge
  const { data: combos = [] } = useQuery({
    queryKey: ["public-combos"],
    queryFn: comboApi.getPublicCombos,
    refetchInterval: 30000,
  });

  const handleAddToCart = (deal: TodayDealItem) => {
    const currentInCart = cartItems.find((i) => i.product.id === deal.product_id)?.quantity || 0;
    const limit = deal.max_per_user || 2;

    if (currentInCart >= limit) {
      alert(`Mỗi khách hàng chỉ được áp dụng giá ưu đãi tối đa ${limit} suất cho món "${deal.product_name}".`);
      return;
    }

    addItem(
      {
        id: deal.product_id,
        name: deal.product_name,
        slug: "flash-sale-deal",
        price: deal.original_price,
        discountPrice: deal.sale_price,
        images: [],
        category: { id: "deal", name: "Giờ Vàng" },
        stock: Math.max(1, deal.quantity_limit - deal.sold_count),
        description: `Món trong ca ${deal.campaign_name}`,
      },
      1
    );
    showToast(deal.product_name);
  };

  const activeDeals = useMemo(() => {
    if (!isLiveCampaign) return [];
    const active = data.deals.filter((d) => d.status === "ACTIVE");
    return active.length > 0 ? active : data.deals;
  }, [data.deals, isLiveCampaign]);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-gradient-to-b from-pastel-peach/40 via-surface to-background border-b border-border/80 pt-8 pb-8">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-6">
          {/* 2 Tabs Switcher: Flash Sale vs Combo */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border w-fit shadow-xs">
            <button
              type="button"
              onClick={() => handleSwitchTab("flash-sale")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "flash-sale"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Flash Sale</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("combo")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "combo"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-soft"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Combo Tiết Kiệm ({combos.length})</span>
            </button>
          </div>

          {activeTab === "flash-sale" ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-surface border border-accent/25 shadow-card">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-tint border border-accent/30 text-xs font-bold text-accent-dark">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{isLiveCampaign ? "GIỜ VÀNG GIẢM GIÁ HIỆN TẠI" : "CHƯƠNG TRÌNH GIỜ VÀNG"}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {isLiveCampaign && data.flashSale.campaign?.name
                      ? data.flashSale.campaign.name
                      : "Ưu Đãi Giờ Vàng CSM"}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted max-w-xl">
                    {isLiveCampaign
                      ? "Các sản phẩm đang áp dụng mức giá ưu đãi thần tốc trong khung giờ hôm nay. Chọn mua ngay để nhận giá tốt nhất!"
                      : "Hiện tại chưa có ca Giờ Vàng nào đang diễn ra. Hãy chuyển sang tab Combo Tiết Kiệm hoặc quay lại vào khung giờ tiếp theo!"}
                  </p>
                </div>

                {isLiveCampaign ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-soft border border-border flex flex-col items-center justify-center shrink-0 min-w-[220px]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted mb-2">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>{isUpcoming ? "Bắt đầu ca sau:" : "Kết thúc sau:"}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-lg font-black">
                      <span className="px-3 py-1.5 rounded-xl bg-foreground text-background shadow-xs">
                        {timeLeft.hours}
                      </span>
                      <span className="text-foreground font-black">:</span>
                      <span className="px-3 py-1.5 rounded-xl bg-foreground text-background shadow-xs">
                        {timeLeft.minutes}
                      </span>
                      <span className="text-foreground font-black">:</span>
                      <span className="px-3 py-1.5 rounded-xl bg-accent text-white shadow-xs">
                        {timeLeft.seconds}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-primary-dark mt-2">
                      {isUpcoming ? "⚡ Ca tiếp theo hôm nay" : "🔥 Đang mở bán trực tiếp"}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-soft border border-dashed border-border flex flex-col items-center justify-center shrink-0 min-w-[220px] text-center">
                    <Clock className="w-6 h-6 text-muted mb-1.5" />
                    <span className="text-xs font-bold text-foreground">Chưa có Flash Sale</span>
                    <span className="text-[11px] text-muted mt-0.5">Đồng hồ đã tạm dừng</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent fill-current" />
                  <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                    Sản Phẩm Đang Giảm Giá ({activeDeals.length} món)
                  </h2>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDeals}
                  disabled={loading}
                  className="rounded-2xl gap-1.5 text-xs font-semibold shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Cập nhật</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-primary/25 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-tint border border-primary/25 text-xs font-bold text-primary-dark">
                  <Layers className="w-3.5 h-3.5" />
                  <span>COMBO SIÊU TIẾT KIỆM</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Mua Chung Giá Rẻ — Trọn Vẹn Bữa Ăn
                </h1>
                <p className="text-xs sm:text-sm text-muted max-w-xl">
                  Chọn ngay các gói Combo ghép món ưu đãi. Tồn kho được kiểm tra trực tiếp tại{" "}
                  <strong className="text-foreground">{selectedBranch?.name || "chi nhánh hiện tại"}</strong>.
                </p>
              </div>
              <Button variant="outline" asChild className="rounded-2xl text-xs font-semibold shrink-0">
                <Link to="/products">Xem sản phẩm lẻ &rarr;</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content Body: tab combo dùng cùng độ rộng khung với khối Combo ở trang chủ để thẻ combo có cùng kích thước */}
      <div className={`container mx-auto px-4 md:px-6 mt-8 ${activeTab === "combo" ? "" : "max-w-6xl"}`}>
        {activeTab === "flash-sale" ? (
          loading ? (
            <div className="p-16 text-center text-muted font-medium bg-surface rounded-3xl border border-border">
              Đang tải dữ liệu giảm giá hiện tại...
            </div>
          ) : activeDeals.length === 0 ? (
            <div className="p-16 text-center bg-surface rounded-3xl border border-dashed border-border text-muted space-y-3">
              <div className="text-base font-bold text-foreground">Hiện tại chưa có sản phẩm Flash Sale</div>
              <p className="text-xs">
                Các ca Giờ Vàng sẽ được mở theo khung giờ trong ngày. Bạn có thể xem các gói Combo tiết kiệm ngay bây giờ!
              </p>
              <Button
                variant="soft"
                size="sm"
                onClick={() => handleSwitchTab("combo")}
                className="rounded-2xl text-xs font-bold"
              >
                Xem Combo Tiết Kiệm &rarr;
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {activeDeals.map((deal) => {
                const discountLabel = formatFlashSaleDiscount(deal);
                const isLive = deal.status === "ACTIVE";
                const remaining = Math.max(0, deal.quantity_limit - deal.sold_count);
                const isSoldOut = remaining <= 0;

                return (
                  <Card
                    key={deal.id}
                    className="p-5 rounded-3xl bg-surface border border-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span>
                            {deal.start_time.slice(0, 5)} - {deal.end_time.slice(0, 5)}
                          </span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isLive
                              ? "bg-danger-pastel text-danger-dark border-danger/25"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {isLive ? "🔥 Đang giảm" : "⚡ Sắp mở"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-foreground line-clamp-2">
                          {deal.product_name}
                        </h3>
                        <div className="text-[11px] text-muted font-medium mt-0.5">
                          {deal.campaign_name}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2.5 pt-1">
                        <span className="text-xl font-black text-danger-dark font-mono">
                          {formatVND(deal.sale_price)}
                        </span>
                        <span className="text-xs text-muted line-through font-mono">
                          {formatVND(deal.original_price)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-danger-pastel text-danger-dark text-[10px] font-black">
                          {discountLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-muted">Đã bán {deal.sold_count} suất</span>
                          <span className={isSoldOut ? "text-danger-dark font-bold" : "text-primary-dark"}>
                            {isSoldOut ? "Đã hết suất" : `Còn ${remaining} suất`}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-soft border border-border/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSoldOut ? "bg-danger" : "bg-gradient-to-r from-amber-500 to-danger"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((deal.sold_count / Math.max(1, deal.quantity_limit)) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-muted">
                          Giới hạn tối đa {deal.max_per_user} suất / khách hàng
                        </div>
                      </div>
                    </div>

                    <Button
                      disabled={!isLive || isSoldOut}
                      onClick={() => handleAddToCart(deal)}
                      className="w-full rounded-2xl h-10 text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isSoldOut ? "Đã bán hết" : isLive ? "Thêm vào giỏ ngay" : "Chưa tới giờ mở"}</span>
                    </Button>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <ComboCatalog showSearchBar />
        )}
      </div>
    </div>
  );
}
