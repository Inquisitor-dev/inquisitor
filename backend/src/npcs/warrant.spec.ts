import { decideWarrants, isWarrantIssuer, warrantIssuersOf } from './warrant';

describe('isWarrantIssuer', () => {
  it('medieval ve china için church arama izni verir', () => {
    expect(isWarrantIssuer('medieval', 'church')).toBe(true);
    expect(isWarrantIssuer('china', 'church')).toBe(true);
    expect(isWarrantIssuer('medieval', 'tavern')).toBe(false);
  });

  it('modern ve cyberpunk için tavern (şerif/karakol) arama izni verir', () => {
    expect(isWarrantIssuer('modern', 'tavern')).toBe(true);
    expect(isWarrantIssuer('cyberpunk', 'tavern')).toBe(true);
    expect(isWarrantIssuer('modern', 'church')).toBe(false);
  });

  it('winter için graveyard ve church arama izni verir', () => {
    expect(isWarrantIssuer('winter', 'graveyard')).toBe(true);
    expect(isWarrantIssuer('winter', 'church')).toBe(true);
    expect(isWarrantIssuer('winter', 'mill')).toBe(false);
    expect(warrantIssuersOf('winter')).toEqual(['graveyard', 'church']);
    expect(warrantIssuersOf('bilinmeyen')).toEqual([]);
  });
});

describe('arama izni kararı (kod)', () => {
  const base = { warrantsIssued: 0, activeWarrants: [], usedWarrants: [] };

  it('seçilen mekân için izin verir', () => {
    expect(
      decideWarrants({ ...base, requestedLocationId: 'mill' }),
    ).toMatchObject({ outcome: 'GRANTED', granted: ['mill'], remainingAfter: 1 });
  });

  it('mekân seçilmediyse karar vermez: yazıyla istek izin vermez', () => {
    expect(decideWarrants({ ...base })).toBeNull();
    expect(decideWarrants({ ...base, requestedLocationId: null })).toBeNull();
  });

  it('izin zaten varsa ya da hak dolduysa izin vermez', () => {
    expect(
      decideWarrants({ ...base, activeWarrants: ['mill'], requestedLocationId: 'mill' })
        ?.outcome,
    ).toBe('ALREADY_HELD');
    expect(
      decideWarrants({ ...base, usedWarrants: ['mill'], requestedLocationId: 'mill' })
        ?.outcome,
    ).toBe('ALREADY_HELD');
    expect(
      decideWarrants({ ...base, warrantsIssued: 2, requestedLocationId: 'mill' })?.outcome,
    ).toBe('LIMIT_REACHED');
  });
});
