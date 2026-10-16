import {
  ABILITIES,
  AbilitySession,
  CHARACTER_IDS,
  abilitiesFor,
  availability,
  findAbility,
  parseAbilityState,
  recordUse,
} from './abilities';

const base: AbilitySession = {
  status: 'ACTIVE',
  characterId: 'kara_yargic',
  currentDay: 2,
  timeOfDay: 1,
  boardThoughtDay: 0,
  abilityState: null,
};

const ability = (id: string) => findAbility(id)!;
const session = (patch: Partial<AbilitySession>): AbilitySession => ({
  ...base,
  ...patch,
});

describe('yetenek tanımları', () => {
  it('her karakterin en az bir yeteneği var, yetenek id’leri benzersiz', () => {
    for (const id of CHARACTER_IDS)
      expect(abilitiesFor(id).length).toBeGreaterThan(0);
    expect(new Set(ABILITIES.map((a) => a.id)).size).toBe(ABILITIES.length);
  });

  it('bozuk durum JSON’u boş duruma düşer', () => {
    expect(parseAbilityState('x')).toEqual({ uses: {} });
    expect(parseAbilityState({ uses: { threat: 'dün', pulse: [1] } })).toEqual({
      uses: { pulse: [1] },
    });
  });
});

describe('availability', () => {
  it('etkisi henüz yazılmamış yetenekler kendi karakterinde de kullanılamaz', () => {
    const check = availability(
      session({ characterId: 'kar_kahini' }),
      ability('dream_reading'),
    );
    expect(check).toEqual({
      available: false,
      reason: 'Bu yetenek yakında aktif olacak.',
    });
  });

  it('günlük yetenek aynı gün ikinci kez kullanılamaz, ertesi gün kullanılır', () => {
    const used = recordUse({ uses: {} }, 'threat', 2);
    expect(
      availability(session({ abilityState: used }), ability('threat'))
        .available,
    ).toBe(false);
    expect(
      availability(
        session({ abilityState: used, currentDay: 3 }),
        ability('threat'),
      ).available,
    ).toBe(true);
  });

  it('vaka başı yetenek bir kez kullanılır', () => {
    const s = session({
      characterId: 'mavi_rozet',
      abilityState: recordUse({ uses: {} }, 'visor_lock', 1),
    });
    expect(availability(s, ability('visor_lock')).available).toBe(false);
    expect(availability(s, ability('pulse')).available).toBe(true);
  });

  it('başka karakterin yeteneği ve bitmiş vaka reddedilir', () => {
    expect(availability(session({}), ability('pulse')).available).toBe(false);
    expect(
      availability(session({ status: 'WON' }), ability('threat')).available,
    ).toBe(false);
  });

  it('pasif yetenek elle kullanılamaz', () => {
    expect(
      availability(session({ characterId: 'engizitor' }), ability('patience'))
        .available,
    ).toBe(false);
  });

  it('Kulis gece, Çatı Geçişi gündüz ve son gece kullanılamaz', () => {
    expect(
      availability(
        session({ characterId: 'sokak_kurdu', timeOfDay: 4 }),
        ability('backstage'),
      ).available,
    ).toBe(false);
    const raven = (patch: Partial<AbilitySession>) =>
      session({ characterId: 'neon_kuzgun', ...patch });
    expect(
      availability(raven({ timeOfDay: 3 }), ability('rooftop')).available,
    ).toBe(false);
    expect(
      availability(raven({ timeOfDay: 4 }), ability('rooftop')).available,
    ).toBe(true);
    expect(
      availability(raven({ timeOfDay: 4, currentDay: 4 }), ability('rooftop'))
        .available,
    ).toBe(false);
  });

  it('Veri Sızdırma o gün düşünüldüyse kullanılamaz', () => {
    const s = session({ characterId: 'kizil_devre', boardThoughtDay: 2 });
    expect(availability(s, ability('data_leak')).available).toBe(false);
    expect(
      availability({ ...s, boardThoughtDay: 1 }, ability('data_leak'))
        .available,
    ).toBe(true);
  });
});
