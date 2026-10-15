import type { GameSliceCreator, InventorySlice } from './types';

export const createInventorySlice: GameSliceCreator<InventorySlice> = (set) => ({
  inventory: { activeWarrants: [], usedWarrants: [] },

  setWarrants: (active, used) =>
    set({
      inventory: { activeWarrants: active, usedWarrants: used },
    }),

  addWarrant: (warrant) =>
    set((state) => ({
      inventory: {
        ...state.inventory,
        activeWarrants: [...state.inventory.activeWarrants, warrant],
      },
    })),

  consumeWarrant: (location) =>
    set((state) => ({
      inventory: {
        activeWarrants: state.inventory.activeWarrants.filter((w) => w !== location),
        usedWarrants: [...state.inventory.usedWarrants, location],
      },
    })),
});
