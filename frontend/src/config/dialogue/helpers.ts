import { DIALOGUE_CONFIG } from './config';

export function getNpcDialoguePortrait(scenarioType: string = 'medieval', npcKey: string): string {
  const normScenario = scenarioType || 'medieval';
  const cfg = DIALOGUE_CONFIG[normScenario]?.[npcKey];

  // Özel olarak Lin Feng tanımlı
  if (normScenario === 'china' && npcKey === 'tavern') {
    return '/dialogue/china/lin_feng.webp';
  }

  if (cfg?.portraitImage) {
    return cfg.portraitImage;
  }

  // Varsayılan iç mekan veya arka plan fallback'leri
  if (normScenario === 'modern') {
    const modernFallbacks: Record<string, string> = {
      tavern: '/dialogue/modern/tavern.png',
      church: '/dialogue/modern/church.png',
      graveyard: '/dialogue/modern/graveyard.png',
      mill: '/dialogue/modern/mill.png',
      farm: '/dialogue/modern/farm.png?v=2',
      clinic: '/dialogue/modern/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.webp',
    };
    return modernFallbacks[npcKey] || `/dialogue/modern/${npcKey}.png`;
  }
  if (normScenario === 'china') {
    const chinaFallbacks: Record<string, string> = {
      tavern: '/dialogue/china/lin_feng.webp',
      church: '/dialogue/china/zhao.webp',
      graveyard: '/dialogue/china/huikang.webp',
      mill: '/dialogue/china/guan.webp',
      clinic: '/dialogue/china/song.webp',
      farm: '/backgrounds/interior_china_farm.webp',
      crime_scene: '/backgrounds/bg_crime_scene.webp',
    };
    return chinaFallbacks[npcKey] || `/dialogue/china/${npcKey}.webp`;
  }

  if (normScenario === 'cyberpunk') {
    const cpFallbacks: Record<string, string> = {
      tavern: '/dialogue/cyberpunk/tavern.png',
      church: '/dialogue/cyberpunk/church.png',
      graveyard: '/dialogue/cyberpunk/graveyard.png',
      mill: '/dialogue/cyberpunk/mill.png',
      farm: '/dialogue/cyberpunk/farm.png',
      clinic: '/dialogue/cyberpunk/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return cpFallbacks[npcKey] || `/dialogue/cyberpunk/${npcKey}.png`;
  }

  if (normScenario === 'winter') {
    const winterFallbacks: Record<string, string> = {
      tavern: '/dialogue/winter/tavern.png',
      church: '/dialogue/winter/church.png',
      graveyard: '/dialogue/winter/graveyard.png',
      mill: '/dialogue/winter/mill.png',
      farm: '/dialogue/winter/farm.png',
      clinic: '/dialogue/winter/clinic.png',
      crime_scene: '/backgrounds/bg_crime_scene.png',
    };
    return winterFallbacks[npcKey] || `/dialogue/winter/${npcKey}.png`;
  }

  // Medieval / fallback
  const medFallbacks: Record<string, string> = {
    tavern: '/dialogue/medieval/tavern.png',
    church: '/dialogue/medieval/church.png',
    graveyard: '/dialogue/medieval/graveyard.png',
    mill: '/dialogue/medieval/mill.png',
    farm: '/dialogue/medieval/farm.png',
    clinic: '/dialogue/medieval/clinic.png',
    crime_scene: '/backgrounds/bg_crime_scene.webp',
  };
  return medFallbacks[npcKey] || `/dialogue/medieval/${npcKey}.png`;
}

export function getNpcDialogueSuggestedQuestions(scenarioType: string = 'medieval', npcKey: string): string[] {
  const normScenario = scenarioType || 'medieval';
  const cfg = DIALOGUE_CONFIG[normScenario]?.[npcKey];
  if (cfg?.suggestedQuestions && cfg.suggestedQuestions.length > 0) {
    return cfg.suggestedQuestions;
  }
  return [
    'Cinayet hakkında ne biliyorsun?',
    'Cinayet saatinde neredeydin?',
    'Şüphelendiğin biri veya dikkat çeken bir olay var mı?',
  ];
}

export function getNpcDialogueGreeting(scenarioType: string = 'medieval', npcKey: string): string | null {
  const normScenario = scenarioType || 'medieval';
  return DIALOGUE_CONFIG[normScenario]?.[npcKey]?.greeting || null;
}
