import {
  buildClueRepairPrompt,
  culpritClueGivesAway,
  parseClueRepair,
} from './clue-repair-prompt.builder';

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
