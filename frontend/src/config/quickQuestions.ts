import type { ScenarioType } from '@/shared/types/scenario';

// Diyalog ekranındaki hazır sorular: her karaktere sorulabilecek genel sorgu cümleleri.
// Oyuncu bunları tek tıkla sorar; uzun uzun yazmak zorunda kalmaz.

export interface QuickQuestion {
  // Butonda görünen kısa ad
  label: string;
  // Karaktere gönderilen tam cümle
  text: string;
}

// Kasabanın adı bulunma eki ile ("Millfield'deki" gibi); ünlü uyumu elle yazıldı
const TOWN_LOCATIVE: Record<ScenarioType, string> = {
  medieval: "Ashenmoor'daki",
  modern: "Millfield'deki",
  cyberpunk: "Neon Prime'daki",
  china: "Jinling'deki",
  winter: "Frosthold'daki",
};

export function getQuickQuestions(params: {
  scenarioType: string;
  username: string | null;
}): QuickQuestion[] {
  const town = TOWN_LOCATIVE[params.scenarioType as ScenarioType] ?? TOWN_LOCATIVE.medieval;
  const introduction = params.username
    ? `Adım ${params.username}. ${town} cinayeti çözmek için gönderildim. Cinayetle ilgili ne biliyorsun?`
    : `${town} cinayeti çözmek için gönderildim. Cinayetle ilgili ne biliyorsun?`;

  return [
    { label: 'Kendini tanıt', text: introduction },
    { label: 'Kurbanı tanır mıydın?', text: 'Kurbanı tanır mıydın? Nasıl biriydi?' },
    { label: 'O gece neredeydin?', text: 'Cinayet gecesi neredeydin ve ne yapıyordun?' },
    {
      label: 'Garip bir şey gördün mü?',
      text: 'O gece olağandışı bir şey gördün ya da duydun mu?',
    },
    { label: 'Kurbanı en son ne zaman gördün?', text: 'Kurbanı en son ne zaman gördün?' },
    {
      label: 'Kurbanın düşmanı var mıydı?',
      text: 'Kurbanın düşmanı var mıydı? Ona kin besleyen biri var mıydı?',
    },
    { label: 'Kimden şüpheleniyorsun?', text: 'Sence bu cinayeti kim işlemiş olabilir?' },
    {
      label: 'Seni kim doğrulayabilir?',
      text: 'O gece seninle birlikte olan, söylediklerini doğrulayabilecek biri var mı?',
    },
    { label: 'Saklıyor musun?', text: 'Bana anlatmadığın bir şey var mı?' },
  ];
}
