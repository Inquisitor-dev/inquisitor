export interface InteriorHotspot {
  id: string;
  x: number; // Yüzde olarak yatay konum (0 - 100)
  y: number; // Yüzde olarak dikey konum (0 - 100)
  title: string;
  category: 'npc' | 'clue' | 'atmosphere' | 'passage';
  icon: string;
  summary: string;
  description: string;
  clueSnippet?: string;
  actionText?: string;
  actionHref?: string;
}

export interface LocationInteriorData {
  id: string;
  // Mekân seçim menüsünde görünen kısa ad
  menuLabel: string;
  name: string;
  subtitle: string;
  scenarioType: string;
  npcId?: string;
  npcName?: string;
  backgroundImage: string;
  particleType: 'embers' | 'dust' | 'fog' | 'rain' | 'snow';
  // neon: meşale yerine pembe-camgöbeği titreyen neon ışığı (cyberpunk)
  lightingTone: 'warm-fire' | 'cold-moon' | 'dim-amber' | 'eerie-green' | 'neon';
  initialPan?: number; // Başlangıç kamera açısı (geriye dönük uyumluluk için tutuluyor)
  hotspots: InteriorHotspot[];
}

