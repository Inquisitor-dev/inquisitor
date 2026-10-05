import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutfitSlot } from '@/app/market/marketItems';

// Market bakiyesi ve satın alınan eşyalar. Backend'de token sistemi kurulana kadar
// tarayıcıda (localStorage) saklanır.
const STARTING_BALANCE = 1000;

// TEST: sınırsız token. Açıkken bakiye sabit kalır, satın almalar bakiyeden düşmez.
// Gerçek ekonomiye geçerken false yap.
const UNLIMITED_TOKENS = true;
const UNLIMITED_BALANCE = 999_999;

// Kozmetiklerden kıyafetlere taşınan eşyaların eski id'leri
const MIGRATED_IDS: Record<string, string> = {
  cosmetic_scarlet_robe: 'outfit_scarlet_robe',
  cosmetic_plague_mask: 'outfit_plague_mask',
};

export type EquippedOutfit = Partial<Record<OutfitSlot, string>>;

interface MarketState {
  tokenBalance: number;
  ownedItemIds: string[];
  equippedCosmeticIds: string[];
  // Slot başına giyili kıyafet id'si
  equippedOutfit: EquippedOutfit;
  hasHydrated: boolean;

  purchase: (itemId: string, price: number) => boolean;
  toggleEquip: (itemId: string) => void;
  // Aynı slottaki parçayı değiştirir; parça zaten giyiliyse çıkarır
  equipOutfit: (itemId: string, slot: OutfitSlot) => void;
  unequipSlot: (slot: OutfitSlot) => void;
  clearOutfit: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      tokenBalance: UNLIMITED_TOKENS ? UNLIMITED_BALANCE : STARTING_BALANCE,
      ownedItemIds: [],
      equippedCosmeticIds: [],
      equippedOutfit: {},
      hasHydrated: false,

      purchase: (itemId, price) => {
        const { tokenBalance, ownedItemIds } = get();
        if (ownedItemIds.includes(itemId) || tokenBalance < price) return false;
        set({
          tokenBalance: UNLIMITED_TOKENS ? tokenBalance : tokenBalance - price,
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

      equipOutfit: (itemId, slot) =>
        set((state) => {
          if (!state.ownedItemIds.includes(itemId)) return state;
          const next = { ...state.equippedOutfit };
          if (next[slot] === itemId) delete next[slot];
          else next[slot] = itemId;
          return { equippedOutfit: next };
        }),

      unequipSlot: (slot) =>
        set((state) => {
          const next = { ...state.equippedOutfit };
          delete next[slot];
          return { equippedOutfit: next };
        }),

      clearOutfit: () => set({ equippedOutfit: {} }),

      setHasHydrated: (val) => set({ hasHydrated: val }),
    }),
    {
      name: 'inquisitor-market',
      version: 1,
      partialize: (state) => ({
        tokenBalance: state.tokenBalance,
        ownedItemIds: state.ownedItemIds,
        equippedCosmeticIds: state.equippedCosmeticIds,
        equippedOutfit: state.equippedOutfit,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<MarketState>;
        if (version < 1) {
          state.ownedItemIds = (state.ownedItemIds ?? []).map((id) => MIGRATED_IDS[id] ?? id);
          state.equippedCosmeticIds = (state.equippedCosmeticIds ?? []).filter(
            (id) => !(id in MIGRATED_IDS)
          );
          state.equippedOutfit = {};
        }
        return state as MarketState;
      },
      // Kayıtlı bakiye ne olursa olsun test modunda sınırsız bakiyeyle başla
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<MarketState>),
        ...(UNLIMITED_TOKENS ? { tokenBalance: UNLIMITED_BALANCE } : {}),
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
