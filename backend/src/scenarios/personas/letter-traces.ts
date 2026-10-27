// Tehdit mektubundaki izler (v3). İz kodla seçilir, yapay zekâ yazmaz: Gemini denemesinde "ortak bir iz"
// istendiğinde bile 3 vakanın 2'sinde yalnızca katilin mesleğine uyan bir iz yazdı (pompacıda "benzin
// kokusu", karakol memurunda "karakol mürekkebi") ve mektup katili ele verdi. Her iz, evrenin üç şüphelisine
// uyar ve öbür üçüne uymaz; her şüpheli en az iki izde geçer, böylece katil kim olursa olsun bir iz bulunur.
// Şüpheli id'leri aynı zamanda mekânlarının id'sidir (scenarios/universes/*.ts).

export interface LetterTrace {
  // "kâğıtta …" diye başlayan kısa Türkçe tarif
  text: string;
  fits: [string, string, string];
}

export const LETTER_TRACES: Record<string, LetterTrace[]> = {
  // hancı, rahip, mezarcı, değirmenci, çiftçi, şifacı
  medieval: [
    { text: 'kâğıtta un ve tahıl tozu var', fits: ['mill', 'farm', 'tavern'] },
    {
      text: 'kâğıtta mum isi ve tütsü kokusu var',
      fits: ['church', 'graveyard', 'clinic'],
    },
    {
      text: 'kâğıdın kenarında kurumuş çamur ve toprak lekesi var',
      fits: ['graveyard', 'farm', 'mill'],
    },
    {
      text: 'kâğıtta ekşimiş şarap lekesi var',
      fits: ['tavern', 'church', 'clinic'],
    },
    {
      text: 'kâğıtta kurumuş ot ve yaprak kırıntıları var',
      fits: ['clinic', 'farm', 'church'],
    },
    {
      text: 'kâğıt yağlı ve ocak dumanı kokuyor',
      fits: ['tavern', 'farm', 'graveyard'],
    },
  ],
  // şerif, otel müdürü, oyun salonu sahibi, lokanta garsonu, pompacı, barmen
  modern: [
    {
      text: 'kâğıtta kahve fincanı halkası var',
      fits: ['tavern', 'mill', 'church'],
    },
    {
      text: 'kâğıt bayat sigara dumanı kokuyor',
      fits: ['clinic', 'graveyard', 'farm'],
    },
    {
      text: 'kâğıtta kızartma yağı lekesi var',
      fits: ['mill', 'clinic', 'graveyard'],
    },
    {
      text: 'kâğıtta hafif benzin ve araba yağı kokusu var',
      fits: ['farm', 'tavern', 'church'],
    },
    {
      text: 'kâğıtta yapışkan bir gazoz lekesi var',
      fits: ['graveyard', 'clinic', 'mill'],
    },
    {
      text: 'kâğıt bir makbuz destesinden koparılmış',
      fits: ['church', 'farm', 'clinic'],
    },
  ],
  // karakol memuru, erişte lokantası sahibi, sokak cerrahı, tamirci android, pazar satıcısı, barmen
  cyberpunk: [
    {
      text: 'kâğıtta makine yağı ve lehim kokusu var',
      fits: ['mill', 'graveyard', 'farm'],
    },
    {
      text: 'kâğıtta erişte suyu ve soya lekesi var',
      fits: ['church', 'farm', 'clinic'],
    },
    {
      text: 'kâğıt ucuz sentetik içki kokuyor',
      fits: ['clinic', 'farm', 'tavern'],
    },
    {
      text: 'kâğıtta steril eldiven pudrası var',
      fits: ['graveyard', 'church', 'mill'],
    },
    {
      text: 'kâğıt barkodlu kalın bir iş emri formundan yırtılmış',
      fits: ['tavern', 'mill', 'graveyard'],
    },
    {
      text: 'kâğıtta asit yağmurunun bıraktığı turuncu lekeler var, sokakta taşınmış gibi',
      fits: ['farm', 'tavern', 'church'],
    },
  ],
  // çay evi sahibi, muhafız komutanı, keşiş, demirci, balıkçı, şifacı-baharatçı
  china: [
    {
      text: 'kâğıtta yeşil çay lekesi var',
      fits: ['tavern', 'graveyard', 'clinic'],
    },
    {
      text: 'kâğıt tütsü ve ardıç kokuyor',
      fits: ['graveyard', 'clinic', 'church'],
    },
    {
      text: 'kâğıtta demir pası ve kömür isi var',
      fits: ['mill', 'church', 'farm'],
    },
    {
      text: 'kâğıt nehir suyu ve balık kokuyor',
      fits: ['farm', 'tavern', 'clinic'],
    },
    {
      text: 'kâğıdın kenarında kırmızı mühür mürekkebi var',
      fits: ['church', 'clinic', 'tavern'],
    },
    {
      text: 'kâğıtta yağlı bir bez izi var, bir alet silinmiş gibi',
      fits: ['mill', 'church', 'farm'],
    },
  ],
  // hancı, Kutsal Ağaç'ın bekçisi, kale komutanı, madenci, kapı nöbetçisi, infaz gözetmeni
  winter: [
    {
      text: 'kâğıtta bira ve et yağı lekesi var',
      fits: ['tavern', 'farm', 'graveyard'],
    },
    {
      text: 'kâğıt reçine ve çam iğnesi kokuyor',
      fits: ['church', 'farm', 'mill'],
    },
    {
      text: 'kâğıtta kömür tozu ve demir pası var',
      fits: ['mill', 'graveyard', 'clinic'],
    },
    {
      text: 'kâğıt çizgili bir nöbet defterinden koparılmış',
      fits: ['graveyard', 'farm', 'clinic'],
    },
    {
      text: 'kâğıt kurumuş şifalı ot ve mum kokuyor',
      fits: ['church', 'tavern', 'clinic'],
    },
    {
      text: 'kâğıtta erimiş kar suyu lekeleri ve deri eldiven izi var',
      fits: ['mill', 'church', 'tavern'],
    },
  ],
};

export const letterTracesFor = (scenarioType: string) =>
  LETTER_TRACES[scenarioType] ?? LETTER_TRACES.medieval;
