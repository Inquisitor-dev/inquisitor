import {
  buildClueRepairPrompt,
  buildTraceRepairPrompt,
  culpritClueGivesAway,
  parseClueRepair,
  placesIn,
  traceMissesFramed,
} from './clue-repair-prompt.builder';
import { mentions } from '../../npcs/case-statements';

describe('katilin mekân ipucu denetimi', () => {
  it('kan ya da cinayet aleti geçen ipucu cinayeti ele verir', () => {
    // Oyun testinde çıkan ipucu
    expect(
      culpritClueGivesAway(
        'Tavernanın arka odasındaki varillerin arkasına gizlenmiş, üzerinde kurumuş kan lekeleri olan ağır demirci çekici.',
        'Demirci çekici',
      ),
    ).toBe(true);
    expect(culpritClueGivesAway('Kanlı bir mendil.', undefined)).toBe(true);
    expect(
      culpritClueGivesAway('Mihrabın altında bir orak saklı.', 'Orak'),
    ).toBe(true);
  });

  it('motifi gösteren ipucu ve "kanıt", "kanepe" gibi kelimeler ele vermez', () => {
    expect(
      culpritClueGivesAway(
        'Tezgahın altındaki çekmecede, kurbana olan borcunu gösteren yırtık bir senet.',
        'Demirci çekici',
      ),
    ).toBe(false);
    expect(
      culpritClueGivesAway('Kanepenin altında borcunu kanıtlayan bir not.'),
    ).toBe(false);
  });

  it('onarım istemi saklanma yerini korumayı ve kanı, aleti yasaklar', () => {
    const prompt = buildClueRepairPrompt({
      scenarioType: 'medieval',
      place: 'Taverna',
      clue: 'Kanlı çekiç.',
      truthReveal: 'Aldric yaptı.',
      motiveLabel: 'Borç',
      weaponLabel: 'Demirci çekici',
    });
    expect(prompt).toContain('Keep the exact hiding spot inside Taverna');
    expect(prompt).toContain(
      'must NOT contain blood, the murder weapon (Demirci çekici)',
    );
    expect(prompt).toContain('(Borç)');
  });

  it('onarım cevabı ayrıştırılır; eksik alan reddedilir', () => {
    expect(
      parseClueRepair(
        '```json\n{"clue": "Bir senet.", "truthReveal": "Gerçek."}\n```',
      ),
    ).toEqual({ clue: 'Bir senet.', truthReveal: 'Gerçek.' });
    expect(parseClueRepair('{"clue": "Bir senet."}')).toBeNull();
    expect(parseClueRepair('yapamam')).toBeNull();
  });
});

describe('tuzak iz denetimi', () => {
  const framed = [
    { name: 'AURA-9', place: 'Tamirhane' },
    { name: 'Mirel Sato', place: 'Lokanta' },
  ];

  it('iz suçlanmak istenenlerden birini göstermiyorsa eksik olanı bulur', () => {
    // Oyun testinde çıkan iz
    const clue =
      "Çöp konteynerinin tabanına sıkıştırılmış, üzerinde AURA-9'un atölye serileşmesi bulunan yanık bir devre kartı.";
    expect(traceMissesFramed(clue, framed, mentions)).toEqual([framed[1]]);
  });

  it('kişinin adı ya da mekânı geçiyorsa iz onu gösterir', () => {
    const clue =
      "AURA-9'un devre kartı ve Lokanta'nın tork anahtarından kopmuş bir parça.";
    expect(traceMissesFramed(clue, framed, mentions)).toEqual([]);
  });

  it('onarım istemi herkesi işaret etmeyi ve katili adlandırmamayı ister', () => {
    const prompt = buildTraceRepairPrompt({
      scenarioType: 'cyberpunk',
      clue: 'Bir devre kartı.',
      truthReveal: 'Gerçek.',
      framed,
    });
    expect(prompt).toContain('AURA-9 (Tamirhane) and Mirel Sato (Lokanta)');
    expect(prompt).toContain('Never name the murderer');
  });
});

describe('mazeretteki mekânlar', () => {
  const labels = {
    clinic: 'Revir',
    mill: 'Değirmen',
    farm: 'Sokak Pazarı',
  };
  it('mekân adı kelime başında geçiyorsa sayılır; çok kelimeli adın hepsi gerekir', () => {
    expect([...placesIn('Revirin arka odasındaydık.', labels)]).toEqual([
      'clinic',
    ]);
    expect([...placesIn("Sokak Pazarı'nda hesap yaptık.", labels)]).toEqual([
      'farm',
    ]);
    // Yalnız "sokak" yetmez
    expect(placesIn('Sokakta yürüyordum.', labels).size).toBe(0);
  });

  it('tamlama ekini ve ünsüz yumuşamasını tanır (pilotta kaçan çelişki)', () => {
    const china = {
      graveyard: 'Kadim Tapınak',
      farm: 'Balıkçı İskelesi',
      mill: 'Demirci Ocağı',
      church: 'Muhafız Karargahı',
      tavern: 'Çay Evi & Han',
    };
    expect([
      ...placesIn(
        'Kadim tapınağın ana sunağının önünde birlikte dua ediyorduk.',
        china,
      ),
    ]).toEqual(['graveyard']);
    expect([
      ...placesIn('Nehir kenarındaki balıkçı iskelemde ağ onarıyordum.', china),
    ]).toEqual(['farm']);
    expect([...placesIn('Demirci ocakta körüğü harlıyordu.', china)]).toEqual([
      'mill',
    ]);
    // Unvan olan kelimeler de mekân adında sayılır
    expect([
      ...placesIn('Muhafız karargâhında mühürleri sayıyorduk.', china),
    ]).toEqual(['church']);
    expect([...placesIn('Çay evinde oturuyordum.', china)]).toEqual(['tavern']);
  });

  it('kısa adlar başka bir kelimenin başı olunca sayılmaz', () => {
    const labels = { clinic: 'Bar', farm: 'Sur' };
    expect([...placesIn("Bar'da içiyordum.", labels)]).toEqual(['clinic']);
    expect(placesIn('Barınakta uyuyordum.', labels).size).toBe(0);
    expect([...placesIn('Surun dibinde nöbetteydim.', labels)]).toEqual([
      'farm',
    ]);
    expect(placesIn('Suratını gördüm.', labels).size).toBe(0);
  });
});
