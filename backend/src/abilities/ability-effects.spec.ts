import {
  archiveQuotes,
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
  const verificationAtMill = {
    verification: {
      kind: 'FLAW' as const,
      placement: { type: 'LOCATION' as const, locationId: 'mill' },
    },
  };

  it('bulunmamış doğrulayan kanıtın mekânını söyler', () => {
    expect(
      informantLocation({
        locationIds,
        searched: new Set(['tavern']),
        caseFacts: verificationAtMill,
        verificationFound: false,
        rng: () => 0,
      }),
    ).toBe('mill');
  });

  it('kanıt bulunduysa ya da orası arandıysa aranmamış başka mekânı söyler, olay yerini asla', () => {
    const pick = (searched: string[], verificationFound: boolean) =>
      informantLocation({
        locationIds,
        searched: new Set(searched),
        caseFacts: verificationAtMill,
        verificationFound,
        rng: () => 0,
      });
    expect(pick([], true)).toBe('tavern');
    expect(pick(['mill', 'tavern'], false)).toBe('church');
    expect(pick(['mill', 'tavern', 'church'], false)).toBeNull();
  });
});
