import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Kanıt Defteri kaydı. ITEM: mekânda bulunan fiziksel nesne (Envanter),
// STATEMENT: bir karakterin ifadesi (Not defterine otomatik yazılır)
export interface EvidenceItem {
  id: string;
  kind: 'CLUE' | 'VERIFICATION' | 'CONFESSION';
  category: 'ITEM' | 'STATEMENT';
  sourceId: string;
  text: string;
  dayNumber: number;
}

interface GameState {
  // Auth
  userEmail: string | null;
  userId: string | null;
  authToken: string | null;
  username: string | null;
  avatar: string;
  isAdmin: boolean;
  isPremium: boolean;

  // Game
  sessionId: string | null;
  difficulty: string;
  scenarioType: string;
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
  evidence: EvidenceItem[];
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  lastLocationId: string | null;
  hasHydrated: boolean;

  setUser: (
    email: string,
    userId: string,
    token: string,
    isAdmin: boolean,
    isPremium: boolean,
    username?: string | null,
    avatar?: string,
  ) => void;
  setProfile: (username: string | null, avatar: string) => void;
  setIsPremium: (val: boolean) => void;
  setHasHydrated: (val: boolean) => void;
  logout: () => void;
  setSessionId: (id: string) => void;
  setDifficulty: (d: string) => void;
  setScenarioType: (s: string) => void;
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
  setEvidence: (items: EvidenceItem[]) => void;
  addEvidence: (items: EvidenceItem[]) => void;
  setTruthReveal: (truth: string | null) => void;
  setLocationClues: (clues: Record<string, string> | null) => void;
  setLastLocationId: (id: string | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Auth
      userEmail: null,
      userId: null,
      authToken: null,
      username: null,
      avatar: 'avatar_1',
      isAdmin: false,
      isPremium: false,

      // Game
      sessionId: null,
      difficulty: 'easy',
      scenarioType: 'medieval',
      selectedNpcId: null,
      npcStates: {},
      dialoguesUsedToday: 0,
      maxDailyDialogues: 100,
      currentDay: 1,
      timeOfDay: 0,
      notes: '',
      scenario: null,
      inventory: { activeWarrants: [], usedWarrants: [] },
      evidence: [],
      truthReveal: null,
      locationClues: null,
      lastLocationId: null,
      hasHydrated: false,

      setUser: (email, userId, token, isAdmin, isPremium = false, username?: string | null, avatar?: string) => set({ 
        userEmail: email, 
        userId, 
        authToken: token, 
        isAdmin,
        isPremium,
        username: username ?? null,
        avatar: avatar || 'avatar_1',
        maxDailyDialogues: 100,
      }),
      setProfile: (username, avatar) => set({ username, avatar }),
      setIsPremium: (val) => set({ isPremium: val, maxDailyDialogues: 100 }),
      setHasHydrated: (val) => set({ hasHydrated: val }),

      logout: () => set({
        userEmail: null,
        userId: null,
        authToken: null,
        username: null,
        avatar: 'avatar_1',
        isAdmin: false,
        isPremium: false,
        sessionId: null,
        difficulty: 'easy',
        scenarioType: 'medieval',
        selectedNpcId: null,
        npcStates: {},
        dialoguesUsedToday: 0,
        currentDay: 1,
        timeOfDay: 0,
        notes: '',
        scenario: null,
        inventory: { activeWarrants: [], usedWarrants: [] },
        evidence: [],
        truthReveal: null,
        locationClues: null,
        lastLocationId: null,
      }),

      // Yeni oturumda karakter tekrar başlangıç noktasından yola çıkar
      setSessionId: (id) => set((state) =>
        state.sessionId === id ? { sessionId: id } : { sessionId: id, lastLocationId: null, evidence: [] }
      ),
      setDifficulty: (d) => set({ difficulty: d }),
      setScenarioType: (s) => set({ scenarioType: s }),
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
        evidence: [],
        truthReveal: null,
        locationClues: null,
        lastLocationId: null,
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

      setEvidence: (items) => set({ evidence: items }),

      addEvidence: (items) => set((state) => ({
        evidence: [
          ...state.evidence,
          ...items.filter((item) => !state.evidence.some((existing) => existing.id === item.id)),
        ],
      })),

      setTruthReveal: (truth) => set({ truthReveal: truth }),

      setLocationClues: (clues) => set({ locationClues: clues }),

      setLastLocationId: (id) => set({ lastLocationId: id }),
    }),
    {
      name: 'inquisitor-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
