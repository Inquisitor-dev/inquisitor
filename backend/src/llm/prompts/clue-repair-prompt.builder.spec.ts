import {
  buildClueRepairPrompt,
  buildTraceRepairPrompt,
  culpritClueGivesAway,
  parseClueRepair,
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
