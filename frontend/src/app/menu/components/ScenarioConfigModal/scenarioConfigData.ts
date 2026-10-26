export const UNIVERSE_IDS = ['medieval', 'modern', 'cyberpunk', 'china', 'winter'];
export const DIFFICULTY_IDS = ['easy', 'medium', 'hard'];

export const DIFFICULTY_DETAILS: Record<string, { label: string; level: number; suspects: number; desc: string }> = {
  easy: { label: 'Kolay', level: 1, suspects: 5, desc: 'Beş şüpheliyle klasik bir soruşturma. İlk vaka için ideal.' },
  medium: { label: 'Orta', level: 2, suspects: 6, desc: 'Altıncı bir şüpheli olaya karışır; ilişkiler ve yalanlar karmaşıklaşır.' },
  hard: { label: 'Zor', level: 3, suspects: 6, desc: 'Herkesin saklayacak bir şeyi var: daha sık kurulmuş tuzaklar, daha geniş eşkâller, daha geç kırılan şüpheliler.' },
};

export const STORY_DETAILS: Record<string, { title: string; era: string; desc: string }> = {
  medieval: {
    title: 'Ashenmoor',
    era: 'Karanlık Ortaçağ',
    desc: 'Engizisyon, batıl inanç ve sisli mezarlıklar. Her köylünün dualarının altında bir sır yatar.',
  },
  modern: {
    title: 'Oakhaven',
    era: "90'lar Amerikan Kasabası",
    desc: 'Yerel polis, cinayet dedektifleri ve ormanın kenarında birbirini koruyan şüpheli kasabalılar.',
  },
  cyberpunk: {
    title: 'Neon Prime',
    era: 'Distopik Cyberpunk',
    desc: 'Yozlaşmış mega şirketler, siber geliştirmeler ve hafızaların bile satılık olduğu tech-noir bir şehir.',
  },
  china: {
    title: 'Jinling',
    era: 'Antik Doğu / Feodal Hanedanlık',
    desc: 'Bambu korulukları, tapınaklar ve çay evleri. Hanedan entrikaları ve kadim sırlar.',
  },
  winter: {
    title: 'Frosthold',
    era: 'Kutup / Kar Fırtınası',
    desc: 'Buz tutmuş sığınaklar, gözetleme kuleleri ve donmuş cesetler. Soğukta saklanan tecrit edilmiş sırlar.',
  },
};

export const getMapImage = (story: string) => {
  switch (story) {
    case 'modern': return '/map/town_map_night.webp';
    case 'cyberpunk': return '/map/cyberpunk_map_night.webp';
    case 'china': return '/map/china_night.webp';
    case 'winter': return '/map/winter_night.webp';
    case 'medieval':
    default: return '/map/village_map.webp';
  }
};
