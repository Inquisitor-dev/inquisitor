import { CaseFacts } from '../scenarios/case-setup';
import { evidenceFromTags, extractEvidenceTags } from './evidence';

const facts = (placement: CaseFacts['verification']['placement']) =>
  ({
    verification: { kind: 'CORROBORATION', placement },
    verificationText: 'Değirmende aynı çamur bulundu.',
    alibis: { tavern: 'O gece mahzende kaçak içki dolduruyordu.' },
  }) as unknown as CaseFacts;

const clues = {
  crime_scene: 'Çamurlu çizme izi.',
  mill: 'Ambarın köşesinde çamurlu çizmeler.',
  tavern: 'Tezgâhın altında kaçak içki fıçısı.',
};

describe('extractEvidenceTags', () => {
  it('etiketleri ayıklar ve metinden siler', () => {
    const { reply, tags } = extractEvidenceTags(
      '*Titreyerek* Evet, o gece mahzendeydim. [CONFESSED]',
    );
    expect(reply).toBe('*Titreyerek* Evet, o gece mahzendeydim.');
    expect([...tags]).toEqual(['CONFESSED']);
  });

  it('büyük-küçük harf ve boşluk farkını tolere eder', () => {
    const { reply, tags } = extractEvidenceTags('Buldun. [ clue_found ]');
    expect(reply).toBe('Buldun.');
    expect(tags.has('CLUE_FOUND')).toBe(true);
  });

  it('etiket yoksa metne dokunmaz', () => {
    expect(extractEvidenceTags('Hiçbir şey yok.').reply).toBe(
      'Hiçbir şey yok.',
    );
  });
});

describe('evidenceFromTags', () => {
  const base = {
    culpritId: 'mill',
    locationClues: clues,
  };

  it('anlatıcının bulduğu ipucunu resmi metniyle kaydeder', () => {
    const drafts = evidenceFromTags({
      ...base,
      tags: new Set(['CLUE_FOUND']),
      npcId: null,
      locationId: 'crime_scene',
      caseFacts: facts({ type: 'TESTIMONY', npcId: 'church' }),
    });
    expect(drafts).toEqual([
      { kind: 'CLUE', sourceId: 'crime_scene', text: 'Çamurlu çizme izi.' },
    ]);
  });

  it('doğrulayan kanıtın konduğu mekândaki ipucu VERIFICATION olur', () => {
    const drafts = evidenceFromTags({
      ...base,
      tags: new Set(['CLUE_FOUND']),
      npcId: null,
      locationId: 'mill',
      caseFacts: facts({ type: 'LOCATION', locationId: 'mill' }),
    });
    expect(drafts[0].kind).toBe('VERIFICATION');
  });

  it('masumun itirafı mazeretiyle kaydedilir', () => {
    const drafts = evidenceFromTags({
      ...base,
      tags: new Set(['CONFESSED']),
      npcId: 'tavern',
      locationId: null,
      caseFacts: facts({ type: 'LOCATION', locationId: 'mill' }),
    });
    expect(drafts).toEqual([
      {
        kind: 'CONFESSION',
        sourceId: 'tavern',
        text: 'O gece mahzende kaçak içki dolduruyordu.',
      },
    ]);
  });

  it('katilin "itirafı" kanıt sayılmaz', () => {
    const drafts = evidenceFromTags({
      ...base,
      tags: new Set(['CONFESSED']),
      npcId: 'mill',
      locationId: null,
      caseFacts: facts({ type: 'LOCATION', locationId: 'mill' }),
    });
    expect(drafts).toEqual([]);
  });

  it('tanıklık kanıtı sadece doğru tanıktan alınır', () => {
    const caseFacts = facts({ type: 'TESTIMONY', npcId: 'church' });
    const fromWitness = evidenceFromTags({
      ...base,
      tags: new Set(['EVIDENCE_REVEALED']),
      npcId: 'church',
      locationId: null,
      caseFacts,
    });
    const fromOther = evidenceFromTags({
      ...base,
      tags: new Set(['EVIDENCE_REVEALED']),
      npcId: 'tavern',
      locationId: null,
      caseFacts,
    });
    expect(fromWitness).toEqual([
      {
        kind: 'VERIFICATION',
        sourceId: 'church',
        text: 'Değirmende aynı çamur bulundu.',
      },
    ]);
    expect(fromOther).toEqual([]);
  });

  it('vaka gerçekleri olmayan eski oturumlarda da çökmez', () => {
    const drafts = evidenceFromTags({
      ...base,
      tags: new Set(['CLUE_FOUND', 'EVIDENCE_REVEALED']),
      npcId: null,
      locationId: 'tavern',
      caseFacts: null,
    });
    expect(drafts).toEqual([
      {
        kind: 'CLUE',
        sourceId: 'tavern',
        text: 'Tezgâhın altında kaçak içki fıçısı.',
      },
    ]);
  });
});
