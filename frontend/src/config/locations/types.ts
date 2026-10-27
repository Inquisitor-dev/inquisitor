export interface MapLocation {
  id: string;
  name: string;
  top: string;
  left: string;
  width: string;
  height: string;
  available: boolean;
  minDifficulty?: 'easy' | 'medium' | 'hard';
}
