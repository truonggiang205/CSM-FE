import { Variants, Transition } from "framer-motion";

/**
 * Standard Motion Design Tokens
 * Fast (0.18s): Hovers, buttons, toggles
 * Normal (0.3s): Cards, dropdowns, modals
 * Emphasis (0.6s): Hero elements, big section transitions
 */
export const MOTION_DURATION = {
  fast: 0.18,
  normal: 0.3,
  emphasis: 0.6,
} as const;

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const transitionFast: Transition = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE,
};

export const transitionNormal: Transition = {
  duration: MOTION_DURATION.normal,
  ease: MOTION_EASE,
};

export const transitionEmphasis: Transition = {
  duration: MOTION_DURATION.emphasis,
  ease: MOTION_EASE,
};

/**
 * Reusable animation variants
 */
export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionNormal,
  },
};

export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitionNormal,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/**
 * Helper to get clean variants respecting reduced motion preferences
 */
export function getReducedMotionVariants<T extends Variants>(variants: T, shouldReduce: boolean | null): T {
  if (!shouldReduce) return variants;

  const reduced: Record<string, unknown> = {};
  for (const key of Object.keys(variants)) {
    const original = variants[key] as Record<string, unknown>;
    reduced[key] = {
      opacity: original.opacity ?? 1,
      transition: { duration: 0.01 },
    };
  }
  return reduced as T;
}
