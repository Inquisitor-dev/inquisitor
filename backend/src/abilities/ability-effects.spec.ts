import {
  archiveQuotes,
  canThinkAgain,
  isDreamActive,
  thoughtLimit,
  thoughtsToday,
  chargedMessages,
  fearAfterNight,
  informantLocation,
  isFreeMessage,
  isQuietRoom,
  morningTimeOfDay,
  pulseReport,
  threatenedFear,
} from './ability-effects';

describe('Sabır', () => {
  it('Engizitör’de günün ilk 3 mesajı ücretsiz', () => {
    expect(isFreeMessage('engizitor', 0)).toBe(true);
    expect(isFreeMessage('engizitor', 2)).toBe(true);
    expect(isFreeMessage('engizitor', 3)).toBe(false);
    expect(isFreeMessage('kara_yargic', 0)).toBe(false);
  });

  it('soru hakkından düşen mesaj sayısı ücretsizleri saymaz', () => {
    expect(chargedMessages('engizitor', 2)).toBe(0);
    expect(chargedMessages('engizitor', 5)).toBe(2);
    expect(chargedMessages('mavi_rozet', 5)).toBe(5);
  });
});

describe('Tehdit', () => {
  it('korkuyu 2 artırır ama 6’yı geçirmez ve düşürmez', () => {
    expect(threatenedFear(0)).toBe(2);
    expect(threatenedFear(5)).toBe(6);
    expect(threatenedFear(6)).toBe(6);
    expect(threatenedFear(8)).toBe(8);
  });
});

describe('gece etkileri', () => {
  it('Vizör Kilidi’ndeki şüphelinin korkusu gece azalmaz', () => {
    const state = { uses: {}, visorLockNpcId: 'mill' };
    expect(fearAfterNight('mill', 5, state)).toBe(5);
    expect(fearAfterNight('tavern', 5, state)).toBe(4);
    expect(fearAfterNight('tavern', 0, state)).toBe(0);
  });

  it('Çatı Geçişi’nden sonraki gün sabahsız başlar', () => {
    const state = { uses: {}, lostMorningDay: 3 };
    expect(morningTimeOfDay(state, 3)).toBe(1);
    expect(morningTimeOfDay(state, 4)).toBe(0);
  });

  it('Sessiz Oda yalnızca o gün ve o şüphelide geçerli', () => {
    const state = { uses: {}, quietRoom: { npcId: 'mill', day: 2 } };
    expect(isQuietRoom(state, 'mill', 2)).toBe(true);
    expect(isQuietRoom(state, 'mill', 3)).toBe(false);
    expect(isQuietRoom(state, 'tavern', 2)).toBe(false);
  });
});

describe('Nabız ve Arşiv Özeti', () => {
  it('her şüphelinin eşiğe kalan puanını verir', () => {
    expect(
      pulseReport(['mill', 'tavern'], [{ npcId: 'mill', currentFear: 9 }]),
    ).toEqual([
      { npcId: 'mill', level: 9, toThreshold: 0 },
      { npcId: 'tavern', level: 0, toThreshold: 7 },
    ]);
  });

  it('son 3 cevabı kısaltarak alır', () => {
    const quotes = archiveQuotes(['a', 'b', ' c\n d ', 'x'.repeat(300)]);
    expect(quotes).toHaveLength(3);
    expect(quotes[0]).toBe('b');
    expect(quotes[1]).toBe('c d');
    expect(quotes[2].endsWith('…')).toBe(true);
  });
});

describe('Muhbir', () => {
  const locationIds = ['crime_scene', 'tavern', 'mill', 'church'];
  const pick = (searched: string[], roll: number) =>
    informantLocation({
      locationIds,
      searched: new Set(searched),
      rng: () => roll,
    });

  it('aranmamış mekânlardan rastgele birini söyler; her aranmamış mekân seçilebilir', () => {
    expect(pick([], 0)).toBe('tavern');
    expect(pick([], 0.5)).toBe('mill');
    expect(pick([], 0.99)).toBe('church');
  });

  it('aranmış mekânı ve olay yerini asla söylemez', () => {
    expect(pick(['mill', 'tavern'], 0)).toBe('church');
    expect(pick(['mill', 'tavern', 'church'], 0)).toBeNull();
  });
});

describe('Derin Tefekkür', () => {
  it('Ak Turna günde iki kez, diğer karakterler bir kez düşünür', () => {
    expect(thoughtLimit('ak_turna')).toBe(2);
    expect(thoughtLimit('kara_yargic')).toBe(1);
  });

  it('düşünme sayısı günlük sayaçtan ya da eski boardThoughtDay kaydından okunur', () => {
    expect(thoughtsToday({ uses: {} }, 0, 2)).toBe(0);
    expect(thoughtsToday({ uses: {} }, 2, 2)).toBe(1);
    expect(
      thoughtsToday({ uses: {}, thoughts: { day: 2, count: 2 } }, 2, 2),
    ).toBe(2);
    expect(
      thoughtsToday({ uses: {}, thoughts: { day: 1, count: 2 } }, 1, 2),
    ).toBe(0);
  });

  it('ikinci düşünmeye izin verir, üçüncüye vermez', () => {
    const once = { uses: {}, thoughts: { day: 2, count: 1 } };
    const twice = { uses: {}, thoughts: { day: 2, count: 2 } };
    expect(canThinkAgain('ak_turna', once, 2, 2)).toBe(true);
    expect(canThinkAgain('ak_turna', twice, 2, 2)).toBe(false);
    expect(canThinkAgain('kara_yargic', once, 2, 2)).toBe(false);
  });
});

describe('Rüya Tabiri', () => {
  it('etki yalnızca kullanıldığı gün sürer', () => {
    expect(isDreamActive({ uses: {}, dreamDay: 2 }, 2)).toBe(true);
    expect(isDreamActive({ uses: {}, dreamDay: 2 }, 3)).toBe(false);
    expect(isDreamActive({ uses: {} }, 2)).toBe(false);
  });
});

describe('mizaca göre eşik', () => {
  it('Tehdit tavanı karakterin eşiğinin bir altıdır', () => {
    expect(threatenedFear(4, 6)).toBe(5);
    expect(threatenedFear(5, 8)).toBe(7);
    expect(threatenedFear(7, 8)).toBe(7);
  });

  it('Nabız eşiğe kalan puanı karakterin kendi eşiğiyle hesaplar', () => {
    const report = pulseReport(
      ['mill', 'tavern'],
      [
        { npcId: 'mill', currentFear: 5 },
        { npcId: 'tavern', currentFear: 5 },
      ],
      { mill: 6, tavern: 8 },
    );
    expect(report.map((r) => r.toThreshold)).toEqual([1, 3]);
  });
});
