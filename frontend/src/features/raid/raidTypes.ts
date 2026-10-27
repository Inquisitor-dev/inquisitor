// Gece baskını (backend/src/personas/raid-session.ts raidView ile aynı biçim)

export type RaidRoom = 'BEDROOM' | 'KITCHEN' | 'HALLWAY' | 'DOORSTEP';
export type RaidOutcome = 'GOOD' | 'NEUTRAL' | 'BAD' | 'DEATH';

export interface RaidView {
  active: boolean;
  night?: number;
  room?: RaidRoom;
  roomName?: string;
  light?: boolean;
  holding?: 'NONE' | 'KNIFE' | 'GUN';
  turn?: number;
  maxTurns?: number;
  actions?: { id: string; label: string }[];
  log?: string[];
  outcome?: RaidOutcome | null;
}

export interface RaidActResponse {
  raid: RaidView;
  session: { currentDay: number; timeOfDay: number; status: string };
}
