import type { StateCreator } from 'zustand';
import type { CaseOutcome } from '@/features/verdict/verdictTypes';

// Kanıt Defteri kaydı. ITEM: mekânda bulunan fiziksel nesne (Envanter),
// STATEMENT: bir karakterin ifadesi (Not defterine otomatik yazılır)
export interface EvidenceItem {
  id: string;
  // BODY: örtü altındaki yara; TESTIMONY: cinayete bağlı sırrın ifadesi; ALIBI: mazeret doğrulaması (Vaka Motoru v2)
  // EVENT: gece olayının defterdeki kartı (v3 personaları); kanıt deposuna alınmaz
  // LETTER: Psikopatın kapının altına bıraktığı mektup (izi birkaç şüpheliye uyar)
  kind:
    | 'CLUE'
    | 'VERIFICATION'
    | 'CONFESSION'
    | 'BODY'
    | 'TESTIMONY'
    | 'ALIBI'
    | 'EVENT'
    | 'LETTER'
    | 'RAID_TRACE';
  category: 'ITEM' | 'STATEMENT' | 'EVENT';
  sourceId: string;
  text: string;
  dayNumber: number;
  // Gece baskınında çalındı: kaydı kalır ama gösterilemez, panoya ve hükme giremez
  stolen?: boolean;
}

export interface AuthSlice {
  userEmail: string | null;
  userId: string | null;
  authToken: string | null;
  username: string | null;
  avatar: string;
  isAdmin: boolean;
  isPremium: boolean;
  hasHydrated: boolean;

  setUser: (
    email: string,
    userId: string,
    token: string,
    isAdmin: boolean,
    isPremium?: boolean,
    username?: string | null,
    avatar?: string,
  ) => void;
  setProfile: (username: string | null, avatar: string) => void;
  setIsPremium: (val: boolean) => void;
  setHasHydrated: (val: boolean) => void;
  logout: () => void;
}

// Vakanın olay yeri (evrenin 5 olay yerinden biri) ve görünüşü; görseli seçmek için
export interface CrimeSceneInfo {
  id: string;
  appearance: 'MESSY' | 'TIDY';
}

export interface SessionSlice {
  sessionId: string | null;
  difficulty: string;
  scenarioType: string;
  selectedNpcId: string | null;
  npcStates: Record<string, { fear: number; lie: number }>;
  dialoguesUsedToday: number;
  maxDailyDialogues: number;
  currentDay: number;
  // Vakanın son günü: sunucudan gelir (normalde 4; İkinci Nefes son günde kullanılırsa 5)
  lastDay: number;
  // İkinci Nefes ile masum olduğu açıklanan şüpheliler (hüküm listesinden çıkar)
  clearedNpcIds: string[];
  timeOfDay: number;
  notes: string;
  scenario: string | null;
  // Olay yeri seçimi eklenmeden önce açılan vakalarda null
  crimeScene: CrimeSceneInfo | null;

  setSessionId: (id: string) => void;
  setDifficulty: (d: string) => void;
  setScenarioType: (s: string) => void;
  setSelectedNpc: (npcId: string) => void;
  updateNpcState: (npcId: string, fear: number, lie: number) => void;
  incrementDialogue: () => void;
  setDialoguesUsed: (count: number) => void;
  setCurrentDay: (day: number) => void;
  setCaseProgress: (lastDay: number | undefined, clearedNpcIds: string[]) => void;
  applySecondBreath: (clearedNpcId: string, lastDay: number) => void;
  setTimeOfDay: (time: number) => void;
  setNotes: (notes: string) => void;
  setScenario: (scenario: string) => void;
  setCrimeScene: (crimeScene: CrimeSceneInfo | null) => void;
  advanceTime: () => void;
  endDay: () => void;
  reset: () => void;
}

export interface InventorySlice {
  inventory: {
    activeWarrants: string[];
    usedWarrants: string[];
  };

  setWarrants: (active: string[], used: string[]) => void;
  addWarrant: (warrant: string) => void;
  consumeWarrant: (location: string) => void;
}

export interface EvidenceSlice {
  evidence: EvidenceItem[];
  truthReveal: string | null;
  locationClues: Record<string, string> | null;
  lastLocationId: string | null;
  // Hüküm Dosyası'nın sonucu: sonuç ekranı raporun puanını buradan okur
  caseOutcome: CaseOutcome | null;

  setEvidence: (items: EvidenceItem[]) => void;
  addEvidence: (items: EvidenceItem[]) => void;
  setTruthReveal: (truth: string | null) => void;
  setLocationClues: (clues: Record<string, string> | null) => void;
  setLastLocationId: (id: string | null) => void;
  setCaseOutcome: (outcome: CaseOutcome | null) => void;
}

export type GameState = AuthSlice & SessionSlice & InventorySlice & EvidenceSlice;

export type GameSliceCreator<T> = StateCreator<GameState, [], [], T>;
