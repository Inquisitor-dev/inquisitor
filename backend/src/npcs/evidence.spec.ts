import { CaseFacts } from '../scenarios/case-setup';
import {
  evidenceFromTags,
  extractEvidenceTags,
  sharesTestimony,
} from './evidence';

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
      {
        kind: 'CLUE',
        category: 'ITEM',
        sourceId: 'crime_scene',
        text: 'Çamurlu çizme izi.',
      },
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
    expect(drafts[0].category).toBe('ITEM');
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
        category: 'STATEMENT',
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
        category: 'STATEMENT',
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
        category: 'ITEM',
        sourceId: 'tavern',
        text: 'Tezgâhın altında kaçak içki fıçısı.',
      },
    ]);
  });
});

describe('sharesTestimony', () => {
  // Gerçek Gemini denemesinden: tanık doğru şeyi söyledi ama etiketi koymadı
  const verificationText =
    "Kardeş Aldric, cinayet gecesi İhtiyar Silas'ın aceleyle mezarlıktan çıktığını ve ayaklarında kaba çamurlu çizmeler olduğunu kendi gözleriyle görmüştür.";
  const base = {
    verificationText,
    witnessName: 'Kardeş Aldric',
    culpritName: 'İhtiyar Silas',
  };

  it('etiketsiz anlatılan tanıklığı tanır', () => {
    expect(
      sharesTestimony({
        ...base,
        reply:
          "Gece yarısını biraz geçe camdan dışarı baktım. İhtiyar Silas'ın mezarlık tarafından, ayaklarında o kaba çamurlu çizmeleriyle panik içinde aceleyle koşarak uzaklaştığını kendi gözlerimle gördüm.",
      }),
    ).toBe(true);
  });

  it('farklı kelimelerle anlatılan tanıklığı da tanır', () => {
    // İkinci gerçek Gemini cevabı: "aceleyle", "kendi gözlerimle" geçmiyor
    expect(
      sharesTestimony({
        ...base,
        reply:
          "Sisler arasından biri belirdi; İhtiyar Silas'tı o. Ayaklarında o her zamanki kaba, çamurlu çizmeleri vardı ve mezarlık tarafından panik içinde, nefes nefese koşarak uzaklaşıyordu.",
      }),
    ).toBe(true);
  });

  it('katilin adı geçmeyen ya da konuyla ilgisiz cevabı tanıklık saymaz', () => {
    expect(
      sharesTestimony({
        ...base,
        reply:
          'O gece arka odada hesap kitapla uğraşıyordum, kimseyi görmedim.',
      }),
    ).toBe(false);
    expect(
      sharesTestimony({
        ...base,
        reply: 'Silas mı? Mezarcıdır, pek konuşmaz.',
      }),
    ).toBe(false);
  });

  it('etiket olmadan da tanığın cevabı kanıt olarak kaydedilir', () => {
    const drafts = evidenceFromTags({
      tags: new Set(),
      npcId: 'tavern',
      locationId: null,
      culpritId: 'graveyard',
      caseFacts: {
        verification: {
          kind: 'CORROBORATION',
          placement: { type: 'TESTIMONY', npcId: 'tavern' },
        },
        verificationText,
        alibis: {},
      } as unknown as CaseFacts,
      locationClues: {},
      reply:
        "İhtiyar Silas'ın mezarlıktan aceleyle, ayaklarında kaba çamurlu çizmelerle çıktığını kendi gözlerimle gördüm.",
      nameOf: (id) => (id === 'tavern' ? 'Kardeş Aldric' : 'İhtiyar Silas'),
    });
    expect(drafts).toMatchObject([
      { kind: 'VERIFICATION', category: 'STATEMENT', sourceId: 'tavern' },
    ]);
  });
});
