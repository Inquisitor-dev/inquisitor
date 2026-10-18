import {
  decideWarrants,
  findRequestedLocations,
  isExplicitWarrantRequest,
  isWarrantIssuer,
} from './warrant';

describe('isExplicitWarrantRequest', () => {
  const locations = ['Taverna', 'Kilise', 'Değirmen', 'Mezarlık'];

  it('arama izni ifadesini tanır', () => {
    expect(
      isExplicitWarrantRequest('Bana bir arama izni verir misiniz?', locations),
    ).toBe(true);
  });

  it('Türkçe karakter farklarını tolere eder', () => {
    expect(
      isExplicitWarrantRequest('degirmeni arastirabilir miyim', locations),
    ).toBe(true);
    expect(
      isExplicitWarrantRequest('Kiliseyi inceleyebilir miyim?', locations),
    ).toBe(true);
  });

  it('alakasız genel diyalogları arama izni saymaz', () => {
    expect(
      isExplicitWarrantRequest('Dün gece saat onda neredeydin?', locations),
    ).toBe(false);
    expect(
      isExplicitWarrantRequest('Cinayet hakkında ne biliyorsun?', locations),
    ).toBe(false);
  });
});

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
  });
});

describe('arama izni kararı (kod)', () => {
  const locations = [
    { id: 'tavern', localizedName: 'Karakol', ownerName: 'Dale Cooper' },
    {
      id: 'farm',
      localizedName: 'Petrol İstasyonu',
      ownerName: 'Earl Hutchins',
    },
    { id: 'mill', localizedName: 'Değirmen', ownerName: 'Brother Aldric' },
  ];
  const base = { warrantsIssued: 0, activeWarrants: [], usedWarrants: [] };

  it('mekânın adıyla ya da sahibinin adıyla istenen yeri bulur, unvanları isim saymaz', () => {
    expect(
      findRequestedLocations('petrol istasyonunu aramak istiyorum', locations),
    ).toEqual(['farm']);
    expect(
      findRequestedLocations("Earl'ün dükkânını arayabilir miyim", locations),
    ).toEqual(['farm']);
    expect(findRequestedLocations('Aldric nerede', locations)).toEqual([
      'mill',
    ]);
    expect(findRequestedLocations('brother ne dedi', locations)).toEqual([]);

    const multiUniverseLocations = [
      { id: 'farm_cp', localizedName: 'Sokak Pazarı', ownerName: 'Ash' },
      { id: 'farm_cn', localizedName: 'Balıkçı İskelesi', ownerName: 'Mei Teyze' },
      { id: 'mill_wi', localizedName: 'Terk Edilmiş Maden', ownerName: 'Madenci Durn' },
    ];
    expect(
      findRequestedLocations("Ash'in tezgahını aramak istiyorum", multiUniverseLocations),
    ).toEqual(['farm_cp']);
    expect(
      findRequestedLocations("Mei'nin yerini arayabilir miyim", multiUniverseLocations),
    ).toEqual(['farm_cn']);
    expect(
      findRequestedLocations('teyze veya madenci ne dedi', multiUniverseLocations),
    ).toEqual([]);
  });

  it('açık istek ve mekân varsa izin verir', () => {
    expect(
      decideWarrants({
        ...base,
        userMessage: 'Değirmen için arama izni ver',
        locations,
      }),
    ).toMatchObject({
      outcome: 'GRANTED',
      granted: ['mill'],
      remainingAfter: 1,
    });
  });

  it('istek yoksa karar vermez', () => {
    expect(
      decideWarrants({
        ...base,
        userMessage: 'Değirmende ne oldu?',
        locations,
      }),
    ).toBeNull();
  });

  it('mekân söylenmezse, izin zaten varsa ya da hak dolduysa izin vermez', () => {
    expect(
      decideWarrants({
        ...base,
        userMessage: 'Arama izni verir misin?',
        locations,
      })?.outcome,
    ).toBe('NO_LOCATION');
    expect(
      decideWarrants({
        ...base,
        activeWarrants: ['mill'],
        userMessage: 'Değirmen için arama izni ver',
        locations,
      })?.outcome,
    ).toBe('ALREADY_HELD');
    expect(
      decideWarrants({
        ...base,
        warrantsIssued: 2,
        userMessage: 'Değirmen için arama izni ver',
        locations,
      })?.outcome,
    ).toBe('LIMIT_REACHED');
  });

  it('kalan haktan fazla mekân istenirse sadece hak kadarını verir', () => {
    expect(
      decideWarrants({
        ...base,
        warrantsIssued: 1,
        userMessage: 'Değirmen ve petrol istasyonu için arama izni ver',
        locations,
      }),
    ).toMatchObject({
      outcome: 'GRANTED',
      granted: ['farm'],
      remainingAfter: 0,
    });
  });
});
