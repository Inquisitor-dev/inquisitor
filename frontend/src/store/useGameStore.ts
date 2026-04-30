import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  sessionId: string | null;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;
  timeOfDay: number; // 0: Sabah, 1: Öğlen, 2: İkindi, 3: Akşam, 4: Gece
  notes: string;

  setSessionId: (id: string) => void;
  setSelectedNpc: (npcId: string) => void;
  updateNpcState: (npcId: string, fear: number, lie: number) => void;
  incrementDialogue: () => void;
  setDialoguesUsed: (count: number) => void;
  setCurrentDay: (day: number) => void;
  setTimeOfDay: (time: number) => void;
  setNotes: (notes: string) => void;
  advanceTime: () => void;
  endDay: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      sessionId: null,
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      maxDailyDialogues: 40,
      currentDay: 1,
      timeOfDay: 0,
      notes: '',

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

      setTimeOfDay: (time) =>
        set({
          timeOfDay: time,
        }),

      setNotes: (notes) =>
        set({
          notes,
        }),

      advanceTime: () =>
        set((state) => ({
          timeOfDay: Math.min(4, state.timeOfDay + 1),
        })),

      endDay: () =>
        set((state) => ({
          currentDay: state.currentDay + 1,
          timeOfDay: 0,
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
          timeOfDay: 0,
          notes: '',
        }),
    }),
    {
      name: 'inquisitor-game-storage', // name of the item in the storage (must be unique)
    }
  )
);
