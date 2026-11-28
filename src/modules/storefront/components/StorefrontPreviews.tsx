import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, Clock, Megaphone, MousePointerClick, Pause, Play, ShoppingCart, Sparkles, X, Zap } from "lucide-react";
import {
  AnnouncementTone,
  ANNOUNCEMENT_TONE_META,
  BannerPlacement,
  BANNER_PLACEMENT_META,
  HomeSectionType,
  HOME_SECTION_META,
} from "../../../api/storefrontApi";
import { MARQUEE_SPEED } from "../../../components/storefront/AnnouncementBar";
import { ProductImage } from "../../../components/ui/ProductImage";
import { resolveAssetUrl } from "../../../lib/assetUrl";
import { Product } from "../../../types/product";

/* ------------------------------------------------------------------ */
/* Khung dùng chung                                                    */
/* ------------------------------------------------------------------ */

const Bar = ({ w = "w-full", h = "h-1.5", c = "bg-slate-300" }: { w?: string; h?: string; c?: string }) => (
  <div className={`${w} ${h} ${c} rounded-full`} />
);

const SkeletonCard = () => (
  <div className="rounded-md bg-white border border-slate-200 flex flex-col gap-1 p-1">
    <div className="aspect-square rounded bg-slate-200" />
    <Bar w="w-3/4" h="h-1" />
    <Bar w="w-1/2" h="h-1" c="bg-emerald-300" />
  </div>
);

/** Trình duyệt thu nhỏ: thanh địa chỉ + nội dung trang mô phỏng */
export function MiniBrowser({ url, children, testId }: { url: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden" data-testid={testId}>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-soft border-b border-border">
        <span className="w-2 h-2 rounded-full bg-rose-300" />
        <span className="w-2 h-2 rounded-full bg-amber-300" />
        <span className="w-2 h-2 rounded-full bg-emerald-300" />
        <span className="ml-2 flex-1 h-4 rounded-md bg-white border border-border text-[9px] text-muted px-2 flex items-center truncate">{url}</span>
      </div>
      <div className="relative bg-slate-50">{children}</div>
    </div>
  );
}

