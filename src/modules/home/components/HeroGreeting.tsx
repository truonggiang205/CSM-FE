import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Clock, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useBranchStore } from "../../../store/useBranchStore";
import {
  MOTION_DURATION,
  MOTION_EASE,
  fadeUpVariants,
  staggerContainerVariants,
  getReducedMotionVariants,
} from "../../../lib/motion";

interface FloatingItem {
  emoji: string;
  label: string;
  price: string;
  tag: string;
  layer: 1 | 2 | 3;
}

interface TimeSlotContent {
  greeting: string;
  badge: string;
  subTitle: string;
  ctaText: string;
  ctaLink: string;
  gradient: string;
  accentColor: string;
  items: FloatingItem[];
}

// TODO: Sau này có thể tích hợp API Banner / Campaign theo thời gian thực từ Backend
export function getTimeSlotContent(hour: number): TimeSlotContent {
  if (hour >= 6 && hour < 10) {
    return {
      greeting: "Chào Buổi Sáng Sảng Khoái",
      badge: "☀️ Năng Lượng Đầu Ngày",
      subTitle: "Bắt đầu ngày mới cùng Cà phê pha phin thơm lừng & Bánh mì kẹp nóng giòn chuẩn vị.",
      ctaText: "Khám phá bữa sáng",
      ctaLink: "/products?q=cà phê",
      gradient: "from-amber-500/10 via-surface to-pastel-peach/30",
      accentColor: "text-amber-700 bg-amber-100/70 border-amber-300/40",
      items: [
        { emoji: "☕", label: "Cà phê sữa đá", price: "25.000₫", tag: "Đậm vị", layer: 3 },
        { emoji: "🥖", label: "Bánh mì nóng", price: "20.000₫", tag: "Giòn rụm", layer: 2 },
        { emoji: "🥪", label: "Sandwich tươi", price: "22.000₫", tag: "Tiện lợi", layer: 1 },
        { emoji: "🥐", label: "Bánh sừng bò", price: "18.000₫", tag: "Thơm bơ", layer: 2 },
      ],
    };
  }

  if (hour >= 10 && hour < 14) {
    return {
      greeting: "Bữa Trưa Nóng Hổi, Nhanh Gọn",
      badge: "🍱 Tiếp Sức Bữa Trưa",
      subTitle: "Cơm nóng, mì trộn cay giòn & thức uống mát lạnh sẵn sàng nạp năng lượng tiếp sức ngày dài.",
      ctaText: "Khám phá combo trưa",
      ctaLink: "/products?q=mì",
      gradient: "from-orange-500/10 via-surface to-pastel-butter/40",
      accentColor: "text-orange-700 bg-orange-100/70 border-orange-300/40",
      items: [
        { emoji: "🍜", label: "Mì trộn cay giòn", price: "30.000₫", tag: "Bán chạy", layer: 3 },
        { emoji: "🥟", label: "Bánh bao xá xíu", price: "22.000₫", tag: "Nóng sốt", layer: 2 },
        { emoji: "🍱", label: "Cơm nắm Onigiri", price: "16.000₫", tag: "Gọn gàng", layer: 1 },
        { emoji: "🥤", label: "Trà chanh lạnh", price: "15.000₫", tag: "Thanh mát", layer: 2 },
      ],
    };
  }

  if (hour >= 14 && hour < 18) {
    return {
      greeting: "Giờ Xế Chiều Ngọt Ngào",
      badge: "🧋 Nạp Năng Lượng Xế",
      subTitle: "Đổi gió giờ giải lao cùng Trà sữa trân châu hoàng kim & Snack khoai tây giòn rụm.",
      ctaText: "Chọn món xế chiều",
      ctaLink: "/products?q=trà sữa",
      gradient: "from-emerald-500/10 via-surface to-pastel-sky/30",
      accentColor: "text-primary-dark bg-primary-tint/70 border-primary/30",
      items: [
        { emoji: "🧋", label: "Trà sữa trân châu", price: "35.000₫", tag: "Mát lạnh", layer: 3 },
        { emoji: "🥔", label: "Snack tảo biển", price: "18.000₫", tag: "Giòn tan", layer: 2 },
        { emoji: "🍪", label: "Bánh quy bơ", price: "15.000₫", tag: "Ngọt dịu", layer: 1 },
        { emoji: "🧃", label: "Nước ép đào", price: "20.000₫", tag: "Tươi ngon", layer: 2 },
      ],
    };
  }

  // Khung tối & đêm muộn (18h - 6h sáng)
  return {
    greeting: "Đêm Muộn Vẫn Luôn Phục Vụ",
    badge: "🌙 Mở Cửa 24/7",
    subTitle: "Cú đêm không lo đói! Mì ly nóng hổi, snack ăn vặt & nước giải khát ướp lạnh phục vụ xuyên đêm.",
    ctaText: "Ăn khuya tiện lợi",
    ctaLink: "/products?q=snack",
    gradient: "from-indigo-500/10 via-surface to-pastel-lavender/40",
    accentColor: "text-indigo-700 bg-indigo-100/70 border-indigo-300/40",
    items: [
      { emoji: "🍜", label: "Mì ly cay nồng", price: "18.000₫", tag: "Nóng hổi", layer: 3 },
      { emoji: "🌭", label: "Xúc xích tiệt trùng", price: "12.000₫", tag: "Tiện lợi", layer: 2 },
      { emoji: "🥤", label: "Nước ngọt ướp lạnh", price: "15.000₫", tag: "Sảng khoái", layer: 1 },
      { emoji: "🍟", label: "Khoai tây chiên", price: "20.000₫", tag: "Ăn vặt", layer: 2 },
    ],
  };
}

