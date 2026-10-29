import type { EvidenceItem } from '@/store/slices/types';

// Mekân araması (tıkla-bul): sunucunun görünümü (backend src/search/search-game.ts SearchView).
// Nesnelerin yerleri istemciye hiç gelmez; tıklamayı sunucu denetler.
export interface SearchView {
  locationId: string;
  // Aranan alan (iç mekândaki tıklama noktasının id'si); mekânda bir anda tek arama olur
  areaId: string;
  image: string;
  attempt: number;
  status: 'RUNNING' | 'WON' | 'FAILED';
  // LIST: listedeki nesneler aranıyor; FINAL: asıl yer (gizli bölme) aranıyor
  stage: 'LIST' | 'FINAL';
  targets: { id: string; label: string; found: boolean }[];
  prompt: string | null;
  remainingMs: number;
  timeLimitMs: number;
  misses: number;
  hintsLeft: number;
}

// Başarısız arama günün bir vaktini harcar; her cevap günün vaktini de taşır
interface WithTimeOfDay {
  timeOfDay?: number;
}

export interface SearchAvailability extends WithTimeOfDay {
  available: boolean;
  // Mekânın arama alanları; boşsa mekân anlatıcıyla aranır
  areas: string[];
  // Kanıtın bulunduğu, aranabilen tek alan; öbürleri kilitlidir
  openArea: string | null;
  view: SearchView | null;
}

export interface SearchStartResult extends WithTimeOfDay {
  view: SearchView;
}

// Test modu: süren denemenin kutuları (görselin yüzdesi); normal oyunda sunucu bunu vermez
export interface SearchTestSpots {
  targets: { id: string; label: string; box: [number, number, number, number] }[];
  finalSpots: { id: string; box: [number, number, number, number]; current: boolean }[];
}

export type ClickOutcome = 'FOUND' | 'FINAL_FOUND' | 'ALREADY_FOUND' | 'MISS' | 'NOT_RUNNING';

export interface SearchClickResult extends WithTimeOfDay {
  outcome: ClickOutcome;
  objectId: string | null;
  view: SearchView;
  evidence: EvidenceItem[];
}

export interface SearchHintResult extends WithTimeOfDay {
  // Görselin yüzdesi; daire nesneyi içine alır ama tam yerini vermez
  hint: { x: number; y: number; r: number };
  view: SearchView;
}
