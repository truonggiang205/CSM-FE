import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Ambient background: các khối màu pastel mờ trôi rất chậm tại trang chủ.
 * - Opacity tối đa 0.08 để không lấn át nội dung.
 * - Chỉ sử dụng transform và opacity (tăng tốc phần cứng GPU, tránh repaints).
 * - Tự động tạm dừng chuyển động khi tab trình duyệt bị ẩn (visibilitychange).
 * - Tắt hoàn toàn chuyển động khi người dùng bật prefers-reduced-motion.
 */
export function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const shouldAnimate = isTabVisible && !shouldReduceMotion;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Khối màu 1: Primary Emerald / Mint (Góc trên trái) */}
      <motion.div
        animate={
          shouldAnimate
            ? {
                x: [0, 45, -35, 0],
                y: [0, -60, 40, 0],
                scale: [1, 1.08, 0.94, 1],
              }
            : undefined
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
        className="absolute -top-24 -left-24 w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full bg-[#4E9F76] blur-[110px] opacity-[0.07]"
      />

      {/* Khối màu 2: Pastel Peach / Amber (Khu vực giữa - phải) */}
      <motion.div
        animate={
          shouldAnimate
            ? {
                x: [0, -50, 30, 0],
                y: [0, 50, -45, 0],
                scale: [1, 0.95, 1.07, 1],
              }
            : undefined
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[35%] -right-28 w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] rounded-full bg-[#F9A03F] blur-[100px] opacity-[0.06]"
      />

      {/* Khối màu 3: Pastel Sky Blue (Khu vực dưới - trái) */}
      <motion.div
        animate={
          shouldAnimate
            ? {
                x: [0, 40, -40, 0],
                y: [0, -40, 50, 0],
                scale: [1, 1.06, 0.96, 1],
              }
            : undefined
        }
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        style={{ willChange: "transform" }}
        className="absolute top-[65%] -left-20 w-[360px] sm:w-[460px] h-[360px] sm:h-[460px] rounded-full bg-[#63B3ED] blur-[110px] opacity-[0.06]"
      />
    </div>
  );
}
