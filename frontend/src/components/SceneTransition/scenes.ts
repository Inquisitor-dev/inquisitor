import { getMapBackground, getMapName, TIME_LABELS } from '@/config/mapBackgrounds';
import type { LocationInteriorData } from '@/config/interiorConfig';
import type { Scene } from './sceneStore';

// Sık kullanılan geçiş sahneleri

export function mapScene(
  scenarioType: string | null | undefined,
  timeOfDay: number,
  day: number,
  kicker = 'Haritaya dönüyorsun',
): Scene {
  return {
    kicker,
    title: getMapName(scenarioType),
    subtitle: `${TIME_LABELS[timeOfDay] ?? ''} · Gün ${day}`,
    image: getMapBackground(scenarioType, timeOfDay),
  };
}

export function interiorScene(interior: LocationInteriorData): Scene {
  return {
    kicker: 'Giriyorsun',
    title: interior.name,
    subtitle: interior.subtitle,
    image: interior.backgroundImage,
  };
}
