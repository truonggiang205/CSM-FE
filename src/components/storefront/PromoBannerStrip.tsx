import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";
import { resolveAssetUrl } from "../../lib/assetUrl";
import { BannerLink } from "./BannerLink";

interface PromoBannerStripProps {
  placement: "PRODUCTS_TOP" | "CART";
  className?: string;
}

/** Dải banner ngang cho trang Sản phẩm / Giỏ hàng. Không có banner thì không hiển thị gì. */
export function PromoBannerStrip({ placement, className = "" }: PromoBannerStripProps) {
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

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary-tint/70 via-surface to-pastel-peach/50 shadow-card ${className}`}
      data-testid={`promo-strip-${placement}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        <div className="sm:w-56 h-32 sm:h-auto shrink-0 bg-surface-soft">
          <img src={resolveAssetUrl(banner.image_url)} alt={banner.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="space-y-1 min-w-0">
            {banner.badge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent-dark">
                <Sparkles className="w-3 h-3" />
                {banner.badge}
              </span>
            )}
            <p className="text-base sm:text-lg font-extrabold text-foreground leading-tight">
              {banner.title}
              {banner.highlight && <span className="text-primary-dark"> · {banner.highlight}</span>}
            </p>
            {banner.description && <p className="text-xs text-muted line-clamp-2">{banner.description}</p>}
          </div>
          <BannerLink
            to={banner.link_url}
            bannerId={banner.id}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-2xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark shrink-0 self-start sm:self-auto"
          >
            {banner.cta_text || "Xem ngay"}
            <ArrowRight className="w-4 h-4" />
          </BannerLink>
        </div>
      </div>
      {banners.length > 1 && (
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
