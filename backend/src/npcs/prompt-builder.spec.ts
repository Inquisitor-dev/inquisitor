import { buildNpcPrompt, isForcedConfession } from './prompt-builder';
import { getScenarioConfig } from '../scenarios/scenario-config';

describe('prompt-builder domain', () => {
  describe('isForcedConfession', () => {
    it('korku eşiği aşılmış ve yüzleştirme etkisi olan masum için true döner', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: false,
        hasConfessed: false,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 8,
      });
      expect(result).toBe(true);
    });

    it('katil için asla zorla itiraf dönmez', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: true,
        hasConfessed: false,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 10,
      });
      expect(result).toBe(false);
    });

    it('zaten itiraf etmişse tekrar zorla itiraf dönmez', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: false,
        hasConfessed: true,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 9,
      });
      expect(result).toBe(false);
    });

    it('kırılgan karakter eşiği 6 olduğu için 6 korkuda itiraf eder; soğukkanlı etmez', () => {
      const base = {
        isNarrator: false,
        isCulprit: false,
        hasConfessed: false,
        confrontation: { impact: 'IMPLICATING' as const },
        fearLevel: 6,
      };
      expect(isForcedConfession({ ...base, fearThreshold: 6 })).toBe(true);
      expect(isForcedConfession({ ...base, fearThreshold: 8 })).toBe(false);
    });

    it('korku eşiğinin altındaysa zorla itiraf dönmez', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: false,
        hasConfessed: false,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 5,
      });
      expect(result).toBe(false);
    });
  });

  describe('buildNpcPrompt', () => {
    const config = getScenarioConfig('medieval', 'easy');
    const baseSession = {
      scenarioType: 'medieval',
      scenario: 'Lord cinayete kurban gitti.',
      truthReveal: 'Rahip zehir kullandı.',
      culpritId: 'church',
      warrantsIssued: 1,
      activeWarrants: ['mill'],
      caseFacts: {
        victim: { name: 'Lord Aldous', profession: 'Lord' },
        weapon: 'Zehir',
        motive: 'REVENGE' as const,
        alibis: {
          tavern: 'Gece boyu bardaydı.',
        },
        verification: {
          kind: 'CORROBORATION' as const,
          placement: { type: 'TESTIMONY' as const, npcId: 'tavern' },
        },
        verificationText: 'Gece yarısı kiliseden gelen bir ses duyuldu.',
      },
      locationClues: {
        tavern: 'Kırık bir kadeh.',
      },
    };

    it('normal NPC için kimlik, sır ve kuralları içeren prompt üretir', () => {
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc: {
          id: 'tavern',
          name: 'Aldric',
          description: 'Hancı',
          basePrompt: 'Sessiz ve temkinli.',
        },
        dynamicPrompt: 'Kayıp paraları saklıyor.',
        fearLevel: 30,
        hasConfessed: false,
      });

      expect(prompt).toContain('CANONICAL LOCATIONS:');
      expect(prompt).toContain('PUBLIC IDENTITY:');
      expect(prompt).toContain('YOUR PERSONAL SECRET/ROLE IN THIS:');
      expect(prompt).toContain('YOUR WHEREABOUTS ON THE NIGHT OF THE MURDER');
      expect(prompt).toContain('Kayıp paraları saklıyor.');
    });

    it('ortam anlatıcısı için NARRATOR ROLE ve gizli ipucu ekler', () => {
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc: {
          id: 'narrator_tavern',
          name: 'Taverna',
          description: 'Mekan',
          basePrompt: '',
        },
        dynamicPrompt: '',
        fearLevel: 0,
        hasConfessed: false,
      });

      expect(prompt).toContain('NARRATOR ROLE:');
      expect(prompt).toContain('CANONICAL HIDDEN CLUE FOR THIS LOCATION:');
      expect(prompt).toContain('Kırık bir kadeh.');
    });

    it('olay yeri seçilmiş vakada karakter cesedin nerede bulunduğunu bilir, anlatıcı örtülü bedeni anlatır', () => {
      const session = {
        ...baseSession,
        caseFacts: { ...baseSession.caseFacts, crimeSceneId: 'bridge' },
      };
      const sceneConfig = getScenarioConfig('medieval', 'easy', 'bridge');
      const npcPrompt = buildNpcPrompt({
        scenarioConfig: sceneConfig,
        session,
        npc: {
          id: 'tavern',
          name: 'Aldric',
          description: 'Hancı',
          basePrompt: '',
        },
        dynamicPrompt: '',
        fearLevel: 0,
        hasConfessed: false,
      });
      expect(npcPrompt).toContain('The body was found at "Taş Köprü"');

      const narratorPrompt = buildNpcPrompt({
        scenarioConfig: sceneConfig,
        session,
        npc: {
          id: 'narrator_crime_scene',
          name: 'Olay Yeri',
          description: '',
          basePrompt: '',
        },
        dynamicPrompt: '',
        fearLevel: 0,
        hasConfessed: false,
      });
      expect(narratorPrompt).toContain('environment narrator for Taş Köprü');
      expect(narratorPrompt).toContain('covered with a coarse linen sheet');
    });

    it.each([
      ['TIDY', 'The scene is TIDY', 'The scene is MESSY'],
      ['MESSY', 'The scene is MESSY', 'The scene is TIDY'],
    ] as const)(
      'olay yeri anlatıcısı görünüşü (%s) koddan alır',
      (sceneState, expected, unexpected) => {
        const prompt = buildNpcPrompt({
          scenarioConfig: getScenarioConfig('medieval', 'easy', 'forest_path'),
          session: {
            ...baseSession,
            caseFacts: {
              ...baseSession.caseFacts,
              crimeSceneId: 'forest_path',
              sceneState,
            },
          },
          npc: {
            id: 'narrator_crime_scene',
            name: 'Olay Yeri',
            description: '',
            basePrompt: '',
          },
          dynamicPrompt: '',
          fearLevel: 0,
          hasConfessed: false,
        });
        expect(prompt).toContain(expected);
        expect(prompt).not.toContain(unexpected);
      },
    );

    it('olay yeri anlatıcısı yara türünü koddan anlatır, silahın adını söylemez', () => {
      const prompt = buildNpcPrompt({
        scenarioConfig: getScenarioConfig('medieval', 'easy', 'well'),
        session: {
          ...baseSession,
          caseFacts: {
            ...baseSession.caseFacts,
            crimeSceneId: 'well',
            weaponId: 'rope',
          },
        },
        npc: {
          id: 'narrator_crime_scene',
          name: 'Olay Yeri',
          description: '',
          basePrompt: '',
        },
        dynamicPrompt: '',
        fearLevel: 0,
        hasConfessed: false,
      });
      expect(prompt).toContain('dark marks around the neck');
      expect(prompt).toContain('never name the exact weapon');
    });

    it('arama izni veren makam için sistem izin durumunu ekler', () => {
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc: {
          id: 'church',
          name: 'Peder',
          description: 'Rahip',
          basePrompt: '',
        },
        dynamicPrompt: 'Cinayeti işledi.',
        fearLevel: 20,
        hasConfessed: false,
      });

      expect(prompt).toContain('[SYSTEM - SEARCH WARRANTS]:');
      expect(prompt).toContain('Warrants left in this case: 1/2');
      expect(prompt).toContain('the decision is made by the system');
    });

    it('Sessiz Oda yalnızca istendiğinde eklenir, katil için de itiraf kuralı korunur', () => {
      const npc = { id: 'church', name: 'Peder', description: 'Rahip', basePrompt: '' };
      const params = { scenarioConfig: config, session: baseSession, npc, fearLevel: 2, hasConfessed: false };
      expect(buildNpcPrompt(params)).not.toContain('PRIVATE ROOM:');
      const prompt = buildNpcPrompt({ ...params, quietRoom: true });
      expect(prompt).toContain('PRIVATE ROOM:');
      expect(prompt).toContain('must NEVER openly confess');
    });

    it('Rüya Tabiri yalnızca tanığın prompt’una girer, etiket kuralıyla', () => {
      const witness = { id: 'tavern', name: 'Aldric', description: 'Hancı', basePrompt: '' };
      const other = { id: 'church', name: 'Peder', description: 'Rahip', basePrompt: '' };
      const params = { scenarioConfig: config, session: baseSession, fearLevel: 2, hasConfessed: false };
      expect(buildNpcPrompt({ ...params, npc: witness })).not.toContain('DREAM VISION:');
      const dreamt = buildNpcPrompt({ ...params, npc: witness, dreamActive: true });
      expect(dreamt).toContain('DREAM VISION:');
      expect(dreamt).toContain('[EVIDENCE_REVEALED]');
      expect(buildNpcPrompt({ ...params, npc: other, dreamActive: true })).not.toContain('DREAM VISION:');
    });

    it('Teyit okunan sözü gerçek sayar ama sır vermeyi ve katili adlandırmayı yasaklar', () => {
      const npc = { id: 'church', name: 'Peder', description: 'Rahip', basePrompt: '' };
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc,
        fearLevel: 2,
        hasConfessed: false,
        verifiedStatement: { speakerName: 'Aldric', text: 'Gece kiliseye gittim.' },
      });
      expect(prompt).toContain('VERIFIED STATEMENT:');
      expect(prompt).toContain('Aldric');
      expect(prompt).toContain('Gece kiliseye gittim.');
      expect(prompt).toContain('never name the murderer');
    });
  });
});
