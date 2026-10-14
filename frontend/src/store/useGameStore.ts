import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type EvidenceItem,
  type GameState,
  createAuthSlice,
  createSessionSlice,
  createInventorySlice,
  createEvidenceSlice,
} from './slices';

export type { EvidenceItem, GameState };
export * from './slices';

export const useGameStore = create<GameState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createSessionSlice(...a),
      ...createInventorySlice(...a),
      ...createEvidenceSlice(...a),
    }),
    {
      name: 'inquisitor-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
