import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";
import { resolveAssetUrl } from "../../lib/assetUrl";
import { BannerLink } from "./BannerLink";

const SEEN_KEY = "csm_promo_popup_seen";

function todayKey(bannerId: string) {
  const d = new Date();
  return `${bannerId}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Popup khuyến mãi: hiện tối đa 1 lần/ngày cho mỗi banner, không hiện ở trang thanh toán/đăng nhập. */
export function PromoPopup() {
  const { data } = useStorefront();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const banner = data?.placements?.POPUP?.[0];
  const [open, setOpen] = useState(false);

  const blocked = /^\/(checkout|login|register)/.test(location.pathname);

  useEffect(() => {
    if (!banner || blocked) return;
    let seen: string | null;
    try {
      seen = localStorage.getItem(SEEN_KEY);
    } catch {
      seen = null;
    }
    if (seen === todayKey(banner.id)) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [banner, blocked]);

  const close = () => {
    setOpen(false);
    if (banner) {
      try {
        localStorage.setItem(SEEN_KEY, todayKey(banner.id));
      } catch {
        /* bỏ qua */
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && banner && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          data-testid="promo-popup"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={banner.title}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border"
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 border border-border flex items-center justify-center text-foreground hover:bg-surface-soft"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="aspect-[4/3] bg-surface-soft">
              <img src={resolveAssetUrl(banner.image_url)} alt={banner.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-3 text-center">
              {banner.badge && <p className="text-[11px] font-bold uppercase tracking-wider text-accent-dark">{banner.badge}</p>}
              <h2 className="text-xl font-extrabold text-foreground leading-tight">
                {banner.title}
                {banner.highlight && <span className="block text-primary-dark text-lg mt-0.5">{banner.highlight}</span>}
              </h2>
              {banner.description && <p className="text-xs text-muted leading-relaxed">{banner.description}</p>}
              <BannerLink
                to={banner.link_url}
                bannerId={banner.id}
                onNavigate={close}
                className="inline-flex items-center justify-center gap-1.5 h-11 px-6 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark w-full"
              >
                {banner.cta_text || "Xem ưu đãi"}
                <ArrowRight className="w-4 h-4" />
              </BannerLink>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
