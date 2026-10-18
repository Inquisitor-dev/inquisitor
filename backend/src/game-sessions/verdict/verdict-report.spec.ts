import type { CaseFacts } from '../../scenarios/case-setup';
import type { BoardEvidence } from '../../board/domain/board.types';
import {
  isSupportingEvidence,
  rewardMultiplier,
  scoreVerdict,
  templateJudgement,
  verdictFactLines,
} from './verdict-report';
import { parseVerdictJudgement } from '../../llm/prompts/verdict-judge-prompt.builder';

// Katil değirmenci (mill), iz gerçek; iz hancıyı ve değirmenciyi gösterir, kiliseyi eler.
// Hancı silahı (orak) bilmeden verdi, kilise kurbanla son konuştu, mezarcı tamamen masum.
const facts = {
  culpritId: 'mill',
  innocentIds: ['tavern', 'church', 'graveyard'],
  murderStyle: 'HURRIED',
  sceneState: 'TIDY',
  crimeSceneId: 'well',
  crimeSceneClue: {
    authentic: true,
    poolClueId: 'x',
    poolClueText: 'iz',
    implicatedNpcIds: ['tavern', 'mill'],
    eliminatedNpcIds: ['church', 'graveyard'],
  },
  verification: {
    kind: 'CORROBORATION',
    placement: { type: 'LOCATION', locationId: 'mill' },
  },
  version: 1,
  crimeSceneClueText: 'iz',
  verificationText: 'doğrulama',
  victim: { name: 'Lord Aldous', profession: 'Lord' },
  alibis: { tavern: 'hancı mazeret', church: 'rahip', graveyard: 'mezarcı' },
  weaponId: 'sickle',
  motive: 'DEBT',
  timeOfDeath: 'MIDNIGHT',
  involvements: [
    { npcId: 'tavern', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
    { npcId: 'church', kind: 'LAST_CONVERSATION', aboutNpcId: 'mill' },
    { npcId: 'graveyard', kind: 'NONE', aboutNpcId: 'church' },
  ],
} as unknown as CaseFacts;

const ev = (
  id: string,
  kind: string,
  sourceId: string,
  category = 'STATEMENT',
): BoardEvidence => ({ id, kind, category, sourceId, text: id });

const evidence = [
  ev('scene', 'CLUE', 'crime_scene', 'ITEM'),
  ev('verif', 'VERIFICATION', 'mill', 'ITEM'),
  ev('body', 'BODY', 'crime_scene', 'ITEM'),
  ev('last', 'TESTIMONY', 'church'),
  ev('helper', 'CONFESSION', 'tavern'),
  // Hancının kendi mekân ipucu katili göstermez ama hancıyı aklar: dayanak sayılır
  ev('tavernClue', 'CLUE', 'tavern', 'ITEM'),
];

const names: Record<string, string> = {
  mill: 'Değirmenci Giles',
  tavern: 'Kardeş Aldric',
  church: 'Peder Malachar',
  graveyard: 'İhtiyar Silas',
};
const nameOf = (id: string) => names[id] ?? id;

const score = (
  report: Parameters<typeof scoreVerdict>[0]['report'],
  narrativeScore: number | null = null,
) =>
  scoreVerdict({
    facts,
    scenarioType: 'medieval',
    report,
    evidence,
    nameOf,
    narrativeScore,
  });

describe('Hüküm Dosyası puanlaması', () => {
  const perfect = {
    evidenceIds: ['scene', 'verif', 'body'],
    weaponId: 'sickle',
    motive: 'DEBT' as const,
    timeOfDeath: 'MIDNIGHT' as const,
    involvements: {
      tavern: 'UNWITTING_HELP',
      church: 'LAST_CONVERSATION',
      graveyard: 'NONE',
    },
    narrative: 'Değirmenci Giles borç yüzünden orakla öldürdü.',
  };

  it('tam doğru rapor 100 puan alır', () => {
    const result = score(perfect, 1);
    expect(result.total).toBe(100);
    expect(result.fields.map((f) => f.id)).toEqual([
      'EVIDENCE',
      'WEAPON',
      'MOTIVE',
      'TIME_OF_DEATH',
      'INVOLVEMENTS',
      'NARRATIVE',
    ]);
  });

  it('boş rapor 0 puan alır ve her alan "boş bıraktın" der', () => {
    const result = score({});
    expect(result.total).toBe(0);
    expect(result.fields.find((f) => f.id === 'WEAPON')?.answer).toBe(
      'Boş bıraktın',
    );
  });

  it('yanlış silah ve motif puan götürür, gerçek yanında gösterilir', () => {
    const result = score(
      { ...perfect, weaponId: 'dagger', motive: 'GREED' },
      1,
    );
    const weapon = result.fields.find((f) => f.id === 'WEAPON')!;
    expect(weapon).toMatchObject({
      points: 0,
      answer: 'Hançer',
      truth: 'Orak',
    });
    expect(result.total).toBe(70);
  });

  it('masumların bağları kişi kişi puanlanır', () => {
    const result = score({
      involvements: { tavern: 'UNWITTING_HELP', church: 'NONE' },
    });
    const field = result.fields.find((f) => f.id === 'INVOLVEMENTS')!;
    expect(field.points).toBe(7); // 20 puanın üçte biri
    expect(field.details?.map((d) => d.correct)).toEqual([true, false, false]);
  });

  it('ilgisiz kanıt seçmek doğru seçimlerin puanını düşürür; bulunmayan kanıt sayılmaz', () => {
    // Tamamen masumun kendi ifadesi kimseyi göstermez, aklamaz
    const decoy = ev('decoy', 'TESTIMONY', 'graveyard');
    const result = scoreVerdict({
      facts,
      scenarioType: 'medieval',
      report: { evidenceIds: ['scene', 'verif', 'decoy', 'yok'] },
      evidence: [...evidence, decoy],
      nameOf,
      narrativeScore: null,
    });
    const field = result.fields.find((f) => f.id === 'EVIDENCE')!;
    // 2 doğru, 1 ilgisiz (yarım götürür), hedef 3: (2 - 0.5) / 3 = 0.5
    expect(field.points).toBe(10);
    expect(field.details).toHaveLength(3);
  });

  it('hakem çalışmazsa anlatım puanlamaya katılmaz, diğer alanlar 100e ölçeklenir', () => {
    const result = score(perfect, null);
    expect(result.fields.some((f) => f.id === 'NARRATIVE')).toBe(false);
    expect(result.total).toBe(100);
  });

  it('dayanak kanıt: katili gösteren, masumu aklayan, silah zinciri ve motif', () => {
    const supporting = evidence.filter((e) => isSupportingEvidence(e, facts));
    expect(supporting.map((e) => e.id)).toEqual([
      'scene',
      'verif',
      'body',
      'last',
      'helper',
      'tavernClue',
    ]);
    expect(isSupportingEvidence(ev('x', 'CLUE', 'mill', 'ITEM'), facts)).toBe(
      true,
    );
  });

  it('tuzak iz dayanak sayılmaz', () => {
    const planted = {
      ...facts,
      murderStyle: 'PLANNED',
      crimeSceneClue: {
        ...facts.crimeSceneClue,
        authentic: false,
        implicatedNpcIds: ['tavern'],
        eliminatedNpcIds: ['tavern'],
      },
    } as unknown as CaseFacts;
    expect(isSupportingEvidence(evidence[0], planted)).toBe(false);
    expect(isSupportingEvidence(evidence[0], facts)).toBe(true);
  });

  it('ödül çarpanı boş raporda 0.5, tam raporda 1', () => {
    expect(rewardMultiplier(0)).toBe(0.5);
    expect(rewardMultiplier(100)).toBe(1);
    expect(rewardMultiplier(50)).toBe(0.75);
  });
});

describe('Hüküm Dosyası hakemi', () => {
  it('hakeme giden gerçekler koddaki kimliklerin Türkçe karşılıklarıdır', () => {
    const lines = verdictFactLines(facts, 'medieval', nameOf);
    expect(lines).toContain('Katil: Değirmenci Giles');
    expect(lines).toContain('Cinayet aleti: Orak');
    expect(lines).toContain('Motif: Borç');
    expect(lines).toContain(
      'Kardeş Aldric: Bilmeden yardım etti (hancı mazeret)',
    );
  });

  it('hakemin cevabı ayrıştırılır, puan 0–1 aralığına çekilir', () => {
    expect(
      parseVerdictJudgement('```json\n{"score": 7, "comment": "İyi."}\n```'),
    ).toEqual({ score: 0.7, comment: 'İyi.' });
    expect(parseVerdictJudgement('{"score": 40}')?.score).toBe(1);
    expect(parseVerdictJudgement('puan veremem')).toBeNull();
    expect(parseVerdictJudgement('{"score": "on"}')).toBeNull();
  });

  it('test modunda hakem katil, alet ve motifi arar', () => {
    const judged = templateJudgement(
      facts,
      'medieval',
      nameOf,
      'Giles borç yüzünden orakla öldürdü.',
    );
    expect(judged.score).toBe(1);
    expect(judged.comment).toContain('[Test Hakemi]');
  });
});
