import { create } from "zustand";

interface CartToastState {
  isOpen: boolean;
  productName: string;
  showToast: (productName: string) => void;
  hideToast: () => void;
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const useCartToastStore = create<CartToastState>((set) => ({
  isOpen: false,
  productName: "",
  showToast: (productName: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    set({ isOpen: true, productName });
    timeoutId = setTimeout(() => {
      set({ isOpen: false });
      timeoutId = null;
    }, 2500);
  },
  hideToast: () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    set({ isOpen: false });
  },
}));
