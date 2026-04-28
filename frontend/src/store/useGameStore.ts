import { create } from 'zustand';

interface GameState {
  sessionId: string | null;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;

  setSessionId: (id: string) => void;
  setSelectedNpc: (npcId: string) => void;
  updateNpcState: (npcId: string, fear: number, lie: number) => void;
  incrementDialogue: () => void;
  setDialoguesUsed: (count: number) => void;
  setCurrentDay: (day: number) => void;
  endDay: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  selectedNpcId: null,
  npcStates: {},
  dialoguesUsedToday: 0,
  maxDailyDialogues: 40,
  currentDay: 1,

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

  setCurrentDay: (day) =>
    set({
      currentDay: day,
    }),

  endDay: () =>
    set((state) => ({
      currentDay: state.currentDay + 1,
      dialoguesUsedToday: 0,
      // Gece NPC korkuları biraz azalır:
      npcStates: Object.fromEntries(
        Object.entries(state.npcStates).map(([id, st]) => [
          id,
          { ...st, fear: Math.max(0, st.fear - 1) },
        ])
      ),
    })),

  reset: () =>
    set({
      sessionId: null,
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      currentDay: 1,
    }),
}));
