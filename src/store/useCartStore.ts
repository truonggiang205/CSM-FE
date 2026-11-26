import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "../types/product";
import { Combo } from "../api/comboApi";

export interface CartComboItemDetail {
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  originalPrice: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  itemType?: "PRODUCT" | "COMBO";
  comboId?: string;
  comboItems?: CartComboItemDetail[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  addCombo: (combo: Combo, maxStock?: number, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Bọc an toàn localStorage với try/catch để chống crash trong private mode hoặc lỗi QuotaExceeded
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (err) {
      console.warn("Không thể đọc giỏ hàng từ localStorage:", err);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      console.warn("Không thể lưu giỏ hàng vào localStorage:", err);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.warn("Không thể xoá giỏ hàng khỏi localStorage:", err);
    }
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.product.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? {
                      ...i,
                      product: {
                        ...existingItem.product,
                        discountPrice: product.discountPrice !== undefined ? product.discountPrice : existingItem.product.discountPrice,
                      },
                      quantity: i.quantity + quantity,
                    }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { product, quantity, itemType: "PRODUCT" }], isOpen: true };
        });
      },

      addCombo: (combo, maxStock = 99, quantity = 1) => {
        const cartId = `combo-${combo.id}`;
        const firstImg =
          combo.image_url ||
          combo.items?.find((i) => i.product_image)?.product_image ||
          "";
        const comboProduct: Product = {
          id: cartId,
          name: combo.name,
          slug: `combo-${combo.id}`,
          price: Number(combo.original_price) || Number(combo.combo_price),
          discountPrice: Number(combo.combo_price),
          description: combo.description || "Combo tiết kiệm CSM",
          images: firstImg ? [firstImg] : [],
          category: { id: "combo", name: "Combo Tiết Kiệm" },
          stock: Math.max(1, maxStock),
        };
        const comboItems: CartComboItemDetail[] = (combo.items || []).map((ci) => ({
          productId: ci.product_id,
          productName: ci.product_name || ci.product_id,
          productImage: ci.product_image || null,
          quantity: Number(ci.quantity) || 1,
          originalPrice: Number(ci.original_price) || 0,
        }));

        set((state) => {
          const existingItem = state.items.find((i) => i.product.id === cartId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product.id === cartId
                  ? {
                      ...i,
                      product: comboProduct,
                      comboItems,
                      quantity: i.quantity + quantity,
                    }
                  : i
              ),
              isOpen: true,
            };
          }
          return {
            items: [
              ...state.items,
              {
                product: comboProduct,
                quantity,
                itemType: "COMBO",
                comboId: combo.id,
                comboItems,
              },
            ],
            isOpen: true,
          };
        });
      },

      // Xoá sản phẩm khỏi giỏ ngay lập tức
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      // Cập nhật số lượng ngay lập tức (xoá nếu quantity <= 0)
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setIsOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((total, item) => {
          const price = item.product.discountPrice || item.product.price;
          return total + price * item.quantity;
        }, 0),
    }),
    {
      name: "csm-cart-storage",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ items: state.items }), // Chỉ lưu danh sách items
    }
  )
);
