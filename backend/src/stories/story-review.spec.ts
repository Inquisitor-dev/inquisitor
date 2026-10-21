import {
  StoryIssue,
  decideStoryReview,
  findInternalIds,
  quoteIn,
  reviewStory,
  storyReviewFields,
} from './story-review';
import { CLEAN_REVIEW_CASE, REVIEW_FIXTURES } from './review-fixtures';

const issue = (patch: Partial<StoryIssue> = {}): StoryIssue => ({
  category: 'TRUTH',
  severity: 'DOUBT',
  field: 'truthReveal',
  quote: 'Giles',
  note: 'Not',
  source: 'JUDGE',
  ...patch,
});

describe('storyReviewFields', () => {
  it('bütün metinleri alan anahtarıyla toplar, boşları atar', () => {
    const fields = storyReviewFields({
      ...CLEAN_REVIEW_CASE,
      locationClues: { ...CLEAN_REVIEW_CASE.locationClues, farm: '  ' },
    });
    expect(Object.keys(fields)).toEqual(
      expect.arrayContaining([
        'scenario',
        'truthReveal',
        'verificationText',
        'witnessDescription',
        'alibis.tavern',
        'npcPrompts.mill',
        'locationClues.crime_scene',
      ]),
    );
    expect(fields).not.toHaveProperty('locationClues.farm');
  });
});

describe('findInternalIds', () => {
  it('temiz vakada iç kimlik bulmaz', () => {
    expect(findInternalIds(storyReviewFields(CLEAN_REVIEW_CASE))).toEqual([]);
  });

  it('mekân kimliğini, snake_case kimliği ve koddaki sabit adları bulur', () => {
    const issues = findInternalIds({
      a: "Gece 'mill' kimliğiyle bilinen değirmende.",
      b: 'Olay yeri crime_scene olarak kayıtlı.',
      c: 'Cinayet HURRIED tarzındaydı, saat MIDNIGHT.',
    });
    expect(issues.map((i) => [i.field, i.quote])).toEqual([
      ['a', 'mill'],
      ['b', 'crime_scene'],
      ['c', 'HURRIED'],
      ['c', 'MIDNIGHT'],
    ]);
    expect(issues.every((i) => i.severity === 'CERTAIN')).toBe(true);
    expect(issues.every((i) => i.source === 'CODE')).toBe(true);
  });

  it('kimliği içinde barındıran kelimeleri saymaz', () => {
    expect(
      findInternalIds({ a: 'Millfield kasabası, farmasötik bir koku.' }),
    ).toEqual([]);
  });
});

describe('quoteIn', () => {
  it('tırnak, boşluk ve Türkçe karakter farklarını yok sayar', () => {
    const text = 'Peder Malachar gece yarısı kilisede mum yakıyordu.';
    expect(quoteIn(text, '“gece  yarısı kilisede…”')).toBe(true);
    expect(quoteIn(text, 'GECE YARISI KİLİSEDE')).toBe(true);
  });

  it('metinde olmayan ya da boş alıntıyı kabul etmez', () => {
    expect(quoteIn('Kilisede mum yakıyordu.', 'ahırda atına bakıyordu')).toBe(
      false,
    );
    expect(quoteIn('Kilisede mum yakıyordu.', ' " ')).toBe(false);
  });
});

describe('decideStoryReview', () => {
  it('kesin bulgu varsa reddeder', () => {
    expect(
      decideStoryReview([issue(), issue({ severity: 'CERTAIN' })], true),
    ).toBe('REJECT');
  });

  it('yalnızca şüphe varsa ya da hakem çalışmadıysa insana bırakır', () => {
    expect(decideStoryReview([issue()], true)).toBe('HUMAN');
    expect(decideStoryReview([], false)).toBe('HUMAN');
  });

  it('hakem çalıştı ve bulgu yoksa geçer', () => {
    expect(decideStoryReview([], true)).toBe('PASS');
  });
});

describe('reviewStory', () => {
  it('kod bulgularını hakemin bulgularıyla birleştirir', async () => {
    const fixture = REVIEW_FIXTURES.find(
      (f) => f.id === 'language-internal-id',
    )!;
    const judge = jest.fn().mockResolvedValue([issue()]);
    const result = await reviewStory(fixture.input, judge);
    expect(judge).toHaveBeenCalledWith(
      fixture.input,
      storyReviewFields(fixture.input),
    );
    expect(result.issues.map((i) => i.source)).toEqual(['CODE', 'JUDGE']);
    expect(result).toMatchObject({ verdict: 'REJECT', judged: true });
  });

  it('hakem yoksa ya da başarısızsa karar insana kalır', async () => {
    expect(await reviewStory(CLEAN_REVIEW_CASE, null)).toEqual({
      verdict: 'HUMAN',
      issues: [],
      judged: false,
    });
    const failing = jest.fn().mockResolvedValue(null);
    expect((await reviewStory(CLEAN_REVIEW_CASE, failing)).verdict).toBe(
      'HUMAN',
    );
  });

  it('temiz vakada hakem bir şey bulmazsa geçer', async () => {
    const result = await reviewStory(
      CLEAN_REVIEW_CASE,
      jest.fn().mockResolvedValue([]),
    );
    expect(result.verdict).toBe('PASS');
  });
});

describe('review-fixtures', () => {
  it('her bozuk vaka temiz vakadan yalnızca beklenen alanda ayrılır', () => {
    const clean = storyReviewFields(CLEAN_REVIEW_CASE);
    for (const fixture of REVIEW_FIXTURES.filter((f) => f.field)) {
      const fields = storyReviewFields(fixture.input);
      const changed = Object.keys(fields).filter(
        (key) => fields[key] !== clean[key],
      );
      expect([fixture.id, changed]).toEqual([fixture.id, [fixture.field]]);
    }
  });

  it('kodun yakalaması gereken bozuk vakaları kod yakalar', () => {
    for (const fixture of REVIEW_FIXTURES.filter((f) => f.codeOnly)) {
      const found = findInternalIds(storyReviewFields(fixture.input));
      expect(found.map((i) => i.field)).toContain(fixture.field);
    }
  });
});
