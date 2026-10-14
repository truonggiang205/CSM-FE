import { useState, useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion, MotionValue } from "framer-motion";

interface UseTiltOptions {
  maxTilt?: number; // Tối đa tilt tính theo độ (mặc định ±3deg)
  perspective?: number; // Perspective tính theo px (mặc định 800px)
}

interface UseTiltReturn {
  ref: React.RefObject<HTMLDivElement>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  style: React.CSSProperties | { rotateX: MotionValue<number>; rotateY: MotionValue<number>; transformStyle: "preserve-3d"; perspective: number; willChange: "transform" };
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
  isEnabled: boolean;
}

export function useTilt({ maxTilt = 3, perspective = 800 }: UseTiltOptions = {}): UseTiltReturn {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Kiểm tra thiết bị cảm ứng (không áp dụng tilt trên màn hình cảm ứng)
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

  const isEnabled = !shouldReduceMotion && !isTouchDevice;

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  // Dùng spring êm ái chống giật/lag hình ảnh và văn bản
  const springConfig = { damping: 25, stiffness: 350, mass: 0.5 };
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    // rotateX nghiêng theo trục ngang (chuột lên -> thẻ nghiêng lùi)
    rawRotateX.set(-y * maxTilt);
    // rotateY nghiêng theo trục dọc (chuột sang phải -> thẻ nghiêng phải)
    rawRotateY.set(x * maxTilt);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const style = isEnabled
    ? {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d" as const,
        perspective,
        willChange: "transform" as const,
        WebkitFontSmoothing: "subpixel-antialiased",
      }
    : {};

  return {
    ref,
    rotateX,
    rotateY,
    style,
    handleMouseMove,
    handleMouseLeave,
    isEnabled,
  };
}
