import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Megaphone, X } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";
import { ANNOUNCEMENT_TONE_META } from "../../api/storefrontApi";
import { BannerLink } from "./BannerLink";

const DISMISS_KEY = "csm_announcement_dismissed";

/** Thanh thông báo trên cùng; nhiều thông báo thì tự chuyển mỗi 5 giây. Khách có thể ẩn trong phiên hiện tại. */
export function AnnouncementBar() {
  const { data } = useStorefront();
  const shouldReduceMotion = useReducedMotion();
  const items = data?.announcements || [];
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const signature = items.map((a) => a.id).join(",");

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0 || dismissed === signature) return null;
  const current = items[index] || items[0];
  const tone = ANNOUNCEMENT_TONE_META[current.tone] || ANNOUNCEMENT_TONE_META.primary;

  const handleDismiss = () => {
    setDismissed(signature);
    try {
      sessionStorage.setItem(DISMISS_KEY, signature);
    } catch {
      /* bỏ qua khi trình duyệt chặn storage */
    }
  };

  return (
    <div className={`${tone.className} text-xs sm:text-[13px] font-semibold relative`} role="region" aria-label="Thông báo cửa hàng" data-testid="announcement-bar">
      <div className="container mx-auto px-10 sm:px-12 py-2 flex items-center justify-center gap-2 min-h-[36px]">
        <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 min-w-0 text-center"
          >
            <span className="truncate">{current.message}</span>
            {current.link_url && (
              <BannerLink to={current.link_url} className="inline-flex items-center gap-0.5 underline underline-offset-2 shrink-0 hover:opacity-90">
                {current.link_text || "Xem ngay"}
                <ChevronRight className="w-3.5 h-3.5" />
              </BannerLink>
            )}
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <span className="hidden sm:inline text-[10px] opacity-75 font-mono shrink-0">
            {index + 1}/{items.length}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
        aria-label="Ẩn thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
