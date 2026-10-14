// Çin ve diğer evrenler için doğrudan isimle çağrılan NPC anahtar eşleştirmeleri
export const CHINA_NPC_ALIASES: Record<string, string> = {
  lin_feng: 'tavern',
  zhao: 'church',
  komutan_zhao: 'church',
  huikang: 'graveyard',
  kesis_huikang: 'graveyard',
  keşiş_huikang: 'graveyard',
  guan: 'mill',
  usta_guan: 'mill',
  song: 'clinic',
  bilgin_song: 'clinic',
  mei: 'farm',
  mei_teyze: 'farm',
};

export const CYBERPUNK_NPC_ALIASES: Record<string, string> = {
  kael: 'tavern',
  kael_voss: 'tavern',
  voss: 'tavern',
  mirel: 'church',
  mirel_sato: 'church',
  sato: 'church',
  brakk: 'graveyard',
  brakk_coil: 'graveyard',
  coil: 'graveyard',
  aura: 'mill',
  'aura-9': 'mill',
  aura9: 'mill',
  ash: 'farm',
  vera: 'clinic',
  vera_nyx: 'clinic',
  nyx: 'clinic',
};

export const WINTER_NPC_ALIASES: Record<string, string> = {
  torstein: 'tavern',
  valda: 'church',
  kahin_valda: 'church',
  kâhin_valda: 'church',
  bjorn: 'graveyard',
  komutan_bjorn: 'graveyard',
  durn: 'mill',
  madenci_durn: 'mill',
  einar: 'farm',
  kenneth: 'clinic',
  muhafiz_kenneth: 'clinic',
  muhafız_kenneth: 'clinic',
};

export function resolveNpcAlias(npcKey: string): {
  actualNpcKey: string;
  inferredScenario: 'china' | 'cyberpunk' | 'winter' | null;
} {
  if (CHINA_NPC_ALIASES[npcKey]) {
    return { actualNpcKey: CHINA_NPC_ALIASES[npcKey], inferredScenario: 'china' };
  }
  if (CYBERPUNK_NPC_ALIASES[npcKey]) {
    return { actualNpcKey: CYBERPUNK_NPC_ALIASES[npcKey], inferredScenario: 'cyberpunk' };
  }
  if (WINTER_NPC_ALIASES[npcKey]) {
    return { actualNpcKey: WINTER_NPC_ALIASES[npcKey], inferredScenario: 'winter' };
  }
  return { actualNpcKey: npcKey, inferredScenario: null };
}
