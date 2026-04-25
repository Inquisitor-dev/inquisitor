import { create } from 'zustand';

interface GameState {
  sessionId: string | null;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;

  setSessionId: (id: string) => void;
  setSelectedNpc: (npcId: string) => void;
  updateNpcState: (npcId: string, fear: number, lie: number) => void;
  incrementDialogue: () => void;
  setDialoguesUsed: (count: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  selectedNpcId: null,
  npcStates: {},
  dialoguesUsedToday: 0,
  maxDailyDialogues: 40,

  setSessionId: (id) => set({ sessionId: id }),
  setSelectedNpc: (npcId) => set({ selectedNpcId: npcId }),

  updateNpcState: (npcId, fear, lie) =>
    set((state) => ({
      npcStates: {
        ...state.npcStates,
        [npcId]: { fear, lie },
      },
    })),

  incrementDialogue: () =>
    set((state) => ({
      dialoguesUsedToday: state.dialoguesUsedToday + 1,
    })),

  setDialoguesUsed: (count) =>
    set({
      dialoguesUsedToday: count,
    }),

  reset: () =>
    set({
      sessionId: null,
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
    }),
}));
