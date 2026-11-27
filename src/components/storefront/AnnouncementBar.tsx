import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ChevronRight, Megaphone, X } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";
import { ANNOUNCEMENT_TONE_META } from "../../api/storefrontApi";
import { BannerLink } from "./BannerLink";

const DISMISS_KEY = "csm_announcement_dismissed";
/** Tốc độ chữ chạy (px/giây) */
export const MARQUEE_SPEED = 70;
/** Thời gian nghỉ sau khi chạy hết một vòng các thông báo */
export const MARQUEE_PAUSE_MS = 60_000;
/** Khi người dùng bật "giảm chuyển động": mỗi thông báo đứng yên trong khoảng này */
const STATIC_DURATION_MS = 6_000;

/**
 * Thanh thông báo chạy chữ trên cùng.
 * Các thông báo chạy lần lượt từ phải sang trái; chạy hết một vòng thì thanh thu gọn, nghỉ 1 phút rồi chạy lại.
 * Nếu khách chuyển sang trang khác trong lúc thanh đang nghỉ thì chạy lại ngay, không chờ hết 1 phút.
 * Rê chuột vào thanh để dừng chữ (dễ bấm link). Khách có thể ẩn thanh trong phiên hiện tại.
 */
export function AnnouncementBar() {
  const { data } = useStorefront();
  const shouldReduceMotion = useReducedMotion();
  const items = data?.announcements || [];
  const signature = items.map((a) => a.id).join(",");

  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [resting, setResting] = useState(false);
  const [distance, setDistance] = useState<{ from: number; to: number } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);

  const trackRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Danh sách thông báo đổi (đổi chi nhánh, admin cập nhật) => chạy lại từ đầu
  useEffect(() => {
    setIndex(0);
    setResting(false);
    setCycle((c) => c + 1);
  }, [signature]);

  // Hết một vòng => nghỉ rồi chạy lại từ thông báo đầu tiên
  useEffect(() => {
    if (!resting) return;
    const t = setTimeout(() => {
      setIndex(0);
      setCycle((c) => c + 1);
      setResting(false);
    }, MARQUEE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [resting]);

  // Chuyển trang (VD: từ Giỏ hàng quay về Trang chủ) khi thanh đang nghỉ => chạy lại ngay từ đầu.
  // Đang chạy dở thì giữ nguyên để chữ không bị giật lại từ đầu mỗi lần bấm link.
  // (Điều chỉnh state ngay trong lúc render theo khuyến nghị của React, không cần effect.)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (resting) {
      setIndex(0);
      setCycle((c) => c + 1);
      setResting(false);
    }
  }

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setResting(true);
    }
  };

  // Đo chiều rộng để chữ chạy từ mép phải tới khi khuất hẳn bên trái
  useLayoutEffect(() => {
    if (resting || shouldReduceMotion) return;
    const track = trackRef.current;
    const text = textRef.current;
    if (!track || !text) return;
    setDistance({ from: track.clientWidth, to: -text.scrollWidth });
  }, [index, cycle, resting, shouldReduceMotion, signature]);

  // Chế độ giảm chuyển động: hiển thị tĩnh từng thông báo
  useEffect(() => {
    if (!shouldReduceMotion || resting || items.length === 0) return;
    const t = setTimeout(goNext, STATIC_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion, resting, index, cycle, items.length]);

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

  const durationSec = distance ? (distance.from - distance.to) / MARQUEE_SPEED : 0;

  return (
    <AnimatePresence initial={false}>
      {!resting && (
        <motion.div
          key="announcement-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`${tone.className} text-xs sm:text-[13px] font-semibold relative overflow-hidden transition-colors duration-300`}
          role="region"
          aria-label="Thông báo cửa hàng"
          data-testid="announcement-bar"
          data-index={index}
        >
          <div className="flex items-center min-h-[36px]" aria-live="off">
            <span aria-hidden="true" className="flex items-center gap-1.5 pl-3 sm:pl-4 pr-3 shrink-0 h-9 relative z-10 bg-inherit">
              <Megaphone className="w-3.5 h-3.5" />
              {items.length > 1 && (
                <span className="text-[10px] opacity-80 font-mono" data-testid="announcement-counter">
                  {index + 1}/{items.length}
                </span>
              )}
            </span>

            <div ref={trackRef} className="relative flex-1 h-9 overflow-hidden group">
              {shouldReduceMotion ? (
                <div className="absolute inset-0 flex items-center gap-2 pr-10">
                  <span className="truncate">{current.message}</span>
                  {current.link_url && (
                    <BannerLink to={current.link_url} className="inline-flex items-center gap-0.5 underline underline-offset-2 shrink-0">
                      {current.link_text || "Xem ngay"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </BannerLink>
                  )}
                </div>
              ) : (
                <div
                  key={`${cycle}-${index}`}
                  ref={textRef}
                  data-testid="announcement-marquee"
                  className="absolute top-0 left-0 h-9 flex items-center gap-2 whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
                  style={
                    distance
                      ? ({
                          "--marquee-from": `${distance.from}px`,
                          "--marquee-to": `${distance.to}px`,
                          // Dùng các thuộc tính riêng lẻ (không dùng shorthand "animation")
                          // để class group-hover điều khiển được animation-play-state khi rê chuột
                          animationName: "csm-marquee",
                          animationDuration: `${durationSec}s`,
                          animationTimingFunction: "linear",
                          animationIterationCount: 1,
                          animationFillMode: "forwards",
                        } as React.CSSProperties)
                      : { transform: "translateX(100vw)" }
                  }
                  onAnimationEnd={goNext}
                >
                  <span>{current.message}</span>
                  {current.link_url && (
                    <BannerLink to={current.link_url} className="inline-flex items-center gap-0.5 underline underline-offset-2">
                      {current.link_text || "Xem ngay"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </BannerLink>
                  )}
                </div>
              )}
            </div>

            <span className="w-10 shrink-0" />
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
            aria-label="Ẩn thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
