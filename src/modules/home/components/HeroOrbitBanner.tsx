import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Flame, Pause, Play } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface FeaturedCombo {
  id: string;
  name: string;
  emoji: string;
  price: string;
  originalPrice: string;
  tag: string;
  desc: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentBg: string;
}

const FEATURED_COMBOS: FeaturedCombo[] = [
  {
    id: "combo-1",
    name: "Combo Ăn Sáng Tiện Lợi",
    emoji: "🥪",
    price: "25.000₫",
    originalPrice: "35.000₫",
    tag: "Bán chạy #1",
    desc: "Bánh mì kẹp tươi + Cà phê sữa đá sảng khoái",
    bgColor: "bg-pastel-mint",
    textColor: "text-primary-dark",
    borderColor: "border-primary/30",
    accentBg: "bg-primary-tint",
  },
  {
    id: "combo-2",
    name: "Trà Đào Cam Sả Mát Lạnh",
    emoji: "🧃",
    price: "19.000₫",
    originalPrice: "28.000₫",
    tag: "Mua 1 Tặng 1",
    desc: "Vị trà thanh mát giải nhiệt tức thì trong ngày",
    bgColor: "bg-pastel-peach",
    textColor: "text-accent-dark",
    borderColor: "border-accent/30",
    accentBg: "bg-accent-tint",
  },
  {
    id: "combo-3",
    name: "Bento Cơm Gà Teriyaki",
    emoji: "🍱",
    price: "35.000₫",
    originalPrice: "45.000₫",
    tag: "Nóng sốt 24/7",
    desc: "Cơm dẻo chuẩn vị Nhật, hâm nóng dùng ngay",
    bgColor: "bg-pastel-butter",
    textColor: "text-amber-800",
    borderColor: "border-amber-300",
    accentBg: "bg-amber-50",
  },
  {
    id: "combo-4",
    name: "Cơm Nắm Onigiri Rong Biển",
    emoji: "🍙",
    price: "15.000₫",
    originalPrice: "19.000₫",
    tag: "Tiện lợi mang đi",
    desc: "Nhân cá hồi sốt mayonnaise béo ngậy thơm ngon",
    bgColor: "bg-pastel-sky",
    textColor: "text-sky-800",
    borderColor: "border-sky-300",
    accentBg: "bg-sky-50",
  },
  {
    id: "combo-5",
    name: "Kem Sữa Tươi Hokkaido",
    emoji: "🍦",
    price: "12.000₫",
    originalPrice: "16.000₫",
    tag: "Tráng miệng mát",
    desc: "100% sữa tươi nguyên chất mềm mịn tan chảy",
    bgColor: "bg-pastel-lavender",
    textColor: "text-purple-800",
    borderColor: "border-purple-300",
    accentBg: "bg-purple-50",
  },
  {
    id: "combo-6",
    name: "Mì Trộn Cay Xúc Xích",
    emoji: "🍜",
    price: "22.000₫",
    originalPrice: "30.000₫",
    tag: "Đêm khuya ấm bụng",
    desc: "Sốt cay đậm đà, phô mai dẻo thơm hấp dẫn",
    bgColor: "bg-pastel-rose",
    textColor: "text-rose-800",
    borderColor: "border-rose-300",
    accentBg: "bg-rose-50",
  },
];

