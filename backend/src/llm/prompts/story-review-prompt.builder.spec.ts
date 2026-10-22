import {
  MAX_STORY_ISSUES,
  buildStoryReviewPrompt,
  parseStoryReview,
} from './story-review-prompt.builder';
import { storyReviewFields } from '../../stories/story-review';
import { CLEAN_REVIEW_CASE } from '../../stories/review-fixtures';

const fields = storyReviewFields(CLEAN_REVIEW_CASE);

describe('buildStoryReviewPrompt', () => {
  const prompt = buildStoryReviewPrompt(CLEAN_REVIEW_CASE, fields);

  it('vaka gerçeklerini ve kadronun rollerini verir', () => {
    expect(prompt).toContain('Katil: Değirmenci Giles');
    expect(prompt).toContain('Cinayet aleti: Orak');
    expect(prompt).toContain('Ölüm saati: Gece yarısı civarı');
    expect(prompt).toContain('Kesici ya da delici bir aletle');
    expect(prompt).toContain('Olay yeri: Taş Köprü');
    expect(prompt).toContain(
      'bilerek şu şüphelilerin hepsine uyar: Değirmenci Giles, İhtiyar Silas',
    );
    expect(prompt).toContain('Değirmenci Giles [npcPrompts.mill]: KATİL');
    expect(prompt).toContain(
      'Kardeş Aldric [npcPrompts.tavern]: masum, Bilmeden yardım etti (Değirmenci Giles). Silahı kime verdiğini çok iyi bilir',
    );
  });

  it('bütün metinleri alan anahtarıyla verir', () => {
    for (const [field, text] of Object.entries(fields)) {
      expect(prompt).toContain(`[${field}]\n${text}`);
    }
  });

  it('kodun denetlediği kuralları hakeme bildirtmez', () => {
    expect(prompt).toContain('DO NOT REPORT');
    expect(prompt).toContain(
      'the witness description fitting several suspects',
    );
    expect(prompt).toContain(
      "the culprit's npcPrompt containing the whole truth",
    );
  });
});

describe('parseStoryReview', () => {
  const reply = (issues: unknown[]) => JSON.stringify({ issues });

  it('geçerli bulguları okur, kesin olmayanı şüphe sayar', () => {
    const issues = parseStoryReview(
      `\`\`\`json\n${reply([
        {
          category: 'ROLE',
          severity: 'CERTAIN',
          field: 'npcPrompts.graveyard',
          quote: 'Saklayacak bir şeyin yok',
          note: 'Örnek not.',
        },
        {
          category: 'LOGIC',
          severity: 'maybe',
          field: 'truthReveal',
          quote: 'orakla Marta’nın boğazını kesti',
          note: 'Başka not.',
        },
      ])}\n\`\`\``,
      fields,
    );
    expect(issues).toEqual([
      {
        category: 'ROLE',
        severity: 'CERTAIN',
        field: 'npcPrompts.graveyard',
        quote: 'Saklayacak bir şeyin yok',
        note: 'Örnek not.',
        source: 'JUDGE',
      },
      expect.objectContaining({ category: 'LOGIC', severity: 'DOUBT' }),
    ]);
  });

  it('uydurma alıntıyı, bilinmeyen alanı ve kategoriyi atar', () => {
    const base = {
      category: 'TRUTH',
      severity: 'CERTAIN',
      field: 'truthReveal',
      quote: 'Giles',
      note: 'Not.',
    };
    expect(
      parseStoryReview(
        reply([
          { ...base, quote: 'ahırda hasta atına bakıyordu' },
          { ...base, field: 'npcPrompts.farm' },
          { ...base, category: 'STYLE' },
          { ...base, note: '  ' },
        ]),
        fields,
      ),
    ).toEqual([]);
  });

  it('en çok sınır kadar bulgu döndürür', () => {
    const many = Array.from({ length: MAX_STORY_ISSUES + 5 }, () => ({
      category: 'LANGUAGE',
      severity: 'DOUBT',
      field: 'truthReveal',
      quote: 'Giles',
      note: 'Not.',
    }));
    expect(parseStoryReview(reply(many), fields)).toHaveLength(
      MAX_STORY_ISSUES,
    );
  });

  it('gerçek metni bulgusu kesin denmiş olsa da şüphe sayılır', () => {
    expect(
      parseStoryReview(
        reply([
          {
            category: 'TRUTH',
            severity: 'CERTAIN',
            field: 'truthReveal',
            quote: 'Giles',
            note: 'Not.',
          },
        ]),
        fields,
      ),
    ).toEqual([expect.objectContaining({ severity: 'DOUBT' })]);
  });

  it('çalışma kâğıdı bozuksa sondaki bulgu listesini yine okur', () => {
    const broken = `{"worksheet":{"innocents":[{"match":false}],\\"truthEvidence":[]},"issues":${JSON.stringify(
      [
        {
          category: 'TRUTH',
          severity: 'CERTAIN',
          field: 'truthReveal',
          quote: 'Giles',
          note: 'Not.',
        },
      ],
    )}}`;
    expect(parseStoryReview(broken, fields)).toEqual([
      expect.objectContaining({ category: 'TRUTH', field: 'truthReveal' }),
    ]);
  });

  it('okunamayan cevapta null döner', () => {
    expect(parseStoryReview('Bir sorun göremedim.', fields)).toBeNull();
    expect(parseStoryReview('{"issues": "yok"}', fields)).toBeNull();
    expect(parseStoryReview('{bozuk', fields)).toBeNull();
  });
});
