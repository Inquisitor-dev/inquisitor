export interface NpcProfile {
  name: string;
  title: string;
}

export const NPC_PROFILES_BY_SCENARIO: Record<string, Record<string, NpcProfile>> = {
  china: {
    tavern: { name: 'Lin Feng', title: 'Çay Ustası — Altın Lotus Çay Evi' },
    church: { name: 'Komutan Zhao', title: 'Muhafız Amiri — İmparatorluk Garnizonu' },
    graveyard: { name: 'Keşiş Huikang', title: 'Kadim Tapınak Bilgesi' },
    mill: { name: 'Usta Guan', title: 'Silah Ustası — Demirci Ocağı' },
    farm: { name: 'Mei Teyze', title: 'Balıkçı ve İskele Gözcüsü' },
    clinic: { name: 'Bilgin Song', title: 'Saray Eczacısı ve Hekim' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...' },
  },
  cyberpunk: {
    tavern: { name: 'Memur Kael Voss', title: 'Memur — Neon Prime Karakolu' },
    church: { name: 'Mirel Sato', title: 'Lokanta Sahibi — Static Spoon' },
    graveyard: { name: 'Brakk Coil', title: 'Siber Cerrah — Neon Prime Kliniği' },
    mill: { name: 'AURA-9', title: 'Usta Android — AURA Tamirhanesi' },
    farm: { name: 'Ash', title: 'Sokak Muhbiri — Gece Pazarı' },
    clinic: { name: 'Vera Nyx', title: 'Barmen — Velvet Static Bar' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...' },
  },
  winter: {
    tavern: { name: 'Torstein', title: 'Hancı — Ocak Ateşi Hanı' },
    church: { name: 'Kahin Valda', title: 'Kutsal Yürek Ağacının Bekçisi' },
    graveyard: { name: 'Komutan Bjorn', title: 'Kale Muhafızı — Gözcü Kalesi' },
    mill: { name: 'Madenci Durn', title: 'Terk Edilmiş Madenin Ustabaşısı' },
    farm: { name: 'Einar', title: 'Sur Nöbetçisi ve Okçu' },
    clinic: { name: 'Muhafız Kenneth', title: 'İnfaz ve Yargı Meydanı Çavuşu' },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...' },
  },
  modern: {
    tavern: { name: 'Şerif Dale Cooper', title: 'Polis Amiri — Karakolun Tek Kanunu' },
    church: { name: 'Gerald', title: 'Otel İşletmecisi — Millfield Oteli' },
    graveyard: { name: 'Randy Kowalski', title: 'Video Oyuncusu — Pixel Arcade Salonu' },
    mill: { name: 'Donna Perkins', title: 'Lokantacı — The Maple Cafe & Diner' },
    farm: { name: 'Earl Hutchins', title: 'Pompacı — Petrol İstasyonunun Bekçisi' },
    clinic: { name: 'David', title: "Barmen — David's Bar" },
    crime_scene: { name: 'Olay Yeri', title: 'Sessiz Tanıklar...' },
  },
  medieval: {
    tavern: { name: 'Kardeş Aldric', title: 'Hancı — Sırların Bekçisi' },
    church: { name: 'Peder Malachar', title: 'Rahip — İki Efendinin Hizmetkârı' },
    graveyard: { name: 'İhtiyar Silas', title: 'Mezarcı — Gerçeği Gömüp Saklayan' },
    mill: { name: 'Değirmenci Giles', title: 'Değirmenci — Rüzgârın Sırdaşı' },
    farm: { name: 'Çiftçi Edmund', title: 'Çiftçi — Toprağın ve Karanlığın Tanığı' },
    clinic: { name: 'Doktor Harland', title: 'Hekim — Soğuk Ellerin ve Gözlerin Sahibi' },
    crime_scene: { name: 'Cinayet Mahalli', title: 'Sessiz Tanıklar...' },
  },
};

export function getNpcProfile(npcKey: string, scenarioType?: string): NpcProfile | undefined {
  const map = NPC_PROFILES_BY_SCENARIO[scenarioType ?? 'medieval'] ?? NPC_PROFILES_BY_SCENARIO.medieval;
  return map[npcKey];
}

export interface SuspectOption {
  id: string;
  name: string;
  role: string;
}

const SCENARIO_SUSPECTS: Record<string, { base: SuspectOption[]; medium?: SuspectOption; hard?: SuspectOption }> = {
  modern: {
    base: [
      { id: 'tavern', name: 'Şerif Dale Cooper', role: 'Şerif' },
      { id: 'church', name: 'Gerald', role: 'Otel Sahibi' },
      { id: 'graveyard', name: 'Randy Kowalski', role: 'Video Oyuncusu' },
      { id: 'mill', name: 'Donna Perkins', role: 'Lokantacı' },
    ],
    medium: { id: 'farm', name: 'Earl Hutchins', role: 'Pompacı' },
    hard: { id: 'clinic', name: 'David', role: 'Barmen' },
  },
  cyberpunk: {
    base: [
      { id: 'tavern', name: 'Memur Kael Voss', role: 'Polis Memuru' },
      { id: 'church', name: 'Mirel Sato', role: 'Lokantacı' },
      { id: 'graveyard', name: 'Brakk Coil', role: 'Klinik Hekimi' },
      { id: 'mill', name: 'AURA-9', role: 'Tamirci Android' },
    ],
    medium: { id: 'farm', name: 'Ash', role: 'Pazar Satıcısı' },
    hard: { id: 'clinic', name: 'Vera Nyx', role: 'Barmen' },
  },
  china: {
    base: [
      { id: 'tavern', name: 'Lin Feng', role: 'Çay Evi Sahibi' },
      { id: 'church', name: 'Komutan Zhao', role: 'Garnizon Komutanı' },
      { id: 'graveyard', name: 'Keşiş Huikang', role: 'Tapınak Bilgesi' },
      { id: 'mill', name: 'Usta Guan', role: 'Demirci Ustası' },
    ],
    medium: { id: 'farm', name: 'Mei Teyze', role: 'Balıkçı İskelesi Gözcüsü' },
    hard: { id: 'clinic', name: 'Bilgin Song', role: 'Saray Eczacısı' },
  },
  winter: {
    base: [
      { id: 'tavern', name: 'Torstein', role: 'Hancı' },
      { id: 'church', name: 'Kahin Valda', role: 'Yürek Ağacı Bekçisi' },
      { id: 'graveyard', name: 'Komutan Bjorn', role: 'Kale Muhafızı' },
      { id: 'mill', name: 'Madenci Durn', role: 'Ustabaşı' },
    ],
    medium: { id: 'farm', name: 'Einar', role: 'Sur Muhafızı' },
    hard: { id: 'clinic', name: 'Muhafız Kenneth', role: 'Meydan Çavuşu' },
  },
  medieval: {
    base: [
      { id: 'tavern', name: 'Kardeş Aldric', role: 'Hancı' },
      { id: 'church', name: 'Peder Malachar', role: 'Rahip' },
      { id: 'graveyard', name: 'İhtiyar Silas', role: 'Mezarcı' },
      { id: 'mill', name: 'Değirmenci Giles', role: 'Değirmenci' },
    ],
    medium: { id: 'farm', name: 'Çiftçi Edmund', role: 'Çiftçi' },
    hard: { id: 'clinic', name: 'Doktor Harland', role: 'Doktor' },
  },
};

export function getSuspectsForScenario(scenarioType: string = 'medieval', difficulty: string = 'easy'): SuspectOption[] {
  const config = SCENARIO_SUSPECTS[scenarioType] ?? SCENARIO_SUSPECTS.medieval;
  // Sunucuyla aynı: kolay 5, orta ve zor 6 şüpheli (backend NPC_COUNT). Anahtar adları ("medium",
  // "hard") eski düzenden kaldı: beşinci ve altıncı şüpheliyi gösterir.
  const list = [...config.base];
  if (config.medium) list.push(config.medium);
  if ((difficulty === 'medium' || difficulty === 'hard') && config.hard) {
    list.push(config.hard);
  }
  return list;
}
