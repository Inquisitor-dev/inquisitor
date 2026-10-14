import type { NpcDialogueConfig } from './types';
import { CHINA_DIALOGUE } from './china';
import { MEDIEVAL_DIALOGUE } from './medieval';
import { CYBERPUNK_DIALOGUE } from './cyberpunk';
import { WINTER_DIALOGUE } from './winter';
import { MODERN_DIALOGUE } from './modern';

export const DIALOGUE_CONFIG: Record<string, Record<string, NpcDialogueConfig>> = {
  china: CHINA_DIALOGUE,
  medieval: MEDIEVAL_DIALOGUE,
  cyberpunk: CYBERPUNK_DIALOGUE,
  winter: WINTER_DIALOGUE,
  modern: MODERN_DIALOGUE,
};
