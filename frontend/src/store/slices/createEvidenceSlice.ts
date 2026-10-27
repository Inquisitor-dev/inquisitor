import type { EvidenceItem, EvidenceSlice, GameSliceCreator } from './types';

// Gece olaylarının kartları (EVENT) kanıt değildir: depoya alınmaz, böylece Kanıt Göster, pano ve
// Hüküm Dosyası'nda görünmez. Defter onları sunucudan ayrıca alır.
const caseEvidence = (items: EvidenceItem[]) => items.filter((item) => item.category !== 'EVENT');

export const createEvidenceSlice: GameSliceCreator<EvidenceSlice> = (set) => ({
  evidence: [],
  truthReveal: null,
  locationClues: null,
  lastLocationId: null,
  caseOutcome: null,

  setEvidence: (items) => set({ evidence: caseEvidence(items) }),

  addEvidence: (items) =>
    set((state) => ({
      evidence: [
        ...state.evidence,
        ...caseEvidence(items).filter((item) => !state.evidence.some((existing) => existing.id === item.id)),
      ],
    })),

  setTruthReveal: (truth) => set({ truthReveal: truth }),

  setLocationClues: (clues) => set({ locationClues: clues }),

  setLastLocationId: (id) => set({ lastLocationId: id }),

  setCaseOutcome: (outcome) => set({ caseOutcome: outcome }),
});
