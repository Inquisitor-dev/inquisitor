import { foldTurkish } from './prompt-guard';

export function isExplicitWarrantRequest(
  userMessage: string,
  localizedLocationNames: string[],
): boolean {
  // Türkçe karakterler sadeleştirilir: "araştırabilir miyim" de "arastirabilir miyim" de tanınır
  const normalized = foldTurkish(userMessage)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const warrantPatterns = [
    /arama izni/,
    /izin verir misin/,
    /izin ver/,
    /izni ver/,
    /arama yapabilir miyim/,
    /arastirabilir miyim/,
    /inceleyebilir miyim/,
    /warrant/,
  ];

  const mentionsWarrantIntent = warrantPatterns.some((pattern) => pattern.test(normalized));
  const mentionsKnownLocation = localizedLocationNames.some((name) =>
    normalized.includes(foldTurkish(name)),
  );

  return mentionsWarrantIntent || (mentionsKnownLocation && normalized.includes('izin'));
}

export function isWarrantIssuer(scenarioType: string, npcId: string): boolean {
  if (scenarioType === 'medieval' || scenarioType === 'china') {
    return npcId === 'church';
  }
  if (scenarioType === 'modern' || scenarioType === 'cyberpunk') {
    return npcId === 'tavern';
  }
  if (scenarioType === 'winter') {
    return npcId === 'graveyard' || npcId === 'church';
  }
  return false;
}