const MockHeader = ({ cartBadge = false }: { cartBadge?: boolean }) => (
  <div className="h-7 bg-white border-b border-slate-200 flex items-center px-2.5 gap-2">
    <div className="w-4 h-4 rounded bg-emerald-500 text-[7px] font-black text-white flex items-center justify-center">C</div>
    <span className="text-[9px] font-extrabold text-emerald-700">CSM</span>
    <div className="flex-1 h-3 rounded-full bg-slate-100 mx-2 max-w-[160px]" />
    <div className="hidden sm:flex gap-2">
      <Bar w="w-6" h="h-1" />
      <Bar w="w-6" h="h-1" />
      <Bar w="w-6" h="h-1" />
    </div>
    <div className="relative ml-auto">
      <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
      {cartBadge && <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 text-[6px] text-white flex items-center justify-center">2</span>}
    </div>
  </div>
);

/** Viền nhấp nháy + nhãn "Banner của bạn ở đây" */
function Spotlight({ children, label = "Banner hiện ở đây", className = "" }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div className={`relative rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-slate-50 ${className}`} data-testid="placement-spotlight">
      <span className="absolute inset-0 rounded-lg ring-2 ring-primary/50 animate-ping pointer-events-none" style={{ animationDuration: "2.2s" }} />
      <span className="absolute -top-2.5 right-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold shadow">
        <MousePointerClick className="w-2.5 h-2.5" />
        {label}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Thanh thông báo chạy chữ                                         */
/* ------------------------------------------------------------------ */

export interface PreviewAnnouncement {
  id?: string;
  message: string;
  link_url?: string | null;
  link_text?: string | null;
  tone: AnnouncementTone;
}

/** Ở bản xem trước chỉ nghỉ vài giây cho nhanh (trên web thật nghỉ 1 phút) */
const PREVIEW_REST_MS = 3_000;

interface AnnouncementLivePreviewProps {
  items: PreviewAnnouncement[];
  /** Ghi chú dưới khung, ví dụ "Đang chạy 3 thông báo" */
  caption?: string;
  emptyText?: string;
  /** Bản gọn: chỉ thanh thông báo + đầu trang (dùng trong form) */
  compact?: boolean;
}

/**
 * Mô phỏng đầu trang web của khách với thanh thông báo chạy chữ thật:
 * cùng tốc độ, cùng thứ tự, cùng màu. Hết một vòng thì thu gọn và chạy lại.
 */
export function AnnouncementLivePreview({ items, caption, emptyText = "Chưa có thông báo nào đang hiển thị", compact = false }: AnnouncementLivePreviewProps) {
  const signature = items.map((a) => `${a.id || ""}|${a.message}|${a.tone}|${a.link_text || ""}|${a.link_url || ""}`).join("§");
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [resting, setResting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [distance, setDistance] = useState<{ from: number; to: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setResting(false);
    setCycle((c) => c + 1);
  }, [signature]);

  useEffect(() => {
    if (!resting) return;
    const t = setTimeout(() => {
      setIndex(0);
      setCycle((c) => c + 1);
      setResting(false);
    }, PREVIEW_REST_MS);
    return () => clearTimeout(t);
  }, [resting]);

  useLayoutEffect(() => {
    if (resting) return;
    const track = trackRef.current;
    const text = textRef.current;
    if (!track || !text) return;
    setDistance({ from: track.clientWidth, to: -text.scrollWidth });
  }, [index, cycle, resting, signature]);

  const goNext = () => {
    if (index < items.length - 1) setIndex((i) => i + 1);
    else setResting(true);
  };

  const current = items[index] || items[0];
  const tone = current ? ANNOUNCEMENT_TONE_META[current.tone] || ANNOUNCEMENT_TONE_META.primary : null;
  const durationSec = distance ? (distance.from - distance.to) / MARQUEE_SPEED : 0;

  return (
    <div className="space-y-1.5">
      <MiniBrowser url="csm.vn" testId="announcement-live-preview">
        <AnimatePresence initial={false}>
          {current && tone && !resting && (
            <motion.div
              key="bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`${tone.className} text-[11px] font-semibold overflow-hidden transition-colors duration-300`}
            >
              <div className="flex items-center h-7">
                <span className="flex items-center gap-1 pl-2.5 pr-2 shrink-0 h-7 relative z-10 bg-inherit">
                  <Megaphone className="w-3 h-3" />
                  {items.length > 1 && <span className="text-[9px] opacity-80 font-mono">{index + 1}/{items.length}</span>}
                </span>
                <div ref={trackRef} className="relative flex-1 h-7 overflow-hidden">
                  <div
                    key={`${cycle}-${index}`}
                    ref={textRef}
                    data-testid="announcement-preview-marquee"
                    className="absolute top-0 left-0 h-7 flex items-center gap-1.5 whitespace-nowrap will-change-transform"
                    style={
                      distance
                        ? ({
                            "--marquee-from": `${distance.from}px`,
                            "--marquee-to": `${distance.to}px`,
                            animationName: "csm-marquee",
                            animationDuration: `${durationSec}s`,
                            animationTimingFunction: "linear",
                            animationIterationCount: 1,
                            animationFillMode: "forwards",
                            animationPlayState: paused ? "paused" : "running",
                          } as React.CSSProperties)
                        : { transform: "translateX(100vw)" }
                    }
                    onAnimationEnd={goNext}
                  >
                    <span>{current.message || "Nội dung thông báo"}</span>
                    {current.link_url && (
                      <span className="inline-flex items-center underline underline-offset-2">
                        {current.link_text || "Xem ngay"}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
                <span className="w-7 shrink-0 flex items-center justify-center opacity-80">
                  <X className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MockHeader />
        <div className="p-2.5 space-y-2">
          <div className="grid grid-cols-5 gap-2 items-center">
            <div className="col-span-3 space-y-1">
              <Bar w="w-1/3" h="h-1" c="bg-amber-200" />
              <Bar w="w-4/5" h="h-2" c="bg-slate-300" />
              <Bar w="w-2/3" c="bg-slate-200" />
            </div>
            <div className="col-span-2 h-9 rounded-md bg-gradient-to-r from-emerald-100 to-orange-100" />
          </div>
          {!compact && (
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
        </div>

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70 text-[11px] text-muted font-medium">{emptyText}</div>
        )}
      </MiniBrowser>

      <div className="flex items-center justify-between gap-2 text-[10px] text-muted">
        <span>
          {resting ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700" data-testid="announcement-preview-resting">
              <Clock className="w-3 h-3" />
              Đang nghỉ… (trên web thật thanh nghỉ 1 phút rồi chạy lại)
            </span>
          ) : (
            caption
          )}
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-border hover:text-foreground shrink-0"
            aria-label={paused ? "Chạy tiếp bản xem trước" : "Tạm dừng bản xem trước"}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "Chạy tiếp" : "Tạm dừng"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Bản đồ vị trí banner                                             */
/* ------------------------------------------------------------------ */

export interface PreviewBanner {
  title?: string | null;
  highlight?: string | null;
  badge?: string | null;
  image_url?: string | null;
  cta_text?: string | null;
}

/** Banner thu nhỏ đặt vào đúng ô trên trang mô phỏng */
function MiniBanner({ banner, variant }: { banner?: PreviewBanner | null; variant: "hero" | "strip" | "popup" }) {
  const img = banner?.image_url ? resolveAssetUrl(banner.image_url) : "";
  const title = banner?.title || "Banner của bạn";
  const cta = banner?.cta_text || (variant === "popup" ? "Xem ưu đãi" : "Khám phá");

  if (variant === "popup") {
    return (
      <div className="w-36 rounded-xl overflow-hidden bg-white shadow-2xl border border-slate-200">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-100 to-orange-100">
          {img && <img src={img} alt="" className="w-full h-full object-cover" />}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white/90 flex items-center justify-center">
            <X className="w-2 h-2 text-slate-600" />
          </span>
        </div>
        <div className="p-1.5 text-center space-y-0.5">
          <p className="text-[9px] font-extrabold text-slate-800 leading-tight line-clamp-2">{title}</p>
          {banner?.highlight && <p className="text-[8px] font-bold text-emerald-700 truncate">{banner.highlight}</p>}
          <div className="h-3.5 rounded bg-emerald-600 text-[7px] text-white font-bold flex items-center justify-center">{cta}</div>
        </div>
      </div>
    );
  }

  if (variant === "strip") {
    return (
      <div className="h-10 rounded-lg overflow-hidden bg-gradient-to-r from-emerald-50 via-white to-orange-50 border border-slate-200 flex">
        <div className="w-14 shrink-0 bg-slate-200">{img && <img src={img} alt="" className="w-full h-full object-cover" />}</div>
        <div className="flex-1 min-w-0 px-2 flex items-center gap-2">
          <p className="text-[9px] font-extrabold text-slate-800 truncate flex-1">
            {title}
            {banner?.highlight && <span className="text-emerald-700"> · {banner.highlight}</span>}
          </p>
          <span className="h-4 px-1.5 rounded bg-emerald-600 text-[7px] text-white font-bold flex items-center gap-0.5 shrink-0">
            {cta} <ArrowRight className="w-2 h-2" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-orange-50 border border-slate-200 grid grid-cols-5">
      <div className="col-span-3 p-2 flex flex-col justify-center gap-0.5 min-w-0">
        <span className="text-[7px] font-bold uppercase text-emerald-700 truncate">{banner?.badge || "✨ CSM ƯU ĐÃI"}</span>
        <p className="text-[10px] font-extrabold text-slate-800 leading-tight line-clamp-2">{title}</p>
        {banner?.highlight && <p className="text-[8px] font-bold text-emerald-700 truncate">{banner.highlight}</p>}
        <span className="mt-0.5 self-start h-3.5 px-1.5 rounded bg-emerald-600 text-[7px] text-white font-bold flex items-center">{cta}</span>
      </div>
      <div className="col-span-2 bg-slate-200">{img && <img src={img} alt="" className="w-full h-full object-cover" />}</div>
    </div>
  );
}

const PLACEMENT_URL: Record<BannerPlacement, string> = {
  HOME_HERO: "csm.vn / trang chủ",
  PRODUCTS_TOP: "csm.vn / products",
  CART: "csm.vn / cart",
  POPUP: "csm.vn (khi khách vừa vào web)",
};

const PLACEMENT_HINT: Record<BannerPlacement, string> = {
  HOME_HERO: "Ngay dưới lời chào ở đầu trang chủ. Nhiều banner sẽ tự chuyển mỗi 5 giây.",
  PRODUCTS_TOP: "Dải ngang phía trên danh sách sản phẩm, khách thấy ngay khi mở trang Sản phẩm.",
  CART: "Ngay dưới tiêu đề Giỏ hàng, phía trên danh sách món khách đã chọn.",
  POPUP: "Cửa sổ nổi giữa màn hình, che mờ trang phía sau. Mỗi khách chỉ thấy 1 lần mỗi ngày.",
};

/**
 * Trang web thu nhỏ có tô sáng đúng chỗ banner xuất hiện,
 * giúp người mới biết "Slider trang chủ", "Trang giỏ hàng"... nằm ở đâu.
 */
export function BannerPlacementMap({ placement, banner }: { placement: BannerPlacement; banner?: PreviewBanner | null }) {
  return (
    <div className="space-y-1.5">
      <MiniBrowser url={PLACEMENT_URL[placement]} testId={`placement-map-${placement}`}>
        <MockHeader cartBadge={placement === "CART"} />
        <div className="p-2.5 space-y-2 min-h-[230px]">
          {placement === "HOME_HERO" && (
            <>
              <div className="space-y-1">
                <Bar w="w-1/4" h="h-1" c="bg-amber-200" />
                <Bar w="w-1/2" h="h-2" c="bg-slate-300" />
              </div>
              <Spotlight>
                <MiniBanner banner={banner} variant="hero" />
              </Spotlight>
              <div className="flex justify-center gap-1">
                <span className="w-3 h-1 rounded-full bg-emerald-500" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="w-1 h-1 rounded-full bg-slate-300" />
              </div>
              <div className="grid grid-cols-4 gap-1 opacity-70">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {placement === "PRODUCTS_TOP" && (
            <>
              <Bar w="w-1/3" h="h-2" c="bg-slate-400" />
              <Spotlight>
                <MiniBanner banner={banner} variant="strip" />
              </Spotlight>
              <div className="grid grid-cols-4 gap-1.5 opacity-70">
                <div className="space-y-1 rounded-md bg-white border border-slate-200 p-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Bar key={i} w={i % 2 ? "w-2/3" : "w-full"} h="h-1" />
                  ))}
                </div>
                <div className="col-span-3 grid grid-cols-3 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            </>
          )}

          {placement === "CART" && (
            <>
              <Bar w="w-1/4" h="h-2" c="bg-slate-400" />
              <Spotlight>
                <MiniBanner banner={banner} variant="strip" />
              </Spotlight>
              <div className="grid grid-cols-3 gap-1.5 opacity-70">
                <div className="col-span-2 space-y-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 p-1">
                      <div className="w-6 h-6 rounded bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <Bar w="w-2/3" h="h-1" />
                        <Bar w="w-1/3" h="h-1" c="bg-emerald-300" />
                      </div>
                      <div className="w-6 h-2.5 rounded border border-slate-300" />
                    </div>
                  ))}
                </div>
                <div className="rounded-md bg-white border border-slate-200 p-1.5 space-y-1">
                  <Bar w="w-1/2" h="h-1" />
                  <Bar h="h-1" c="bg-slate-200" />
                  <Bar h="h-1" c="bg-slate-200" />
                  <div className="h-3 rounded bg-emerald-500 mt-1" />
                </div>
              </div>
            </>
          )}

          {placement === "POPUP" && (
            <>
              <div className="space-y-2 opacity-60">
                <div className="h-14 rounded-lg bg-gradient-to-r from-emerald-100 to-orange-100" />
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 top-[29px] bg-slate-900/45 flex items-center justify-center">
                <Spotlight label="Popup hiện ở đây">
                  <MiniBanner banner={banner} variant="popup" />
                </Spotlight>
              </div>
            </>
          )}
        </div>
      </MiniBrowser>
      <p className="text-[10px] text-muted leading-relaxed">
        <span className="font-semibold text-foreground">{BANNER_PLACEMENT_META[placement].label}:</span> {PLACEMENT_HINT[placement]}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Khối sản phẩm nổi bật                                            */
/* ------------------------------------------------------------------ */

const formatVnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "₫";

const SECTION_STYLE: Record<HomeSectionType, { wrap: string; icon: React.ReactNode; defaultTitle: string; defaultSub: string }> = {
  FLASH_SALE: {
    wrap: "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200",
    icon: <Zap className="w-3 h-3 text-rose-500 fill-rose-500" />,
    defaultTitle: "Giờ Vàng Giá Sốc",
    defaultSub: "Giảm sâu trong khung giờ vàng hôm nay",
  },
  CSM_PICKS: {
    wrap: "bg-gradient-to-br from-emerald-50 to-white border-emerald-200",
    icon: <Sparkles className="w-3 h-3 text-emerald-600" />,
    defaultTitle: "CSM Picks",
    defaultSub: "Những món cửa hàng tâm đắc nhất tuần này",
  },
  NEW_ARRIVALS: {
    wrap: "bg-gradient-to-br from-teal-50 to-white border-teal-200",
    icon: <Sparkles className="w-3 h-3 text-teal-600" />,
    defaultTitle: "Mới Lên Kệ",
    defaultSub: "Sản phẩm vừa về cửa hàng",
  },
};

interface SectionLivePreviewProps {
  type: HomeSectionType;
  title: string;
  subtitle: string;
  items: { product: Product; note?: string }[];
  enabled: boolean;
}

/** Mô phỏng khối sản phẩm trên trang chủ bằng chính các sản phẩm đang chọn, cập nhật ngay khi sửa */
export function SectionLivePreview({ type, title, subtitle, items, enabled }: SectionLivePreviewProps) {
  const meta = HOME_SECTION_META[type];
  const style = SECTION_STYLE[type];
  const shown = items.slice(0, meta.max);
  const cols = "grid-cols-4";

  return (
    <div className="space-y-1.5">
      <MiniBrowser url="csm.vn / trang chủ" testId={`section-preview-${type}`}>
        <div className="p-2.5 space-y-2">
          <div className="h-3 rounded bg-slate-200/70 opacity-70" />
          <div className={`relative rounded-xl border p-2.5 space-y-2 ${style.wrap} ${enabled ? "" : "opacity-40 grayscale"}`}>
            {!enabled && (
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-white">Đang tắt</span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1 truncate">
                  {style.icon}
                  {title || style.defaultTitle}
                </p>
                <p className="text-[9px] text-slate-500 truncate">{subtitle || style.defaultSub}</p>
              </div>
              {type === "FLASH_SALE" ? (
                <div className="flex gap-0.5 shrink-0">
                  {["02", "15", "48"].map((t) => (
                    <span key={t} className="w-4 h-4 rounded bg-slate-800 text-white text-[8px] font-mono font-bold flex items-center justify-center">{t}</span>
                  ))}
                </div>
              ) : (
                <span className="text-[8px] font-semibold text-emerald-700 shrink-0">Xem tất cả ›</span>
              )}
            </div>

            {shown.length === 0 ? (
              <div className="space-y-1">
                <div className={`grid ${cols} gap-1 opacity-60`}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <p className="text-[9px] text-center text-slate-500">Chưa chọn món: trang chủ tự chọn sản phẩm theo mặc định</p>
              </div>
            ) : (
              <div className={`grid ${cols} gap-1.5`}>
                {shown.map(({ product, note }) => {
                  const price = product.discountPrice || product.price;
                  const hasDiscount = !!product.discountPrice && product.discountPrice < product.price;
                  return (
                    <div key={product.id} className="rounded-lg bg-white border border-slate-200 p-1 space-y-0.5 min-w-0" data-testid="section-preview-item">
                      <div className="relative aspect-square rounded-md overflow-hidden bg-slate-100">
                        <ProductImage src={resolveAssetUrl(product.images?.[0])} alt={product.name} productName={product.name} width={80} height={80} />
                        {type === "FLASH_SALE" && hasDiscount && (
                          <span className="absolute top-0.5 left-0.5 px-1 rounded bg-rose-500 text-white text-[7px] font-bold">
                            -{Math.round((1 - product.discountPrice! / product.price) * 100)}%
                          </span>
                        )}
                        {type === "NEW_ARRIVALS" && (
                          <span className="absolute top-0.5 left-0.5 px-1 rounded bg-teal-500 text-white text-[7px] font-bold">MỚI</span>
                        )}
                      </div>
                      <p className="text-[8px] font-semibold text-slate-800 leading-tight line-clamp-2 min-h-[18px]">{product.name}</p>
                      <p className="text-[8px] font-bold text-emerald-700">
                        {formatVnd(price)}
                        {hasDiscount && <span className="ml-1 font-normal text-slate-400 line-through">{formatVnd(product.price)}</span>}
                      </p>
                      {type === "CSM_PICKS" && note && (
                        <p className="text-[8px] italic text-emerald-800 bg-emerald-50 rounded px-1 py-0.5 line-clamp-2">“{note}”</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="h-3 rounded bg-slate-200/70 opacity-70" />
        </div>
      </MiniBrowser>
      <p className="text-[10px] text-muted">
        Hiển thị {Math.min(items.length, meta.max)}/{meta.max} món. Muốn đổi vị trí khối này trên trang chủ, vào tab "Bố cục trang chủ".
        {items.length > meta.max && ` ${items.length - meta.max} món còn lại hiện khi khách bấm "Xem tất cả".`}
      </p>
    </div>
  );
}
