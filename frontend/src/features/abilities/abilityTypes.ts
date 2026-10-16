// Sunucudaki yetenek tanımlarıyla aynı (backend src/abilities/abilities.ts)

export type AbilityId =
  | 'patience'
  | 'archive_summary'
  | 'backstage'
  | 'contradiction_scan'
  | 'informant'
  | 'quiet_room'
  | 'threat'
  | 'tracking'
  | 'data_leak'
  | 'pulse'
  | 'visor_lock'
  | 'rooftop'
  | 'second_breath'
  | 'deep_reflection'
  | 'dream_reading'
  | 'keen_eye'
  | 'verify_quote';

export interface AbilityInfo {
  id: AbilityId;
  name: string;
  limit: 'DAILY' | 'CASE' | 'PASSIVE';
  target: 'npc' | 'location' | 'string' | 'none';
  available: boolean;
  // Kullanılamıyorsa sebebi
  reason: string | null;
}

export interface AbilityState {
  uses: Partial<Record<AbilityId, number[]>>;
  quietRoom?: { npcId: string; day: number };
  visorLockNpcId?: string;
  rooftop?: { locationId: string; day: number };
  lostMorningDay?: number;
}

export interface PulseRow {
  npcId: string;
  name: string;
  level: number;
  toThreshold: number;
}

export interface AbilityResult {
  message: string;
  notes?: string;
  fear?: { npcId: string; level: number; band: string };
  pulse?: PulseRow[];
  locationId?: string;
  board?: unknown;
  verdict?: 'CORRECT' | 'WRONG';
}

export interface UseAbilityInput {
  abilityId: AbilityId;
  npcId?: string;
  locationId?: string;
  stringId?: string;
  board?: unknown;
}

export const LIMIT_LABELS: Record<AbilityInfo['limit'], string> = {
  DAILY: 'Günde 1',
  CASE: 'Vakada 1',
  PASSIVE: 'Pasif',
};
