import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";
import { resolveAssetUrl } from "../../lib/assetUrl";
import { BannerLink } from "./BannerLink";

interface PromoBannerStripProps {
  placement: "PRODUCTS_TOP" | "CART";
  className?: string;
  /** Bản thu gọn cho ngăn giỏ hàng nhanh (chiều cao nhỏ, chữ nhỏ) */
  compact?: boolean;
}

/** Dải banner ngang cho trang Sản phẩm / Giỏ hàng, có nút qua lại khi có nhiều banner. Không có banner thì không hiển thị gì. */
export function PromoBannerStrip({ placement, className = "", compact = false }: PromoBannerStripProps) {
  const { data } = useStorefront();
  const banners = data?.placements?.[placement] || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const banner = banners[index] || banners[0];
  const total = banners.length;
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary-tint/70 via-surface to-pastel-peach/50 shadow-card ${className}`}
      data-testid={`promo-strip-${placement}`}
    >
      {/* Khung cố định chiều cao: ảnh lớn cỡ nào cũng bị cắt vừa khung, không đẩy danh sách sản phẩm xuống */}
      <div className={`flex items-stretch ${compact ? "flex-row h-24" : "flex-col sm:flex-row sm:h-36"}`}>
        <div className={`relative shrink-0 bg-surface-soft overflow-hidden ${compact ? "w-24 h-full" : "h-32 sm:h-full sm:w-56"}`}>
          <img
            src={resolveAssetUrl(banner.image_url)}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div
          className={`flex-1 min-w-0 flex gap-3 justify-between ${
            compact ? "p-3 pr-11 flex-col justify-center" : "p-4 sm:p-5 sm:pr-14 flex-col sm:flex-row sm:items-center"
          }`}
        >
          <div className="space-y-1 min-w-0">
            {banner.badge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent-dark">
                <Sparkles className="w-3 h-3" />
                {banner.badge}
              </span>
            )}
            <p className={`font-extrabold text-foreground leading-tight line-clamp-2 ${compact ? "text-xs" : "text-base sm:text-lg"}`}>
              {banner.title}
              {banner.highlight && <span className="text-primary-dark"> · {banner.highlight}</span>}
            </p>
            {banner.description && !compact && <p className="text-xs text-muted line-clamp-2">{banner.description}</p>}
          </div>
          <BannerLink
            to={banner.link_url}
            bannerId={banner.id}
            className={`inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark shrink-0 self-start ${
              compact ? "h-7 px-3 text-[11px]" : "h-10 px-5 text-xs sm:self-auto"
            }`}
          >
            {banner.cta_text || "Xem ngay"}
            <ArrowRight className="w-4 h-4" />
          </BannerLink>
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-border shadow-xs flex items-center justify-center text-foreground hover:bg-surface"
            aria-label="Banner trước"
            data-testid={`promo-strip-${placement}-prev`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-border shadow-xs flex items-center justify-center text-foreground hover:bg-surface"
            aria-label="Banner tiếp theo"
            data-testid={`promo-strip-${placement}-next`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
      {total > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
