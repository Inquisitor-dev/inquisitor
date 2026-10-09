// Harita görselleri evrene ve günün saatine göre seçilir (0-1 sabah, 2-3 gün batımı, 4 gece).
// Harita sayfası ve geçiş ekranı aynı görseli kullanır; geçiş ekranı onu önceden yükler.
const MAP_BACKGROUNDS: Record<string, [morning: string, sunset: string, night: string]> = {
  modern: ['/map/town_map_morning.webp', '/map/town_map_sunset.webp', '/map/town_map_night.webp'],
  cyberpunk: ['/map/cyberpunk_map_morning.webp', '/map/cyberpunk_map_sunset.webp', '/map/cyberpunk_map_night.webp'],
  china: ['/map/china_morning.webp', '/map/china_sunset.webp', '/map/china_night.webp'],
  winter: ['/map/winter_morning.webp', '/map/winter_sunset.webp', '/map/winter_night.webp'],
  medieval: ['/map/village_map_morning.webp', '/map/village_map_sunset.webp', '/map/village_map.webp'],
};

export function getMapBackground(scenarioType: string | null | undefined, timeOfDay: number): string {
  const [morning, sunset, night] = MAP_BACKGROUNDS[scenarioType ?? ''] ?? MAP_BACKGROUNDS.medieval;
  if (timeOfDay <= 1) return morning;
  if (timeOfDay <= 3) return sunset;
  return night;
}

// Geçiş ekranında haritaya dönerken gösterilen yer adı
const MAP_NAMES: Record<string, string> = {
  modern: 'Millfield Kasabası',
  cyberpunk: 'Neon Prime',
  china: 'Jinling',
  winter: 'Frosthold',
  medieval: 'Ashenmoor',
};

export function getMapName(scenarioType: string | null | undefined): string {
  return MAP_NAMES[scenarioType ?? ''] ?? MAP_NAMES.medieval;
}

export const TIME_LABELS = ['Sabah', 'Öğlen', 'İkindi', 'Akşam', 'Gece'];