export function HeroOrbitBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const totalItems = FEATURED_COMBOS.length;
  // Bán kính quỹ đạo lớn hơn cho banner to thoáng
  const radius = 175;

  // Tự động xoay sau 5 giây; dừng lại khi rê chuột
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }, 5000); // Chu kỳ đúng 5 giây

    return () => clearInterval(timer);
  }, [isHovered, totalItems]);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const activeCombo = FEATURED_COMBOS[activeIndex];

  return (
    <div
      className="relative mx-auto w-full max-w-[580px] aspect-square rounded-3xl bg-gradient-to-tr from-pastel-mint/50 via-surface to-pastel-peach/40 p-6 sm:p-8 shadow-card border border-border/80 flex flex-col justify-between overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pastel Glow Orbs */}
      <div className="absolute top-6 right-6 w-44 h-44 bg-pastel-peach/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-8 left-8 w-44 h-44 bg-pastel-mint/60 rounded-full blur-3xl -z-10" />

      {/* Header Banner */}
      <div className="flex items-center justify-between z-20">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface/90 backdrop-blur text-xs font-semibold text-primary-dark border border-primary/20 shadow-sm">
          <Flame className="w-4 h-4 text-accent animate-bounce" />
          <span>Vòng Quay Combo 24/7</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface/85 backdrop-blur border border-border text-xs text-muted">
          {isHovered ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-700 font-medium">Đã dừng (Rê chuột)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-primary-dark font-medium">Tự quay sau 5s</span>
            </>
          )}
        </div>
      </div>

      {/* Khu vực Vòng Quỹ Đạo Lớn & Tâm Thông Tin Tròn */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        {/* Đường vòng tròn quỹ đạo đứt nét thanh lịch */}
        <div
          className="absolute rounded-full border-2 border-dashed border-primary/20 pointer-events-none"
          style={{ width: radius * 2 + 10, height: radius * 2 + 10 }}
        />

        {/* 6 Hình Tròn Vệ Tinh phân bố đều trên quỹ đạo */}
        {FEATURED_COMBOS.map((combo, index) => {
          // Tính góc sao cho item đang chọn luôn nằm chính xác ở ĐỈNH (-90 độ)
          const offset = (index - activeIndex + totalItems) % totalItems;
          const angleDeg = -90 + offset * (360 / totalItems);
          const angleRad = (angleDeg * Math.PI) / 180;

          const x = Math.round(radius * Math.cos(angleRad));
          const y = Math.round(radius * Math.sin(angleRad));
          const isAtTop = offset === 0;

          return (
            <motion.div
              key={combo.id}
              animate={{
                x,
                // Khi lên đỉnh thì nhô cao hơn (-12px) để tạo cảm giác nổi bật
                y: isAtTop ? y - 10 : y,
                scale: isAtTop ? 1.25 : 0.95,
                zIndex: isAtTop ? 30 : 10,
                opacity: isAtTop ? 1 : 0.85,
              }}
              transition={{
                type: "spring",
                stiffness: 55,
                damping: 14,
                mass: 0.9,
              }}
              className="absolute flex flex-col items-center cursor-pointer"
              onClick={() => handleSelect(index)}
            >
              <div
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  isAtTop
                    ? "w-16 h-16 sm:w-18 sm:h-18 border-2 border-primary ring-4 ring-primary-tint/90 shadow-card-hover"
                    : "w-12 h-12 sm:w-14 sm:h-14 border-2 border-border/80 hover:scale-115 hover:opacity-100 hover:border-primary/40"
                } ${combo.bgColor}`}
              >
                <span className={isAtTop ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}>
                  {combo.emoji}
                </span>

                {isAtTop && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Tên nhỏ hiển thị dưới các hình tròn phụ xung quanh */}
              {!isAtTop && (
                <span className="text-[11px] font-medium text-muted mt-1.5 max-w-[76px] truncate text-center pointer-events-none">
                  {combo.name}
                </span>
              )}
            </motion.div>
          );
        })}

        {/* Khối Thông Tin Sản Phẩm Nằm Chính Giữa Vòng Tròn (Trung tâm tròn trịa, không đè lấn) */}
        <div className="absolute z-20 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCombo.id}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] rounded-full bg-surface/95 backdrop-blur-md border-2 border-primary/25 shadow-card-hover flex flex-col items-center justify-center p-4 text-center relative"
            >
              {/* Tag khuyến mãi */}
              <span
                className={`text-[10px] font-bold px-3 py-0.5 rounded-full border uppercase tracking-wider mb-2 ${activeCombo.accentBg} ${activeCombo.textColor} ${activeCombo.borderColor}`}
              >
                {activeCombo.tag}
              </span>

              {/* Tên combo */}
              <h3 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1 max-w-[190px]">
                {activeCombo.name}
              </h3>
              <p className="text-[11px] text-muted line-clamp-2 mt-1 max-w-[185px] leading-relaxed">
                {activeCombo.desc}
              </p>

              {/* Giá & Ưu đãi */}
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-primary-dark font-extrabold text-base sm:text-lg">
                  {activeCombo.price}
                </span>
                <span className="text-muted text-xs line-through">
                  {activeCombo.originalPrice}
                </span>
              </div>

              {/* Nút mua ngay */}
              <Button
                size="sm"
                asChild
                className="mt-2.5 h-7 px-4 text-xs rounded-full shadow-sm"
              >
                <Link to="/products" className="flex items-center justify-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Mua ngay</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Điều Hướng Nhanh & Chấm Tròn (Không còn thanh đếm ngược) */}
      <div className="flex items-center justify-between z-20 pt-3 border-t border-border/60 text-xs text-muted">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-soft text-muted hover:text-foreground transition-all shadow-sm"
            aria-label="Sản phẩm trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-soft text-muted hover:text-foreground transition-all shadow-sm"
            aria-label="Sản phẩm kế"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium ml-1.5">
            {activeIndex + 1} / {totalItems}
          </span>
        </div>

        {/* Chấm tròn chuyển đổi nhanh */}
        <div className="flex items-center gap-1.5">
          {FEATURED_COMBOS.map((combo, index) => (
            <button
              key={combo.id}
              onClick={() => handleSelect(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted"
              }`}
              aria-label={`Chọn ${combo.name}`}
            />
          ))}
        </div>

        <span className="text-[11px] text-primary-dark font-medium hidden sm:inline">
          {isHovered ? "Tạm dừng" : "Tự chuyển sau 5s"}
        </span>
      </div>
    </div>
  );
}
