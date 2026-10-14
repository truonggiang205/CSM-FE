import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Pause, Play } from "lucide-react";
import { mockHeroBanners, HeroBannerItem } from "../../../mocks/homeMock";
import { Button } from "../../../components/ui/Button";

const FALLBACK_HERO_IMAGE = "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=700&q=80";

export function HeroPromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const banners = mockHeroBanners;
  const total = banners.length;

  useEffect(() => {
    if (isHovered || total <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, total]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % total);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + total) % total);
  const handleDotClick = (index: number) => setCurrentIndex(index);

  const currentBanner: HeroBannerItem = banners[currentIndex];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-border/80 shadow-card bg-surface select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Khuyến mãi nổi bật"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -40) handleNext();
            else if (info.offset.x > 40) handlePrev();
          }}
          className={`grid grid-cols-1 md:grid-cols-12 min-h-[300px] sm:min-h-[320px] md:min-h-[340px] lg:h-[350px] bg-gradient-to-br ${currentBanner.bgGradient} items-center`}
        >
          {/* Text Content */}
          <div className="md:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-center space-y-2.5 sm:space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border shadow-xs w-fit text-xs font-bold uppercase tracking-wider backdrop-blur-sm bg-surface/90">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-primary-dark">{currentBanner.badge}</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                {currentBanner.title} <br />
                <span className="bg-primary-tint/90 text-primary-dark px-2.5 py-0.5 rounded-xl border border-primary/20 inline-block mt-1">
                  {currentBanner.highlight}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md pt-1">
                {currentBanner.description}
              </p>
            </div>

            <div className="pt-2">
              <Button size="lg" asChild className="rounded-2xl shadow-sm text-xs sm:text-sm font-semibold h-11 px-6">
                <Link to={currentBanner.ctaLink} className="flex items-center gap-2">
                  <span>{currentBanner.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Banner Image */}
          <div className="md:col-span-5 p-3 sm:p-5 lg:p-6 flex items-center justify-center">
            <div className="relative w-full max-w-[220px] sm:max-w-[250px] lg:max-w-[260px] aspect-square rounded-3xl overflow-hidden shadow-card border border-border/80 bg-surface">
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                width={260}
                height={260}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_HERO_IMAGE;
                }}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-surface/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-border/80 shadow-xs">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                index === currentIndex ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-muted"
              }`}
              aria-label={`Chuyển tới slide ${index + 1}`}
            />
          ))}
          <span className="text-[10px] text-muted font-mono ml-1">
            {currentIndex + 1}/{total}
          </span>
        </div>

        {/* Prev / Next Buttons & Play/Pause State (min 44px tap target on touch) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handlePrev}
            className="w-11 h-11 min-h-[44px] min-w-[44px] sm:w-9 sm:h-9 rounded-full bg-surface/90 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary-tint hover:text-primary-dark transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            aria-label="Slide trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 min-h-[44px] min-w-[44px] sm:w-9 sm:h-9 rounded-full bg-surface/90 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-primary-tint hover:text-primary-dark transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            aria-label="Slide tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
