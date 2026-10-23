import {
  canApprove,
  parseReviewRecord,
  resolveStoryId,
  storySummary,
  withDecision,
} from './story-approval';
import type { StoryReviewRecord } from './story-generation';
import type { StoryPackage } from './story-package';
import { CLEAN_REVIEW_CASE } from './review-fixtures';

const record = (patch: Partial<StoryReviewRecord> = {}): StoryReviewRecord => ({
  validation: { valid: true, errors: [], warnings: [] },
  review: { verdict: 'HUMAN', issues: [], judged: true },
  tokens: { generation: 9000, review: 3500 },
  generatedAt: '2026-10-23T10:00:00.000Z',
  ...patch,
});

const { facts } = CLEAN_REVIEW_CASE;
const pkg: StoryPackage = {
  scenarioType: 'medieval',
  difficulty: 'easy',
  plan: facts,
  facts,
  draft: {
    scenario: CLEAN_REVIEW_CASE.scenario,
    truthReveal: CLEAN_REVIEW_CASE.truthReveal,
    culpritId: facts.culpritId,
    npcPrompts: CLEAN_REVIEW_CASE.npcPrompts,
    locationClues: CLEAN_REVIEW_CASE.locationClues,
  },
};

describe('parseReviewRecord', () => {
  it('üretim komutunun kaydını okur, başka biçimleri yok sayar', () => {
    expect(parseReviewRecord(record())).toEqual(record());
    expect(parseReviewRecord(null)).toBeNull();
    expect(parseReviewRecord({ verdict: 'PASS', issues: [] })).toBeNull();
  });
});

describe('canApprove', () => {
  it('taslağı onaylatır', () => {
    expect(canApprove('DRAFT', record())).toEqual({ ok: true });
  });

  it('kod doğrulamasından kalanı --force ile bile onaylatmaz', () => {
    const failed = record({
      validation: { valid: false, errors: ['Mekân ipucu yok.'], warnings: [] },
      review: null,
    });
    expect(canApprove('REJECTED', failed, true)).toEqual({
      ok: false,
      reason: 'Kod doğrulamasından kaldı: Mekân ipucu yok.',
    });
  });

  it('hakemin reddettiğini yalnızca --force ile onaylatır', () => {
    const rejected = record({
      review: { verdict: 'REJECT', issues: [], judged: true },
    });
    expect(canApprove('REJECTED', rejected).ok).toBe(false);
    expect(canApprove('REJECTED', rejected, true)).toEqual({ ok: true });
  });

  it('onaylıyı ve kaydı olmayanı onaylatmaz', () => {
    expect(canApprove('APPROVED', record()).ok).toBe(false);
    expect(canApprove('DRAFT', null).ok).toBe(false);
  });
});

describe('withDecision', () => {
  it('kararı kaydın geri kalanını koruyarak ekler', () => {
    const decision = {
      status: 'APPROVED' as const,
      by: 'Enes',
      note: 'Oynadım, akıcı.',
      at: '2026-10-23T12:00:00.000Z',
    };
    expect(withDecision(record(), decision)).toEqual({
      ...record(),
      decision,
    });
    expect(withDecision(null, decision)).toEqual({ decision });
  });
});

describe('resolveStoryId', () => {
  const ids = ['3f2a9c10-aaaa', '3f2b0000-bbbb', '9d00e1f2-cccc'];

  it('tek eşleşen öneki tam kimliğe çevirir', () => {
    expect(resolveStoryId('9d00', ids)).toEqual({ id: '9d00e1f2-cccc' });
  });

  it('eşleşme yoksa ya da birden fazlaysa hata verir', () => {
    expect(resolveStoryId('ffff', ids)).toHaveProperty('error');
    expect(resolveStoryId('3f2', ids)).toEqual({
      error: '"3f2" birden fazla hikâyeye uyuyor; daha uzun yaz.',
    });
  });
});

describe('storySummary', () => {
  const text = storySummary(pkg, record());

  it('vaka gerçeklerini ve rolleri okunur verir', () => {
    expect(text).toContain('Katil: Değirmenci Giles');
    expect(text).toContain('Kurban: Marta Vell (Tefeci)');
    expect(text).toContain('Silah: Orak');
    expect(text).toContain('Olay yeri: Taş Köprü (dağınık)');
    expect(text).toContain('- Değirmenci Giles [KATİL]');
    expect(text).toContain(
      '- Kardeş Aldric [masum · Bilmeden yardım etti (Değirmenci Giles)]',
    );
    expect(text).toContain(`Mazeret: ${facts.alibis.tavern}`);
  });

  it('oyuncunun okuyacağı metinleri ve ipuçlarını mekân adıyla verir', () => {
    expect(text).toContain(CLEAN_REVIEW_CASE.scenario);
    expect(text).toContain(CLEAN_REVIEW_CASE.truthReveal);
    expect(text).toContain(
      `- Olay yeri (Taş Köprü): ${CLEAN_REVIEW_CASE.locationClues.crime_scene}`,
    );
  });

  it('doğrulama, hakem, maliyet ve kararı ekler', () => {
    const decided = storySummary(
      pkg,
      withDecision(record(), {
        status: 'REJECTED',
        by: 'Enes',
        note: 'Gerçek metni karışık.',
        at: '2026-10-23T12:00:00.000Z',
      }) as StoryReviewRecord,
    );
    expect(decided).toContain('== Kod doğrulaması ==\nGeçti.');
    expect(decided).toContain('Karar: HUMAN');
    expect(decided).toContain('Üretim 9000 + hakem 3500 token');
    expect(decided).toContain('REJECTED · Enes');
    expect(decided).toContain('Not: Gerçek metni karışık.');
  });
});
