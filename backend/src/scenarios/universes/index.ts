import type { ScenarioType, UniverseDefinition } from './types';
import { medievalUniverse } from './medieval';
import { modernUniverse } from './modern';
import { cyberpunkUniverse } from './cyberpunk';
import { chinaUniverse } from './china';
import { winterUniverse } from './winter';

export * from './types';
export * from './medieval';
export * from './modern';
export * from './cyberpunk';
export * from './china';
export * from './winter';

export const UNIVERSE_REGISTRY: Record<ScenarioType, UniverseDefinition> = {
  medieval: medievalUniverse,
  modern: modernUniverse,
  cyberpunk: cyberpunkUniverse,
  china: chinaUniverse,
  winter: winterUniverse,
};
