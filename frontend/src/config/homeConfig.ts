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

const MEDIEVAL_HOME: PlayerHomeData = {
  scenarioType: 'medieval',
  name: 'Engizisyoncu Odası',
  subtitle: 'Mezarlığın Yanındaki Kulübe — Kapıyı Kilitle, Dosyalarına Dön',
  backgroundImage: '/backgrounds/home_medieval.webp',
  particleType: 'embers',
  lightingTone: 'warm-fire',
  character: { x: 55.5, y: 87, height: 0.68 },
  spots: [
    { action: 'bed', left: 1, top: 62, width: 37, height: 28, title: 'Yatak' },
    { action: 'board', left: 19, top: 24, width: 21.5, height: 37, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 59.5, top: 47, width: 14.5, height: 30, title: 'Yazı Masası' },
    { action: 'chest', left: 74.5, top: 59, width: 11, height: 26, title: 'Sandık' },
    { action: 'door', left: 87.5, top: 8, width: 10, height: 76, title: 'Kapı' },
  ],
};

const MODERN_HOME: PlayerHomeData = {
  scenarioType: 'modern',
  name: 'Kiralık Ev',
  subtitle: 'Maple Caddesi — Kasabanın Uyumadığı Gece',
  backgroundImage: '/backgrounds/home_modern.webp',
  particleType: 'dust',
  lightingTone: 'dim-amber',
  character: { x: 51, y: 88, height: 0.66 },
  spots: [
    { action: 'bed', left: 1, top: 52, width: 35, height: 44, title: 'Yatak' },
    { action: 'board', left: 22.5, top: 17, width: 19, height: 32, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 56, top: 43, width: 19, height: 31, title: 'Çalışma Masası' },
    { action: 'chest', left: 83, top: 72, width: 17, height: 28, title: 'Metal Sandık' },
    { action: 'door', left: 83.5, top: 8, width: 9.5, height: 63, title: 'Kapı' },
  ],
};

const CYBERPUNK_HOME: PlayerHomeData = {
  scenarioType: 'cyberpunk',
  name: 'Kapsül Daire',
  subtitle: 'Neon Prime — Yağmurun Hiç Dinmediği Oda',
  backgroundImage: '/backgrounds/home_cyberpunk.webp',
  particleType: 'dust',
  lightingTone: 'neon',
  character: { x: 50, y: 90, height: 0.67 },
  // Neon ışıkta sepya yerine hafif soğuk ton
  characterFilter: 'brightness(0.8) saturate(1.1) hue-rotate(-6deg) drop-shadow(0 0 18px rgba(0, 0, 0, 0.45))',
  spots: [
    { action: 'bed', left: 3, top: 10, width: 19, height: 80, title: 'Uyku Kapsülü' },
    { action: 'board', left: 25, top: 26, width: 19.5, height: 34, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 60, top: 28, width: 22, height: 36, title: 'Terminal' },
    { action: 'chest', left: 73.5, top: 64, width: 11.5, height: 23, title: 'Metal Kasa' },
    { action: 'door', left: 86.5, top: 12, width: 7.5, height: 77, title: 'Kapı' },
  ],
};

const CHINA_HOME: PlayerHomeData = {
  scenarioType: 'china',
  name: 'Avlu Evi',
  subtitle: 'Jinling — Fenerlerin Altında Bir Müfettiş Odası',
  backgroundImage: '/backgrounds/home_china.webp',
  particleType: 'dust',
  lightingTone: 'warm-fire',
  character: { x: 51.5, y: 88, height: 0.67 },
  spots: [
    { action: 'bed', left: 3.5, top: 6, width: 20, height: 82, title: 'Perdeli Yatak' },
    { action: 'board', left: 28, top: 27, width: 17.5, height: 36, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 59, top: 63, width: 15.5, height: 28, title: 'Yazı Masası' },
    { action: 'chest', left: 86, top: 61, width: 11, height: 30, title: 'Lake Sandık' },
    { action: 'door', left: 81, top: 15, width: 13, height: 46, title: 'Kapı' },
  ],
};

const WINTER_HOME: PlayerHomeData = {
  scenarioType: 'winter',
  name: 'Avcı Kulübesi',
  subtitle: 'Frosthold — Karın Kapıya Dayandığı Gece',
  backgroundImage: '/backgrounds/home_winter.webp',
  particleType: 'embers',
  lightingTone: 'warm-fire',
  character: { x: 50, y: 87, height: 0.65 },
  spots: [
    { action: 'bed', left: 7, top: 55, width: 37, height: 30, title: 'Postlu Yatak' },
    { action: 'board', left: 19.5, top: 23, width: 20.5, height: 32, title: 'Soruşturma Panosu' },
    { action: 'desk', left: 57.5, top: 46, width: 19, height: 25, title: 'Masa' },
    { action: 'chest', left: 84, top: 66, width: 16, height: 34, title: 'Sandık' },
    { action: 'door', left: 76.5, top: 20, width: 13, height: 46, title: 'Kapı' },
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
