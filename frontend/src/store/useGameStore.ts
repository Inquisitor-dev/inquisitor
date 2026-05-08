import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  // Auth
  userEmail: string | null;
  userId: string | null;
  authToken: string | null;
  isAdmin: boolean;
  isPremium: boolean;

  // Game
  sessionId: string | null;
  difficulty: string;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;
  timeOfDay: number;
  notes: string;
  scenario: string | null;
  inventory: {
    activeWarrants: string[];
    usedWarrants: string[];
  };
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  hasHydrated: boolean;

  setUser: (email: string, userId: string, token: string, isAdmin: boolean, isPremium: boolean) => void;
  setIsPremium: (val: boolean) => void;
  setHasHydrated: (val: boolean) => void;
  logout: () => void;
  setSessionId: (id: string) => void;
  setDifficulty: (d: string) => void;
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
  setWarrants: (active: string[], used: string[]) => void;
  addWarrant: (warrant: string) => void;
  consumeWarrant: (location: string) => void;
  setTruthReveal: (truth: string | null) => void;
  setLocationClues: (clues: Record<string, string> | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Auth
      userEmail: null,
      userId: null,
      authToken: null,
      isAdmin: false,
      isPremium: false,

      // Game
      sessionId: null,
      difficulty: 'easy',
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      maxDailyDialogues: 30,
      currentDay: 1,
      timeOfDay: 0,
      notes: '',
      scenario: null,
      inventory: { activeWarrants: [], usedWarrants: [] },
      truthReveal: null,
      locationClues: null,
      hasHydrated: false,

      setUser: (email, userId, token, isAdmin, isPremium) => set({ 
        userEmail: email, 
        userId, 
        authToken: token, 
        isAdmin,
        isPremium,
        maxDailyDialogues: isPremium ? 100 : 30,
      }),
      setIsPremium: (val) => set({ isPremium: val, maxDailyDialogues: val ? 100 : 30 }),
      setHasHydrated: (val) => set({ hasHydrated: val }),

      logout: () => set({
        userEmail: null,
        userId: null,
        authToken: null,
        isAdmin: false,
        isPremium: false,
        sessionId: null,
        difficulty: 'easy',
        selectedNpcId: null,
        npcStates: {},
        dialoguesUsedToday: 0,
        currentDay: 1,
        timeOfDay: 0,
        notes: '',
        scenario: null,
        inventory: { activeWarrants: [], usedWarrants: [] },
        truthReveal: null,
        locationClues: null,
      }),

      setSessionId: (id) => set({ sessionId: id }),
      setDifficulty: (d) => set({ difficulty: d }),
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
        inventory: { activeWarrants: [], usedWarrants: [] },
        truthReveal: null,
        locationClues: null,
      }),

      setWarrants: (active, used) => set({
        inventory: { activeWarrants: active, usedWarrants: used }
      }),
      
      addWarrant: (warrant) => set((state) => ({
        inventory: {
          ...state.inventory,
          activeWarrants: [...state.inventory.activeWarrants, warrant]
        }
      })),
      
      consumeWarrant: (location) => set((state) => ({
        inventory: {
          activeWarrants: state.inventory.activeWarrants.filter(w => w !== location),
          usedWarrants: [...state.inventory.usedWarrants, location]
        }
      })),

      setTruthReveal: (truth) => set({ truthReveal: truth }),

      setLocationClues: (clues) => set({ locationClues: clues }),
    }),
    {
      name: 'inquisitor-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
