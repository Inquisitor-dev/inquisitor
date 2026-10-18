import type { EvidenceSlice, GameSliceCreator } from './types';

export const createEvidenceSlice: GameSliceCreator<EvidenceSlice> = (set) => ({
  evidence: [],
  truthReveal: null,
  locationClues: null,
  lastLocationId: null,
  caseOutcome: null,

  setEvidence: (items) => set({ evidence: items }),

  addEvidence: (items) =>
    set((state) => ({
      evidence: [
        ...state.evidence,
        ...items.filter((item) => !state.evidence.some((existing) => existing.id === item.id)),
      ],
    })),

  setTruthReveal: (truth) => set({ truthReveal: truth }),

  setLocationClues: (clues) => set({ locationClues: clues }),

  setLastLocationId: (id) => set({ lastLocationId: id }),

  setCaseOutcome: (outcome) => set({ caseOutcome: outcome }),
});
