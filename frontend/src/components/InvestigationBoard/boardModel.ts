import { getInterior } from '@/config/interiorConfig';
import { DIALOGUE_CONFIG } from '@/config/dialogueConfig';
import { getLocationLabel } from '@/config/locationLabels';
import type { EvidenceItem } from '@/store/useGameStore';

// Sunucudaki pano modeliyle aynı (backend/src/board/board.ts)
export type BoardCardKind = 'suspect' | 'evidence' | 'note' | 'scene';
export type BoardStringType = 'CLEARS' | 'IMPLICATES' | 'SUPPORTS' | 'CONTRADICTS' | 'LINK';
export type BoardVerdict = 'CORRECT' | 'WRONG';

export interface BoardCard {
  id: string;
  kind: BoardCardKind;
  refId?: string;
  text?: string;
  // Kartın raptiyesinin panodaki yeri (panonun yüzdesi); kart raptiyeden aşağı sarkar
  x: number;
  y: number;
}

export interface BoardString {
  id: string;
  from: string;
  to: string;
  type: BoardStringType;
  verdict?: BoardVerdict;
}

export interface BoardState {
  cards: BoardCard[];
  strings: BoardString[];
}

export const NOTE_MAX_LENGTH = 200;

// İki kartın arasına çekilebilecek ip türleri (sunucudaki allowedStringTypes ile aynı)
export function allowedStringTypes(a: BoardCardKind, b: BoardCardKind): BoardStringType[] {
  const pair = [a, b].sort().join('+');
  if (pair === 'evidence+suspect') return ['CLEARS', 'IMPLICATES', 'LINK'];
  if (pair === 'evidence+evidence') return ['SUPPORTS', 'CONTRADICTS', 'LINK'];
  return ['LINK'];
}

export const STRING_TYPE_INFO: Record<BoardStringType, { label: string; hint: string; color: string }> = {
  CLEARS: { label: 'Aklıyor', hint: 'Bu kanıt bu kişinin mazeretini kanıtlıyor', color: '#4f9b5a' },
  IMPLICATES: { label: 'Suçluyor', hint: 'Bu kanıt bu kişiyi işaret ediyor', color: '#c0392b' },
  SUPPORTS: { label: 'Doğruluyor', hint: 'Bu iki kanıt birbirini destekliyor', color: '#3f7fc4' },
  CONTRADICTS: { label: 'Çelişiyor', hint: 'Bu iki kanıt birbiriyle çelişiyor', color: '#e08a2c' },
  LINK: { label: 'Bağlantı', hint: 'Sadece ilişkili; değerlendirilmez', color: '#8a0303' },
};

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 18)
    : Math.random().toString(36).slice(2, 14);

export interface SuspectInfo {
  id: string;
  name: string;
  place: string;
  // CSS background-image değeri: önce diyalog portresi, yüklenemezse altındaki mekân görseli görünür
  portrait: string;
}

// Şüphelinin adı ve portresi. Diyalog ayarlarındaki bazı portre dosyaları henüz yok; bu yüzden
// portrenin altına karakterin mekân görseli konur (yüklenemeyen katman boş sayılır).
export function suspectInfo(scenarioType: string, npcId: string): SuspectInfo {
  const interior = getInterior(scenarioType, npcId);
  const dialogue = DIALOGUE_CONFIG[scenarioType]?.[npcId];
  const layers = [dialogue?.portraitImage, interior?.backgroundImage].filter(Boolean);
  return {
    id: npcId,
    name: dialogue?.name ?? interior?.npcName ?? getLocationLabel(npcId, scenarioType),
    place: getLocationLabel(npcId, scenarioType),
    portrait: layers.map((src) => `url(${src})`).join(', '),
  };
}

// Kanıtın fotoğrafı: bulunduğu mekânın görselinden bir kesit
export function evidencePhoto(scenarioType: string, item: EvidenceItem): string | null {
  if (item.sourceId === 'crime_scene') {
    return scenarioType === 'medieval' ? '/backgrounds/bg_crime_scene.webp' : null;
  }
  return getInterior(scenarioType, item.sourceId)?.backgroundImage ?? null;
}

export function evidenceTitle(scenarioType: string, item: EvidenceItem): string {
  if (item.kind === 'CONFESSION') return 'İtiraf';
  if (item.category === 'STATEMENT') return 'Tanıklık';
  if (item.sourceId === 'crime_scene') return 'Olay Yeri İzi';
  return `Kanıt · ${getLocationLabel(item.sourceId, scenarioType)}`;
}
