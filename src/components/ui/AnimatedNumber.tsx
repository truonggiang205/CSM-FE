import { useEffect } from "react";
import { useSpring, useTransform, motion, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatFn?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  formatFn = (v) => Math.round(v).toLocaleString("vi-VN"),
  className = "",
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const spring = useSpring(value, {
    stiffness: 180,
    damping: 24,
    mass: 0.8,
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(spring, (current) => formatFn(current));

  if (shouldReduceMotion) {
    return <span className={className}>{formatFn(value)}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
