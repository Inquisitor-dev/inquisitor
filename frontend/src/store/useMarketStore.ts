import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_OUTFIT_ID, LEGACY_OUTFIT_IDS } from '@/config/outfits';
import { api, ApiError } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';

const STARTING_BALANCE = 1000;

export interface TokenTransactionItem {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  metadata?: unknown;
  createdAt: string;
}

interface MarketState {
  tokenBalance: number;
  score: number;
  ownedItemIds: string[];
  equippedCosmeticIds: string[];
  equippedOutfitId: string;
  ledger: TokenTransactionItem[];
  hasHydrated: boolean;
  isLoading: boolean;

  fetchMarketData: (authToken?: string | null) => Promise<void>;
  purchaseServer: (itemId: string, authToken?: string | null) => Promise<{ success: boolean; message?: string }>;
  purchase: (itemId: string, price: number) => boolean;
  toggleEquip: (itemId: string) => void;
  equipOutfit: (outfitId: string) => void;
  setHasHydrated: (val: boolean) => void;
  createCheckout: (packId: string, authToken: string) => Promise<{ checkoutUrl?: string; isSimulated?: boolean; error?: string }>;
  simulatePayment: (packId: string, authToken: string) => Promise<{ success: boolean; error?: string }>;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      tokenBalance: STARTING_BALANCE,
      score: 0,
      ownedItemIds: [],
      equippedCosmeticIds: [],
      equippedOutfitId: DEFAULT_OUTFIT_ID,
      ledger: [],
      hasHydrated: false,
      isLoading: false,

      fetchMarketData: async (authToken?: string | null) => {
        if (!authToken) return;
        set({ isLoading: true });
        try {
          const data = await api.get<{
            tokenBalance: number;
            score?: number;
            ownedItemIds?: string[];
            ledger?: TokenTransactionItem[];
          }>('/market/me', { token: authToken });

          set({
            tokenBalance: data.tokenBalance,
            score: data.score ?? 0,
            ownedItemIds: data.ownedItemIds || [],
            ledger: data.ledger || [],
            isLoading: false,
          });
        } catch (e) {
          logger.warn('Failed to fetch market data from backend:', e);
          set({ isLoading: false });
        }
      },

      purchaseServer: async (itemId: string, authToken?: string | null) => {
        if (!authToken) {
          // Giriş yapılmamışsa yerel bakiye kontrolü (demo modu)
          return { success: false, message: 'Satın almak için giriş yapmış olmalısın.' };
        }

        try {
          const data = await api.post<{
            tokenBalance: number;
            ownedItemIds: string[];
          }>('/market/purchase', { itemId }, { token: authToken });

          set({
            tokenBalance: data.tokenBalance,
            ownedItemIds: data.ownedItemIds,
          });

          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Bağlantı hatası.');
          return { success: false, message };
        }
      },

      // Yerel fallback
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

      equipOutfit: (outfitId) => set({ equippedOutfitId: outfitId }),

      setHasHydrated: (val) => set({ hasHydrated: val }),

      createCheckout: async (packId: string, authToken: string) => {
        try {
          const data = await api.post<{
            checkoutUrl?: string;
            isSimulated?: boolean;
          }>('/payments/create-checkout-session', { packId }, { token: authToken });

          return {
            checkoutUrl: data.checkoutUrl,
            isSimulated: data.isSimulated,
          };
        } catch (e: unknown) {
          const error = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Sunucuya bağlanılamadı.');
          return { error };
        }
      },

      simulatePayment: async (packId: string, authToken: string) => {
        try {
          const data = await api.post<{
            newBalance: number;
          }>('/payments/simulate-success', { packId }, { token: authToken });

          set({ tokenBalance: data.newBalance });
          // Güncel verileri çek
          get().fetchMarketData(authToken);
          return { success: true };
        } catch (e: unknown) {
          const error = e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'İşlem başarısız.');
          return { success: false, error };
        }
      },
    }),
    {
      name: 'inquisitor-market',
      // v1: karakter id'leri yeniden adlandırıldı (LEGACY_OUTFIT_IDS)
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<MarketState>;
        if (version < 1) {
          if (state.equippedOutfitId) {
            state.equippedOutfitId = LEGACY_OUTFIT_IDS[state.equippedOutfitId] ?? state.equippedOutfitId;
          }
          state.ownedItemIds = state.ownedItemIds?.map((id) => {
            const outfit = id.startsWith('outfit_') ? LEGACY_OUTFIT_IDS[id.slice('outfit_'.length)] : undefined;
            return outfit ? `outfit_${outfit}` : id;
          });
        }
        return state as MarketState;
      },
      partialize: (state) => ({
        tokenBalance: state.tokenBalance,
        score: state.score,
        ownedItemIds: state.ownedItemIds,
        equippedCosmeticIds: state.equippedCosmeticIds,
        equippedOutfitId: state.equippedOutfitId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
