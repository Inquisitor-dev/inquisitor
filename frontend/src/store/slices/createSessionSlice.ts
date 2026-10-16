import type { GameSliceCreator, SessionSlice } from './types';

export const createSessionSlice: GameSliceCreator<SessionSlice> = (set) => ({
  sessionId: null,
  difficulty: 'easy',
  scenarioType: 'medieval',
  selectedNpcId: null,
  npcStates: {},
  dialoguesUsedToday: 0,
  maxDailyDialogues: 100,
  currentDay: 1,
  lastDay: 4,
  clearedNpcIds: [],
  timeOfDay: 0,
  notes: '',
  scenario: null,

  setSessionId: (id) =>
    set((state) =>
      state.sessionId === id
        ? { sessionId: id }
        : { sessionId: id, lastLocationId: null, evidence: [], lastDay: 4, clearedNpcIds: [] }
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

  setCaseProgress: (lastDay, clearedNpcIds) =>
    set((state) => ({ lastDay: lastDay ?? state.lastDay, clearedNpcIds })),

  // İkinci Nefes: yanlış hükümde şüpheli aklanır ve gün kapanır (sunucuyla aynı: korku -1, sabah)
  applySecondBreath: (clearedNpcId, lastDay) =>
    set((state) => ({
      currentDay: state.currentDay + 1,
      lastDay,
      clearedNpcIds: [...state.clearedNpcIds, clearedNpcId],
      timeOfDay: 0,
      dialoguesUsedToday: 0,
      npcStates: Object.fromEntries(
        Object.entries(state.npcStates).map(([id, st]) => [
          id,
          { ...st, fear: Math.max(0, st.fear - 1) },
        ])
      ),
    })),

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
      lastDay: 4,
      clearedNpcIds: [],
      timeOfDay: 0,
      notes: '',
      scenario: null,
      inventory: { activeWarrants: [], usedWarrants: [] },
      evidence: [],
      truthReveal: null,
      locationClues: null,
      lastLocationId: null,
    }),
});
