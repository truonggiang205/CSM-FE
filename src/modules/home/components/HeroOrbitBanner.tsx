import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Flame, Pause, Play } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { productApi } from "../../../api/productApi";

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

// Preset style properties since DB doesn't have them
const STYLE_PRESETS = [
  { emoji: "🥪", bgColor: "bg-pastel-mint", textColor: "text-primary-dark", borderColor: "border-primary/30", accentBg: "bg-primary-tint" },
  { emoji: "🧃", bgColor: "bg-pastel-peach", textColor: "text-accent-dark", borderColor: "border-accent/30", accentBg: "bg-accent-tint" },
  { emoji: "🍱", bgColor: "bg-pastel-butter", textColor: "text-amber-800", borderColor: "border-amber-300", accentBg: "bg-amber-50" },
  { emoji: "🍙", bgColor: "bg-pastel-sky", textColor: "text-sky-800", borderColor: "border-sky-300", accentBg: "bg-sky-50" },
  { emoji: "🍦", bgColor: "bg-pastel-lavender", textColor: "text-purple-800", borderColor: "border-purple-300", accentBg: "bg-purple-50" },
  { emoji: "🍜", bgColor: "bg-pastel-rose", textColor: "text-rose-800", borderColor: "border-rose-300", accentBg: "bg-rose-50" },
];

export function HeroOrbitBanner() {
  const [combos, setCombos] = useState<FeaturedCombo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await productApi.getProducts();
        if (products && products.length > 0) {
          // Map DB products to FeaturedCombo structure
          const mappedCombos = products.slice(0, 6).map((p: any, index: number) => {
            const style = STYLE_PRESETS[index % STYLE_PRESETS.length];
            return {
              id: p.id.toString(),
              name: p.name,
              emoji: style.emoji,
              price: `${Number(p.base_price).toLocaleString("vi-VN")}₫`,
              originalPrice: `${(Number(p.base_price) + 10000).toLocaleString("vi-VN")}₫`, // Fake original price
              tag: index === 0 ? "Bán chạy #1" : "Ưu đãi",
              desc: p.description || "Món ngon hấp dẫn",
              bgColor: style.bgColor,
              textColor: style.textColor,
              borderColor: style.borderColor,
              accentBg: style.accentBg,
            };
          });
          setCombos(mappedCombos);
        } else {
          setCombos([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setCombos([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totalItems = combos.length;
  const radius = 175;

  useEffect(() => {
    if (isHovered || totalItems === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, totalItems]);

  const handleSelect = (index: number) => setActiveIndex(index);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % totalItems);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);

  if (isLoading) return null; // Or a loading spinner

  if (totalItems === 0) {
    // Không có data từ BE thì trả về rỗng (như yêu cầu)
    return null;
  }

  const activeCombo = combos[activeIndex];

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
              <span className="text-amber-700 font-medium">Đã dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-primary-dark font-medium">Tự quay</span>
            </>
          )}
        </div>
      </div>

      {/* Khu vực Vòng Quỹ Đạo Lớn */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <div
          className="absolute rounded-full border-2 border-dashed border-primary/20 pointer-events-none"
          style={{ width: radius * 2 + 10, height: radius * 2 + 10 }}
        />

        {combos.map((combo, index) => {
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
                y: isAtTop ? y - 10 : y,
                scale: isAtTop ? 1.25 : 0.95,
                zIndex: isAtTop ? 30 : 10,
                opacity: isAtTop ? 1 : 0.85,
              }}
              transition={{ type: "spring", stiffness: 55, damping: 14, mass: 0.9 }}
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
              {!isAtTop && (
                <span className="text-[11px] font-medium text-muted mt-1.5 max-w-[76px] truncate text-center pointer-events-none">
                  {combo.name}
                </span>
              )}
            </motion.div>
          );
        })}

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
              <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border uppercase tracking-wider mb-2 ${activeCombo.accentBg} ${activeCombo.textColor} ${activeCombo.borderColor}`}>
                {activeCombo.tag}
              </span>
              <h3 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1 max-w-[190px]">
                {activeCombo.name}
              </h3>
              <p className="text-[11px] text-muted line-clamp-2 mt-1 max-w-[185px] leading-relaxed">
                {activeCombo.desc}
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-primary-dark font-extrabold text-base sm:text-lg">
                  {activeCombo.price}
                </span>
                <span className="text-muted text-xs line-through">
                  {activeCombo.originalPrice}
                </span>
              </div>
              <Button size="sm" asChild className="mt-2.5 h-7 px-4 text-xs rounded-full shadow-sm">
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

      {/* Footer */}
      <div className="flex items-center justify-between z-20 pt-3 border-t border-border/60 text-xs text-muted">
        <div className="flex items-center gap-1">
          <button onClick={handlePrev} className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-soft shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNext} className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-soft shadow-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-medium ml-1.5">{activeIndex + 1} / {totalItems}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {combos.map((combo, index) => (
            <button
              key={combo.id}
              onClick={() => handleSelect(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
