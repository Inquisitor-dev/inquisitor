export interface NpcProfile {
  name: string;
  title: string;
  icon: string;
}

export const NPC_PROFILES_BY_SCENARIO: Record<string, Record<string, NpcProfile>> = {
  china: {
    tavern: { name: 'Lin Feng', title: 'Çay Ustası — Altın Lotus Çay Evi', icon: '🍵' },
    church: { name: 'Komutan Zhao', title: 'Muhafız Amiri — İmparatorluk Garnizonu', icon: '🏯' },
    graveyard: { name: 'Keşiş Huikang', title: 'Kadim Tapınak Bilgesi', icon: '⛩️' },
    mill: { name: 'Usta Guan', title: 'Silah Ustası — Demirci Ocağı', icon: '⚒️' },
    farm: { name: 'Mei Teyze', title: 'Balıkçı ve İskele Gözcüsü', icon: '🎣' },
    clinic: { name: 'Bilgin Song', title: 'Saray Eczacısı ve Hekim', icon: '🌿' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
  },
  cyberpunk: {
    tavern: { name: 'Memur Kael Voss', title: 'Memur — Neon Prime Karakolu', icon: '👮' },
    church: { name: 'Mirel Sato', title: 'Lokanta Sahibi — Static Spoon', icon: '🍜' },
    graveyard: { name: 'Brakk Coil', title: 'Siber Cerrah — Neon Prime Kliniği', icon: '🏥' },
    mill: { name: 'AURA-9', title: 'Usta Android — AURA Tamirhanesi', icon: '🛠️' },
    farm: { name: 'Ash', title: 'Sokak Muhbiri — Gece Pazarı', icon: '🏮' },
    clinic: { name: 'Vera Nyx', title: 'Barmen — Velvet Static Bar', icon: '🍸' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
  },
  winter: {
    tavern: { name: 'Torstein', title: 'Hancı — Ocak Ateşi Hanı', icon: '🔥' },
    church: { name: 'Kahin Valda', title: 'Kutsal Yürek Ağacının Bekçisi', icon: '🍁' },
    graveyard: { name: 'Komutan Bjorn', title: 'Kale Muhafızı — Gözcü Kalesi', icon: '🏰' },
    mill: { name: 'Madenci Durn', title: 'Terk Edilmiş Madenin Ustabaşısı', icon: '⛏️' },
    farm: { name: 'Einar', title: 'Sur Nöbetçisi ve Okçu', icon: '🛡️' },
    clinic: { name: 'Muhafız Kenneth', title: 'İnfaz ve Yargı Meydanı Çavuşu', icon: '⚔️' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
  },
  modern: {
    tavern: { name: 'Şerif Dale Cooper', title: 'Polis Amiri — Karakolun Tek Kanunu', icon: '🚔' },
    church: { name: 'Gerald', title: 'Otel İşletmecisi — Millfield Oteli', icon: '🏨' },
    graveyard: { name: 'Randy Kowalski', title: 'Video Oyuncusu — Pixel Arcade Salonu', icon: '🎮' },
    mill: { name: 'Donna Perkins', title: 'Lokantacı — The Maple Cafe & Diner', icon: '🍽️' },
    farm: { name: 'Earl Hutchins', title: 'Pompacı — Petrol İstasyonunun Bekçisi', icon: '⛽' },
    clinic: { name: 'David', title: "Barmen — David's Bar", icon: '🍺' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...', icon: '🩸' },
  },
  medieval: {
    tavern: { name: 'Kardeş Aldric', title: 'Hancı — Sırların Bekçisi', icon: '🍺' },
    church: { name: 'Peder Malachar', title: 'Rahip — İki Efendinin Hizmetkârı', icon: '⛪' },
    graveyard: { name: 'İhtiyar Silas', title: 'Mezarcı — Gerçeği Gömüp Saklayan', icon: '🪦' },
    mill: { name: 'Değirmenci Giles', title: 'Değirmenci — Rüzgârın Sırdaşı', icon: '⚙️' },
    farm: { name: 'Çiftçi Edmund', title: 'Çiftçi — Toprağın ve Karanlığın Tanığı', icon: '🌾' },
    clinic: { name: 'Doktor Harland', title: 'Hekim — Soğuk Ellerin ve Gözlerin Sahibi', icon: '🏥' },
    crime_scene: { name: 'Cinayet Mahalli', title: 'Sessiz Tanıklar...', icon: '🩸' },
  },
};

export function getNpcProfile(npcKey: string, scenarioType?: string): NpcProfile | undefined {
  const map = NPC_PROFILES_BY_SCENARIO[scenarioType ?? 'medieval'] ?? NPC_PROFILES_BY_SCENARIO.medieval;
  return map[npcKey];
}

export interface SuspectOption {
  id: string;
  name: string;
  icon: string;
  role: string;
}

const SCENARIO_SUSPECTS: Record<string, { base: SuspectOption[]; medium?: SuspectOption; hard?: SuspectOption }> = {
  modern: {
    base: [
      { id: 'tavern', name: 'Şerif Dale Cooper', icon: '🚔', role: 'Şerif' },
      { id: 'church', name: 'Gerald', icon: '🏨', role: 'Otel Sahibi' },
      { id: 'graveyard', name: 'Randy Kowalski', icon: '🎮', role: 'Video Oyuncusu' },
      { id: 'mill', name: 'Donna Perkins', icon: '🍽️', role: 'Lokantacı' },
    ],
    medium: { id: 'farm', name: 'Earl Hutchins', icon: '⛽', role: 'Pompacı' },
    hard: { id: 'clinic', name: 'David', icon: '🍺', role: 'Barmen' },
  },
  cyberpunk: {
    base: [
      { id: 'tavern', name: 'Memur Kael Voss', icon: '👮', role: 'Polis Memuru' },
      { id: 'church', name: 'Mirel Sato', icon: '🍜', role: 'Lokantacı' },
      { id: 'graveyard', name: 'Brakk Coil', icon: '🏥', role: 'Klinik Hekimi' },
      { id: 'mill', name: 'AURA-9', icon: '🛠️', role: 'Tamirci Android' },
    ],
    medium: { id: 'farm', name: 'Ash', icon: '🏮', role: 'Pazar Satıcısı' },
    hard: { id: 'clinic', name: 'Vera Nyx', icon: '🍸', role: 'Barmen' },
  },
  china: {
    base: [
      { id: 'tavern', name: 'Lin Feng', icon: '🍵', role: 'Çay Evi Sahibi' },
      { id: 'church', name: 'Komutan Zhao', icon: '🏯', role: 'Garnizon Komutanı' },
      { id: 'graveyard', name: 'Keşiş Huikang', icon: '⛩️', role: 'Tapınak Bilgesi' },
      { id: 'mill', name: 'Usta Guan', icon: '⚒️', role: 'Demirci Ustası' },
    ],
    medium: { id: 'farm', name: 'Mei Teyze', icon: '🎣', role: 'Balıkçı İskelesi Gözcüsü' },
    hard: { id: 'clinic', name: 'Bilgin Song', icon: '🌿', role: 'Saray Eczacısı' },
  },
  winter: {
    base: [
      { id: 'tavern', name: 'Torstein', icon: '🔥', role: 'Hancı' },
      { id: 'church', name: 'Kahin Valda', icon: '🍁', role: 'Yürek Ağacı Bekçisi' },
      { id: 'graveyard', name: 'Komutan Bjorn', icon: '🏰', role: 'Kale Muhafızı' },
      { id: 'mill', name: 'Madenci Durn', icon: '⛏️', role: 'Ustabaşı' },
    ],
    medium: { id: 'farm', name: 'Einar', icon: '🛡️', role: 'Sur Muhafızı' },
    hard: { id: 'clinic', name: 'Muhafız Kenneth', icon: '⚔️', role: 'Meydan Çavuşu' },
  },
  medieval: {
    base: [
      { id: 'tavern', name: 'Kardeş Aldric', icon: '🍺', role: 'Hancı' },
      { id: 'church', name: 'Peder Malachar', icon: '⛪', role: 'Rahip' },
      { id: 'graveyard', name: 'İhtiyar Silas', icon: '🪦', role: 'Mezarcı' },
      { id: 'mill', name: 'Değirmenci Giles', icon: '⚙️', role: 'Değirmenci' },
    ],
    medium: { id: 'farm', name: 'Çiftçi Edmund', icon: '🌾', role: 'Çiftçi' },
    hard: { id: 'clinic', name: 'Doktor Harland', icon: '🏥', role: 'Doktor' },
  },
};

export function getSuspectsForScenario(scenarioType: string = 'medieval', difficulty: string = 'easy'): SuspectOption[] {
  const config = SCENARIO_SUSPECTS[scenarioType] ?? SCENARIO_SUSPECTS.medieval;
  const list = [...config.base];
  if ((difficulty === 'medium' || difficulty === 'hard') && config.medium) {
    list.push(config.medium);
  }
  if (difficulty === 'hard' && config.hard) {
    list.push(config.hard);
  }
  return list;
}
