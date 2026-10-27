// Hüküm Dosyası evrene göre farklı bir dosyaya bürünür: ortaçağda mühürlü parşömen, modernde manila
// klasör, cyberpunk'ta kısıtlı erişimli kayıt. Renkler SCSS'te (data-theme), yazılar burada.

export interface DossierTheme {
  // Dosyayı düzenleyen makam (kâğıdın en üstünde)
  office: string;
  // Kâğıdın köşesine basılmış damga
  classification: string;
  // Mühürlenince basılan damganın yazısı
  sealText: string;
}

const THEMES: Record<string, DossierTheme> = {
  medieval: {
    office: 'Ashenmoor Engizisyon Mahkemesi',
    classification: 'Mühürlü',
    sealText: 'Hüküm Verildi',
  },
  modern: {
    office: 'Millfield Şerifliği · Cinayet Masası',
    classification: 'Gizli',
    sealText: 'Dosya Kapandı',
  },
  cyberpunk: {
    office: 'Neon Prime Güvenlik Birimi',
    classification: 'Kısıtlı Erişim',
    sealText: 'Kayıt Kilitlendi',
  },
  china: {
    office: 'Jinling Vali Konağı Divanı',
    classification: 'Mahrem',
    sealText: 'Hüküm Verildi',
  },
  winter: {
    office: 'Frosthold Muhafız Karakolu',
    classification: 'Gizli',
    sealText: 'Hüküm Verildi',
  },
};

export function getDossierTheme(scenarioType: string | null | undefined): DossierTheme {
  return THEMES[scenarioType ?? ''] ?? THEMES.medieval;
}

// Uzun seçenekler ("Susturmak: kurban onun bir sırrını biliyordu") kâğıda kısa adıyla yazılır;
// açıklaması seçim listesinde kalır
export function shortLabel(label: string): string {
  const head = label.split(':')[0].trim();
  return head || label;
}
