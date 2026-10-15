import { isExplicitWarrantRequest, isWarrantIssuer } from './warrant';

describe('isExplicitWarrantRequest', () => {
  const locations = ['Taverna', 'Kilise', 'Değirmen', 'Mezarlık'];

  it('arama izni ifadesini tanır', () => {
    expect(isExplicitWarrantRequest('Bana bir arama izni verir misiniz?', locations)).toBe(true);
  });

  it('Türkçe karakter farklarını tolere eder', () => {
    expect(isExplicitWarrantRequest('degirmeni arastirabilir miyim', locations)).toBe(true);
    expect(isExplicitWarrantRequest('Kiliseyi inceleyebilir miyim?', locations)).toBe(true);
  });

  it('alakasız genel diyalogları arama izni saymaz', () => {
    expect(isExplicitWarrantRequest('Dün gece saat onda neredeydin?', locations)).toBe(false);
    expect(isExplicitWarrantRequest('Cinayet hakkında ne biliyorsun?', locations)).toBe(false);
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
