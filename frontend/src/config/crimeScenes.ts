import type { CrimeSceneInfo } from '@/store/slices/types';

// Her evrenin 5 olay yeri; her vakada biri seçilir (backend scenarios/universes/*.ts crimeScenes ile aynı
// id ve adlar). Haritada görünmezler, alt çubuktaki "Olay Yeri" düğmesiyle açılırlar.
// Görseller: public/crime-scenes/<evren>/<id>_tidy.webp ve _messy.webp (istemler: docs/olay-yeri-gorselleri.md)
export const CRIME_SCENE_LABELS: Record<string, Record<string, string>> = {
  medieval: {
    well: 'Köy Kuyusu',
    bridge: 'Taş Köprü',
    forest_path: 'Orman Patikası',
    watchtower: 'Yıkık Gözcü Kulesi',
    stable: 'Terk Edilmiş Ahır',
  },
  modern: {
    laundromat: 'Çamaşırhane',
    bleachers: 'Lise Tribünleri',
    rail_crossing: 'Tren Geçidi',
    lake_dock: 'Göl İskelesi',
    drive_in: 'Kapanmış Açık Hava Sineması',
  },
  cyberpunk: {
    rooftop: 'Çatı Katı',
    metro: 'Metro Peronu',
    back_alley: 'Neon Arka Sokak',
    data_center: 'Terk Edilmiş Veri Merkezi',
    capsule_hotel: 'Kapsül Otel Koridoru',
  },
  china: {
    market_square: 'Pazar Meydanı',
    canal_bridge: 'Kanal Köprüsü',
    bamboo_grove: 'Bambu Korusu',
    dye_workshop: 'İpek Boyahanesi',
    lotus_pavilion: 'Lotus Köşkü',
  },
  winter: {
    frozen_pass: 'Donmuş Geçit',
    frozen_lake: 'Buzlu Göl',
    hunter_hut: 'Avcı Kulübesi',
    standing_stones: 'Taş Dikitler',
    storehouse: 'Erzak Ambarı',
  },
};

export function getCrimeSceneLabel(
  scenarioType: string,
  crimeScene: CrimeSceneInfo | null | undefined,
): string | null {
  if (!crimeScene) return null;
  return CRIME_SCENE_LABELS[scenarioType]?.[crimeScene.id] ?? null;
}

// Olay yerinin görseli: dağınık ya da düzenli hali. Görsel henüz yoksa ekran eski arka plana düşer.
export function getCrimeSceneImage(
  scenarioType: string,
  crimeScene: CrimeSceneInfo | null | undefined,
): string | null {
  if (!getCrimeSceneLabel(scenarioType, crimeScene)) return null;
  const state = crimeScene!.appearance === 'MESSY' ? 'messy' : 'tidy';
  return `/crime-scenes/${scenarioType}/${crimeScene!.id}_${state}.webp`;
}

// Bedenin görseldeki dikey yeri (0 üst, 1 alt), sadece beden karede aşağıda kalan görseller için.
// Sohbet penceresi ekranın alt kısmını kapattığından bu görseller daha fazla yukarı kaydırılır.
const CRIME_SCENE_FOCUS: Record<string, Record<string, number>> = {
  cyberpunk: { back_alley: 0.72, data_center: 0.66 },
  china: { dye_workshop: 0.72, bamboo_grove: 0.65, canal_bridge: 0.62 },
};

// Bedenin ekranda durması istenen yükseklik (sohbet penceresinin üstü)
const FOCUS_TARGET = 0.42;
const DEFAULT_SHIFT = 0.2;
// Daha fazlası görseli fazla büyütür ve bulanıklaştırır
const MAX_SHIFT = 0.6;

// Görselin ne kadar yukarı kaydırılacağı (çerçeve yüksekliğinin oranı). Görsel çerçeveden bu oran kadar
// uzun çizilir ve üstü kırpılır: görseldeki y noktası ekranda (1 + kayma) * y - kayma yüksekliğine düşer.
export function getCrimeSceneShift(
  scenarioType: string,
  crimeScene: CrimeSceneInfo | null | undefined,
): number {
  const focus = crimeScene ? CRIME_SCENE_FOCUS[scenarioType]?.[crimeScene.id] : undefined;
  if (focus === undefined) return DEFAULT_SHIFT;
  const shift = (focus - FOCUS_TARGET) / (1 - focus);
  return Math.min(MAX_SHIFT, Math.max(DEFAULT_SHIFT, shift));
}
