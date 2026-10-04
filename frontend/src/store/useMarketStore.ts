import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Market bakiyesi ve satın alınan eşyalar. Backend'de token sistemi kurulana kadar
// tarayıcıda (localStorage) saklanır.
const STARTING_BALANCE = 1000;

interface MarketState {
  tokenBalance: number;
  ownedItemIds: string[];
  equippedCosmeticIds: string[];
  hasHydrated: boolean;

  purchase: (itemId: string, price: number) => boolean;
  toggleEquip: (itemId: string) => void;
  setHasHydrated: (val: boolean) => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      tokenBalance: STARTING_BALANCE,
      ownedItemIds: [],
      equippedCosmeticIds: [],
      hasHydrated: false,

      purchase: (itemId, price) => {
        const { tokenBalance, ownedItemIds } = get();
        if (ownedItemIds.includes(itemId) || tokenBalance < price) return false;
        set({
          tokenBalance: tokenBalance - price,
          ownedItemIds: [...ownedItemIds, itemId],
        });
        return true;
      },

      toggleEquip: (itemId) =>
        set((state) => ({
          equippedCosmeticIds: state.equippedCosmeticIds.includes(itemId)
            ? state.equippedCosmeticIds.filter((id) => id !== itemId)
            : [...state.equippedCosmeticIds, itemId],
        })),

      setHasHydrated: (val) => set({ hasHydrated: val }),
    }),
    {
      name: 'inquisitor-market',
      partialize: (state) => ({
        tokenBalance: state.tokenBalance,
        ownedItemIds: state.ownedItemIds,
        equippedCosmeticIds: state.equippedCosmeticIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
