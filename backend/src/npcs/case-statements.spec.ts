import {
  asksAboutBody,
  bodyFindingText,
  confessionText,
  linkPromptLines,
  linkStatements,
  mentions,
} from './case-statements';
import {
  EVIDENCE_TAG,
  evidenceFromTags,
  extractEvidenceTags,
} from './evidence';
import { evidenceImpact } from './fear';
import type { CaseFacts } from '../scenarios/case-setup';

const NAMES: Record<string, string> = {
  tavern: 'Kardeş Aldric',
  church: 'Peder Malachar',
  graveyard: 'İhtiyar Silas',
  mill: 'Değirmenci Giles',
  farm: 'Çiftçi Edmund',
};
const nameOf = (id: string) => NAMES[id] ?? id;

// Katil değirmenci; kilise kısmi tanık (hancıyı başka yerde gördü), mezarlık son konuşan,
// çiftçi tamamen masum (hancıyla birlikteydi), hancı silahı bilmeden vermiş
const facts = {
  culpritId: 'mill',
  innocentIds: ['tavern', 'church', 'graveyard', 'farm'],
  weaponId: 'hammer',
  motive: 'DEBT',
  timeOfDeath: 'MIDNIGHT',
  alibis: {
    tavern: 'Hancı mahzendeydi.',
    farm: 'Çiftçi hancıyla birlikteydi.',
  },
  verification: {
    kind: 'CORROBORATION',
    placement: { type: 'LOCATION', locationId: 'mill' },
  },
  involvements: [
    { npcId: 'church', kind: 'WITNESS', aboutNpcId: 'tavern' },
    { npcId: 'graveyard', kind: 'LAST_CONVERSATION', aboutNpcId: 'mill' },
    { npcId: 'farm', kind: 'NONE', aboutNpcId: 'tavern' },
    { npcId: 'tavern', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
  ],
} as unknown as CaseFacts;

const draftsFor = (
  npcId: string | null,
  reply: string,
  extra: Partial<Parameters<typeof evidenceFromTags>[0]> = {},
) => {
  const { reply: cleaned, tags } = extractEvidenceTags(reply);
  return evidenceFromTags({
    tags,
    npcId,
    locationId: npcId ? null : 'crime_scene',
    culpritId: 'mill',
    caseFacts: facts,
    locationClues: {},
    reply: cleaned,
    nameOf,
    scenarioType: 'medieval',
    ...extra,
  });
};

describe('Vaka Motoru v2 ifadeleri', () => {
  it('beden incelemesi yaranın türünü koddan yazar', () => {
    expect(bodyFindingText(facts, 'medieval')).toContain('küt bir cisimle');
    expect(asksAboutBody('Cesedin üzerindeki örtüyü kaldırıyorum')).toBe(true);
    expect(asksAboutBody('Etrafa bakıyorum')).toBe(false);
  });

  it('anlatıcı bedeni anlatınca BODY kanıtı kaydedilir; etiket unutulsa da oyuncu bedeni incelediyse', () => {
    expect(
      draftsFor(null, 'Boynunda morluklar... [BODY_EXAMINED]'),
    ).toMatchObject([
      { kind: 'BODY', category: 'ITEM', sourceId: 'crime_scene' },
    ]);
    expect(
      draftsFor(null, 'Ezik bir yara görüyorsun.', {
        playerMessage: 'Bedeni inceliyorum',
      }),
    ).toHaveLength(1);
    expect(
      draftsFor(null, 'Rüzgâr esiyor.', { playerMessage: 'Etrafa bakıyorum' }),
    ).toHaveLength(0);
  });

  it('her karakter yalnızca kendi ifadelerini verebilir', () => {
    expect(linkStatements(facts, 'church', nameOf).map((s) => s.kind)).toEqual([
      'TESTIMONY',
    ]);
    expect(
      linkStatements(facts, 'graveyard', nameOf).map((s) => s.kind),
    ).toEqual(['TESTIMONY']);
    // Hancı çiftçinin mazeretini doğrular
    expect(linkStatements(facts, 'tavern', nameOf).map((s) => s.kind)).toEqual([
      'ALIBI',
    ]);
    expect(linkStatements(facts, 'mill', nameOf)).toEqual([]);
  });

  it('kısmi tanığın ifadesi, gördüğü kişinin adı geçince etiket olmasa da kaydedilir', () => {
    const drafts = draftsFor(
      'church',
      'O gece Kardeş Aldric başka yerdeydi, gözümle gördüm.',
    );
    expect(drafts).toMatchObject([{ kind: 'TESTIMONY', sourceId: 'church' }]);
    expect(drafts[0].text).toContain('Kardeş Aldric');
    expect(drafts[0].text).toContain('gece yarısı civarı');
  });

  it('mazeret doğrulaması "birlikteydik" denince kaydedilir', () => {
    const drafts = draftsFor(
      'tavern',
      'Çiftçi Edmund o gece benimle birlikteydi.',
    );
    expect(drafts).toMatchObject([{ kind: 'ALIBI', sourceId: 'tavern' }]);
  });

  it('son konuşanın ifadesi motifi anlatır, kimseyi adıyla söylemez', () => {
    const drafts = draftsFor(
      'graveyard',
      'Onunla en son ben konuştum. [STATEMENT_GIVEN]',
    );
    expect(drafts[0].text).toContain('borç');
    expect(drafts[0].text).not.toContain('Giles');
  });

  it('silahı bilmeden verenin itirafı kime verdiğini de söyler', () => {
    const text = confessionText(facts, 'tavern', nameOf, 'medieval');
    expect(text).toContain('Hancı mahzendeydi.');
    expect(text).toContain('Demirci çekici benimdi');
    expect(text).toContain('Değirmenci Giles istedi');
  });

  it('tamamen masum ve onu doğrulayan aynı mazeret cümlesini alır', () => {
    const farm = linkPromptLines(facts, 'farm', nameOf, 'medieval', 'X');
    const tavern = linkPromptLines(facts, 'tavern', nameOf, 'medieval', 'X');
    expect(farm).toContain('Çiftçi hancıyla birlikteydi.');
    expect(tavern).toContain('Çiftçi hancıyla birlikteydi.');
  });

  it('NPC istemi ifadeyi ve etiketi koddan verir', () => {
    const lines = linkPromptLines(
      facts,
      'tavern',
      nameOf,
      'medieval',
      EVIDENCE_TAG.statement,
    );
    expect(lines).toContain('YOUR PART IN THE CASE');
    expect(lines).toContain('Çiftçi Edmund benimleydi');
    expect(lines).toContain(
      'only when the instruction at the end says you break',
    );
    expect(lines).not.toContain('exactly as here');
    expect(lines).toContain('[STATEMENT_GIVEN]');
    expect(linkPromptLines(facts, 'mill', nameOf, 'medieval', 'X')).toBe('');
  });

  it('beden aleti vereni korkutur; son konuşmanın ifadesi kimseyi korkutmaz (katili ele vermesin)', () => {
    const impact = (kind: string, sourceId: string, targetNpcId: string) =>
      evidenceImpact({
        evidence: { kind, sourceId },
        targetNpcId,
        culpritId: 'mill',
        caseFacts: facts,
        alreadyShown: false,
      });
    expect(impact('BODY', 'crime_scene', 'tavern')).toBe('IMPLICATING');
    expect(impact('BODY', 'crime_scene', 'church')).toBe('IRRELEVANT');
    expect(impact('TESTIMONY', 'graveyard', 'mill')).toBe('IRRELEVANT');
    expect(impact('TESTIMONY', 'church', 'mill')).toBe('IRRELEVANT');
    expect(impact('ALIBI', 'tavern', 'farm')).toBe('IRRELEVANT');
  });
});

describe('tanık ve son konuşan: yer koddan, ipucu yok', () => {
  it('kısmi tanık gördüğü kişiyi o kişinin anlattığı yerde gördüğünü bilir', () => {
    const lines = linkPromptLines(facts, 'church', nameOf, 'medieval', 'X');
    expect(lines).toContain('Where exactly you saw Kardeş Aldric');
    expect(lines).toContain('Hancı mahzendeydi.');
  });

  it('son konuşan kurbanın kimden korktuğunu tarif etmez', () => {
    const lines = linkPromptLines(facts, 'graveyard', nameOf, 'medieval', 'X');
    expect(lines).toContain('You do not know who the victim was afraid of');
    expect(lines).toContain('no name, job, kind');
  });
});

describe('yakalama kuralları sıradan cümleleri ifade saymaz', () => {
  it('son konuşan: "son kez söylüyorum" sayılmaz, "en son ben konuştum" sayılır', () => {
    expect(
      draftsFor('graveyard', 'Sana son kez söylüyorum, bir şey bilmiyorum.'),
    ).toEqual([]);
    expect(
      draftsFor('graveyard', 'Onunla en son ben konuştum, çok huzursuzdu.'),
    ).toHaveLength(1);
  });

  it('kısmi tanık: adın geçmesi yetmez, onu başka yerde gördüğünü anlatmalı', () => {
    expect(draftsFor('church', "Git Kardeş Aldric'e sor.")).toEqual([]);
    expect(
      draftsFor('church', 'O saatte Kardeş Aldric uzaktaydı, gördüm.'),
    ).toHaveLength(1);
  });

  it('beden: "yarasa" ya da "yaramaz" beden incelemesi sayılmaz', () => {
    expect(asksAboutBody('Yarasa var mı diye tavana bakıyorum')).toBe(false);
    expect(asksAboutBody('Yaramaz çocuklara bakıyorum')).toBe(false);
    expect(asksAboutBody('Yarasına yakından bakıyorum')).toBe(true);
  });
});

describe('eşkâl tanıklığı korkuyu adı ele vermeden etkiler', () => {
  it('tarife uyan herkesin korkusu artar, yalnızca katilinki değil', () => {
    const witnessFacts = {
      ...facts,
      verification: {
        kind: 'CORROBORATION',
        placement: { type: 'TESTIMONY', npcId: 'church' },
        witnessDescriptionFits: ['mill', 'tavern'],
      },
    } as unknown as CaseFacts;
    const impact = (targetNpcId: string) =>
      evidenceImpact({
        evidence: { kind: 'VERIFICATION', sourceId: 'church' },
        targetNpcId,
        culpritId: 'mill',
        caseFacts: witnessFacts,
        alreadyShown: false,
      });
    expect(impact('mill')).toBe('IMPLICATING');
    expect(impact('tavern')).toBe('IMPLICATING');
    expect(impact('farm')).toBe('IRRELEVANT');
  });
});

describe('ad eşleşmesi', () => {
  it('ad kelime başında aranır, ekler serbest; kelime içindeki parça sayılmaz', () => {
    expect(mentions("Lin'in dükkânındaydım.", 'Lin Feng')).toBe(true);
    expect(mentions('Feng beni gördü.', 'Lin Feng')).toBe(true);
    // Tarama sırasında: "lin" parçası sıradan kelimelerde bulunuyordu
    expect(mentions('Bilinen bir şey yok, gelince söylerim.', 'Lin Feng')).toBe(
      false,
    );
    expect(mentions('Kardeş Aldric gelmedi.', 'Kardeş Aldric')).toBe(true);
    // Unvan tek başına ad sayılmaz
    expect(mentions('Kardeş geldi.', 'Kardeş Aldric')).toBe(false);
  });
});
