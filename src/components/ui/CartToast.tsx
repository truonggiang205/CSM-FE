import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useCartToastStore } from "../../store/useCartToastStore";
import { useCartStore } from "../../store/useCartStore";

export function CartToast() {
  const { isOpen, productName, hideToast } = useCartToastStore();
  const { setIsOpen } = useCartStore();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] pointer-events-none w-max max-w-[90vw]"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:py-3 rounded-2xl bg-foreground text-background shadow-2xl border border-border/20 backdrop-blur-md"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-medium truncate max-w-[200px] sm:max-w-[280px]">
              Đã thêm <strong className="font-bold text-emerald-300">{productName}</strong> vào giỏ
            </span>
            <button
              type="button"
              onClick={() => {
                hideToast();
                setIsOpen(true);
              }}
              className="text-xs font-bold text-accent-light underline hover:text-white transition-colors ml-1 cursor-pointer whitespace-nowrap"
            >
              Xem giỏ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
