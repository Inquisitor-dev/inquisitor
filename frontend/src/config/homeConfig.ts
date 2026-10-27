import type { LocationInteriorData } from './interiorConfig';

// Oyuncunun evindeki eşyalar. Her eşya, haritadaki eski "Evim" penceresindeki bir işlevi açar.
export type HomeActionId = 'bed' | 'desk' | 'chest' | 'board' | 'door';

export interface HomeSpot {
  action: HomeActionId;
  // Fareyle üzerine gelinen alan (görselin yüzdesi olarak)
  left: number;
  top: number;
  width: number;
  height: number;
  // Eşyanın adı (alanın üstünde, fare gelince görünür)
  title: string;
}

export interface PlayerHomeData {
  scenarioType: string;
  name: string;
  subtitle: string;
  backgroundImage: string;
  particleType: LocationInteriorData['particleType'];
  lightingTone: LocationInteriorData['lightingTone'];
  // Oyuncunun karakterinin durduğu yer: ayakların bastığı nokta (görselin yüzdesi)
  // ve karakterin boyu (görsel yüksekliğinin oranı olarak, 360° görselin bir karesinin yüksekliği)
  character: { x: number; y: number; height: number };
  // Karakterin odanın ışığına uyması için CSS filtresi (varsayılan: loş, sıcak ışık)
  characterFilter?: string;
  spots: HomeSpot[];
}

// Evin odaları (gece baskını bunlarda geçer); yatak odası aynı zamanda ev ekranının görseli
export type HomeRoom = 'bedroom' | 'kitchen' | 'hallway' | 'doorstep';

function homeRoomImage(scenarioType: string, room: HomeRoom): string {
  return `/backgrounds/home_${scenarioType}_${room}.webp`;
}

const MEDIEVAL_HOME: PlayerHomeData = {
  scenarioType: 'medieval',
  name: 'Engizisyoncu Odası',
  subtitle: 'Mezarlığın Yanındaki Kulübe — Kapıyı Kilitle, Dosyalarına Dön',
  backgroundImage: homeRoomImage('medieval', 'bedroom'),
  particleType: 'embers',
  lightingTone: 'warm-fire',
  character: { x: 55, y: 89, height: 0.68 },
  spots: [
    { action: 'bed', left: 12, top: 52, width: 27, height: 33, title: 'Yatak' },
    { action: 'board', left: 7.5, top: 16, width: 17, height: 35, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 65, top: 40, width: 18, height: 27, title: 'Yazı Masası' },
    { action: 'chest', left: 75.5, top: 68, width: 11.5, height: 18, title: 'Sandık' },
    { action: 'door', left: 88.5, top: 22, width: 9.5, height: 64, title: 'Kapı' },
  ],
};

const MODERN_HOME: PlayerHomeData = {
  scenarioType: 'modern',
  name: 'Kiralık Ev',
  subtitle: 'Maple Caddesi — Kasabanın Uyumadığı Gece',
  backgroundImage: homeRoomImage('modern', 'bedroom'),
  particleType: 'dust',
  lightingTone: 'dim-amber',
  character: { x: 55, y: 91, height: 0.66 },
  spots: [
    { action: 'bed', left: 19, top: 56, width: 32, height: 30, title: 'Yatak' },
    { action: 'board', left: 6, top: 2, width: 19, height: 47, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 60, top: 44, width: 21, height: 26, title: 'Çalışma Masası' },
    { action: 'chest', left: 70.5, top: 71, width: 13, height: 17, title: 'Metal Sandık' },
    { action: 'door', left: 85, top: 4, width: 11.5, height: 88, title: 'Kapı' },
  ],
};

const CYBERPUNK_HOME: PlayerHomeData = {
  scenarioType: 'cyberpunk',
  name: 'Kapsül Daire',
  subtitle: 'Neon Prime — Yağmurun Hiç Dinmediği Oda',
  backgroundImage: homeRoomImage('cyberpunk', 'bedroom'),
  particleType: 'dust',
  lightingTone: 'neon',
  character: { x: 47, y: 90, height: 0.67 },
  // Neon ışıkta sepya yerine hafif soğuk ton
  characterFilter: 'brightness(0.8) saturate(1.1) hue-rotate(-6deg) drop-shadow(0 0 18px rgba(0, 0, 0, 0.45))',
  spots: [
    { action: 'bed', left: 4, top: 14, width: 17, height: 74, title: 'Uyku Kapsülü' },
    { action: 'board', left: 26, top: 33, width: 11, height: 29, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 60, top: 38, width: 24, height: 34, title: 'Terminal' },
    { action: 'chest', left: 74.5, top: 74, width: 12, height: 16, title: 'Metal Kasa' },
    { action: 'door', left: 86.5, top: 20, width: 10.5, height: 74, title: 'Kapı' },
  ],
};

const CHINA_HOME: PlayerHomeData = {
  scenarioType: 'china',
  name: 'Avlu Evi',
  subtitle: 'Jinling — Fenerlerin Altında Bir Müfettiş Odası',
  backgroundImage: homeRoomImage('china', 'bedroom'),
  particleType: 'dust',
  lightingTone: 'warm-fire',
  character: { x: 46, y: 90, height: 0.67 },
  spots: [
    { action: 'bed', left: 1, top: 57, width: 32, height: 38, title: 'Yatak' },
    { action: 'board', left: 20.5, top: 24, width: 19.5, height: 32, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 65, top: 40, width: 22, height: 33, title: 'Yazı Masası' },
    { action: 'chest', left: 57, top: 62, width: 8, height: 18, title: 'Lake Sandık' },
    { action: 'door', left: 90, top: 10, width: 8, height: 75, title: 'Kapı' },
  ],
};

const WINTER_HOME: PlayerHomeData = {
  scenarioType: 'winter',
  name: 'Sur İçindeki Ev',
  subtitle: 'Frosthold — Karın Kapıya Dayandığı Gece',
  backgroundImage: homeRoomImage('winter', 'bedroom'),
  particleType: 'embers',
  lightingTone: 'warm-fire',
  character: { x: 45, y: 91, height: 0.65 },
  spots: [
    { action: 'bed', left: 3, top: 55, width: 36, height: 37, title: 'Postlu Yatak' },
    { action: 'board', left: 29.5, top: 32, width: 13, height: 22, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 68, top: 58, width: 20, height: 32, title: 'Masa' },
    { action: 'chest', left: 91.5, top: 75, width: 8.5, height: 25, title: 'Sandık' },
    { action: 'door', left: 89.5, top: 20, width: 8, height: 54, title: 'Kapı' },
  ],
};

// Evi hazırlanmış evrenler. Listede olmayan evrende haritadaki "Evim" penceresi açılır.
const HOMES_BY_SCENARIO: Record<string, PlayerHomeData> = {
  medieval: MEDIEVAL_HOME,
  modern: MODERN_HOME,
  cyberpunk: CYBERPUNK_HOME,
  china: CHINA_HOME,
  winter: WINTER_HOME,
};

export function getPlayerHome(scenarioType: string): PlayerHomeData | null {
  return HOMES_BY_SCENARIO[scenarioType] ?? null;
}

// Bir odanın görseli; evi hazırlanmamış evrende null
export function getHomeRoomImage(scenarioType: string, room: HomeRoom): string | null {
  return HOMES_BY_SCENARIO[scenarioType] ? homeRoomImage(scenarioType, room) : null;
}
