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
