/**
 * Inquisitor evren (senaryo) tipleri ve meta-verileri.
 */
export type ScenarioType = 'medieval' | 'modern' | 'cyberpunk' | 'china' | 'winter';

export interface ScenarioMeta {
  id: ScenarioType;
  name: string;
  sub: string;
  era: string;
  description: string;
  footstepsKey: ScenarioType;
}

export const SCENARIOS: Record<ScenarioType, ScenarioMeta> = {
  medieval: {
    id: 'medieval',
    name: 'Ashenmoor Köyü',
    sub: 'Engizisyon Mahkemesi',
    era: 'Ortaçağ',
    description: 'Sisli patikalar, çamurlu sokaklar ve bağnaz köylüler.',
    footstepsKey: 'medieval',
  },
  modern: {
    id: 'modern',
    name: 'Millfield Kasabası',
    sub: '90’lar Cinayet Masası',
    era: '1990’lar',
    description: 'Kasvetli kasaba, asfalt caddeler ve gizli sırlar.',
    footstepsKey: 'modern',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Prime',
    sub: 'Siber Dedektiflik',
    era: '2089',
    description: 'Neon ışıkları, ıslak sokaklar ve sibernetik suçlular.',
    footstepsKey: 'cyberpunk',
  },
  china: {
    id: 'china',
    name: 'Jinling',
    sub: 'Kadim Doğu Soruşturması',
    era: 'Hanedanlık',
    description: 'Taş avlular, tapınaklar ve fısıldayan ipek perdeler.',
    footstepsKey: 'china',
  },
  winter: {
    id: 'winter',
    name: 'Frosthold',
    sub: 'Kuzey Kalesi',
    era: 'Karanlık Kış',
    description: 'Buz tutmuş surlar, dondurucu kar ve donuk cesetler.',
    footstepsKey: 'winter',
  },
};

export const SCENARIO_TYPES: ScenarioType[] = [
  'medieval',
  'modern',
  'cyberpunk',
  'china',
  'winter',
];

export function isScenarioType(value: unknown): value is ScenarioType {
  return typeof value === 'string' && SCENARIO_TYPES.includes(value as ScenarioType);
}
