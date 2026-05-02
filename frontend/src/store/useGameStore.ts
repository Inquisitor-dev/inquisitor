import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  // Auth
  userEmail: string | null;
  userId: string | null;
  authToken: string | null;
  isAdmin: boolean;

  // Game
  sessionId: string | null;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;
  timeOfDay: number;
  notes: string;
  scenario: string | null;
  inventory: {
    warrant: string | null;
    isWarrantUsed: boolean;
  };

  setUser: (email: string, userId: string, token: string, isAdmin: boolean) => void;
  logout: () => void;
  setSessionId: (id: string) => void;
  setSelectedNpc: (npcId: string) => void;
  updateNpcState: (npcId: string, fear: number, lie: number) => void;
  incrementDialogue: () => void;
  setDialoguesUsed: (count: number) => void;
  setCurrentDay: (day: number) => void;
  setTimeOfDay: (time: number) => void;
  setNotes: (notes: string) => void;
  setScenario: (scenario: string) => void;
  advanceTime: () => void;
  endDay: () => void;
  reset: () => void;
  setWarrant: (warrant: string | null, isUsed?: boolean) => void;
  consumeWarrant: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Auth
      userEmail: null,
      userId: null,
      authToken: null,
      isAdmin: false,

      // Game
      sessionId: null,
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      maxDailyDialogues: 30,
      currentDay: 1,
      timeOfDay: 0,
      notes: '',
      scenario: null,
      inventory: { warrant: null, isWarrantUsed: false },

      setUser: (email, userId, token, isAdmin) => set({ userEmail: email, userId, authToken: token, isAdmin }),

      logout: () => set({
        userEmail: null,
        userId: null,
        authToken: null,
        isAdmin: false,
        sessionId: null,
        selectedNpcId: null,
        npcStates: {},
        dialoguesUsedToday: 0,
        currentDay: 1,
        timeOfDay: 0,
        notes: '',
        scenario: null,
        inventory: { warrant: null, isWarrantUsed: false },
      }),

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

      setScenario: (scenario: string) =>
        set({
          scenario,
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

      reset: () => set({
        sessionId: null,
        selectedNpcId: null,
        npcStates: {},
        dialoguesUsedToday: 0,
        currentDay: 1,
        timeOfDay: 0,
        notes: '',
        scenario: null,
        inventory: { warrant: null, isWarrantUsed: false },
      }),

      setWarrant: (warrant, isUsed = false) => set((state) => ({
        inventory: { warrant, isWarrantUsed: isUsed },
      })),

      consumeWarrant: () => set((state) => ({
        inventory: { ...state.inventory, isWarrantUsed: true },
      })),
    }),
    {
      name: 'inquisitor-storage',
    }
  )
);