// 4 Góc chuẩn quanh tâm không bao giờ chồng chéo nhau
const CORNER_POSITIONS = [
  "top-1 sm:top-2 left-0 sm:left-1",        // 0: Trên - Trái
  "top-1 sm:top-2 right-0 sm:right-1",      // 1: Trên - Phải
  "bottom-1 sm:bottom-2 left-0 sm:left-1",    // 2: Dưới - Trái
  "bottom-1 sm:bottom-2 right-0 sm:right-1",  // 3: Dưới - Phải
];

export function HeroGreeting() {
  const shouldReduceMotion = useReducedMotion();
  const { selectedBranch } = useBranchStore();

  // 1. Cập nhật giờ mỗi phút
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const content = useMemo(() => getTimeSlotContent(currentHour), [currentHour]);

  // 2. Kiểm tra thiết bị cảm ứng để tắt Parallax (hover: none)
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(hover: none)");
      setIsTouchDevice(media.matches);
      const listener = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  // 3. Chuột Parallax với useMotionValue và useTransform
  const mouseNormX = useMotionValue(0);
  const mouseNormY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 220 };
  const smoothX = useSpring(mouseNormX, springConfig);
  const smoothY = useSpring(mouseNormY, springConfig);

  // 3 tầng độ lệch nhẹ: Layer 1 (2px), Layer 2 (5px), Layer 3 (8px)
  const moveX1 = useTransform(smoothX, [-1, 1], [-2, 2]);
  const moveY1 = useTransform(smoothY, [-1, 1], [-2, 2]);

  const moveX2 = useTransform(smoothX, [-1, 1], [-5, 5]);
  const moveY2 = useTransform(smoothY, [-1, 1], [-5, 5]);

  const moveX3 = useTransform(smoothX, [-1, 1], [-8, 8]);
  const moveY3 = useTransform(smoothY, [-1, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || isTouchDevice) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    mouseNormX.set(Math.max(-1, Math.min(1, x)));
    mouseNormY.set(Math.max(-1, Math.min(1, y)));
  };

  const handleMouseLeave = () => {
    mouseNormX.set(0);
    mouseNormY.set(0);
  };

  const containerVariants = getReducedMotionVariants(staggerContainerVariants, shouldReduceMotion);
  const itemVariants = getReducedMotionVariants(fadeUpVariants, shouldReduceMotion);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-3xl bg-gradient-to-br ${content.gradient} border border-border/70 overflow-hidden shadow-card transition-colors duration-500`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(78,159,118,0.15),transparent_60%)]" />

      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6 lg:py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Cột trái: Thông điệp chào hỏi & Nút bấm (Left Col) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 text-left"
          >
            {/* Time Slot Badge & Branch Info */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${content.accentColor}`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </span>

              {selectedBranch && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-surface/90 text-muted border border-border shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{selectedBranch.name}</span>
                </span>
              )}
            </motion.div>

            {/* Tiêu đề & Câu phụ */}
            <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-black text-foreground tracking-tight leading-tight">
                {content.greeting}
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-lg">
                {content.subTitle}
              </p>
            </motion.div>

            {/* Các nút Call-To-Action */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="rounded-2xl h-10 sm:h-11 px-5 sm:px-6 font-bold text-xs sm:text-sm shadow-sm gap-2"
              >
                <Link to={content.ctaLink}>
                  <span>{content.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl h-10 sm:h-11 px-4 sm:px-5 font-semibold text-xs sm:text-sm bg-surface/80 hover:bg-surface border-border text-foreground"
              >
                <Link to="/products">Xem tất cả món</Link>
              </Button>
            </motion.div>

            {/* Điểm nhấn dịch vụ nhanh */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 sm:gap-4 pt-1.5 text-[11px] sm:text-xs text-muted font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Giao nhanh 30 phút</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-border" />
              <div>Sẵn sàng 24/7</div>
              <span className="w-1 h-1 rounded-full bg-border" />
              <div>Chuẩn tươi ngon</div>
            </motion.div>
          </motion.div>

          {/* Cột phải: Sân khấu sản phẩm độc lập (Stage 4 góc + Tâm) */}
          <div className="flex justify-center items-center w-full">
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] h-[260px] sm:h-[280px] lg:h-[290px] mx-auto overflow-visible select-none">
              {/* Vòng tròn trung tâm z-0 bọc trong div tĩnh chống xung đột Framer Motion transform */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                <motion.div
                  initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: MOTION_DURATION.emphasis, ease: MOTION_EASE }}
                  className="w-28 h-28 sm:w-32 sm:h-32 lg:w-[140px] lg:h-[140px] rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-card flex items-center justify-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-primary-tint/70 to-surface-soft border border-primary/20 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl sm:text-3xl animate-bounce">🛒</span>
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-primary-dark mt-0.5">CSM Store</span>
                    <span className="text-[8px] sm:text-[9px] text-muted font-medium">24/7 Tiện Lợi</span>
                  </div>
                </motion.div>
              </div>

              {/* Tối đa 4 Thẻ sản phẩm nổi tại 4 góc riêng biệt (z-10, không chạm nhau) */}
              {content.items.slice(0, 4).map((item, idx) => {
                const layerTransformX =
                  item.layer === 3 ? moveX3 : item.layer === 2 ? moveX2 : moveX1;
                const layerTransformY =
                  item.layer === 3 ? moveY3 : item.layer === 2 ? moveY2 : moveY1;

                return (
                  <div
                    key={`${item.label}-${idx}`}
                    className={`absolute z-10 ${CORNER_POSITIONS[idx]}`}
                  >
                    <motion.div
                      style={
                        shouldReduceMotion || isTouchDevice
                          ? undefined
                          : { x: layerTransformX, y: layerTransformY }
                      }
                      animate={
                        shouldReduceMotion || isTouchDevice
                          ? {}
                          : {
                              y: idx % 2 === 0 ? [-2, 2, -2] : [2, -2, 2],
                            }
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 3.2 + idx * 0.4,
                        ease: "easeInOut",
                      }}
                      className="w-[155px] sm:w-[190px] lg:w-[205px] p-2 sm:p-2.5 rounded-2xl bg-surface/95 backdrop-blur-md border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
                    >
                      {/* Emoji Icon */}
                      <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-primary-tint/70 border border-primary/25 flex items-center justify-center text-lg sm:text-xl group-hover:scale-110 transition-transform">
                        {item.emoji}
                      </div>

                      {/* Thông tin sản phẩm */}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between gap-1 w-full">
                          <h4
                            className="text-[11px] sm:text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate"
                            title={item.label}
                          >
                            {item.label}
                          </h4>
                          <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-accent-tint text-accent-dark shrink-0">
                            {item.tag}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-black text-primary-dark block mt-0.5">
                          {item.price}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
