import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { productApi } from "../api/productApi";

interface WishlistState {
  productIds: string[];
  synced: boolean;
  syncFromServer: () => Promise<void>;
  toggle: (productId: string, isAuthenticated?: boolean) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      synced: false,

      syncFromServer: async () => {
        const serverIds = await productApi.getMyWishlist();
        if (serverIds.length > 0) {
          set((state) => ({
            productIds: Array.from(new Set([...state.productIds, ...serverIds])),
            synced: true,
          }));
        } else {
          set({ synced: true });
        }
      },

      toggle: async (productId: string, isAuthenticated = false) => {
        const exists = get().productIds.includes(productId);
        const nextIds = exists
          ? get().productIds.filter((id) => id !== productId)
          : [...get().productIds, productId];
        set({ productIds: nextIds });

        if (isAuthenticated) {
          try {
            await productApi.toggleWishlist(productId);
          } catch {
            // keep local optimistic state
          }
        }
        return !exists;
      },

      isWishlisted: (productId: string) => get().productIds.includes(productId),
    }),
    {
      name: "csm-wishlist-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);
