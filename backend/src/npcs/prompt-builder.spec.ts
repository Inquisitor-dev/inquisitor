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

    it('örtü hikâyesi olmayan (eski) vakada katil kırılmaz', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: true,
        hasConfessed: false,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 10,
      });
      expect(result).toBe(false);
    });

    it('örtü hikâyesi olan katil de eşikte kırılır: kırılmayan kişi katili söylemez', () => {
      const result = isForcedConfession({
        isNarrator: false,
        isCulprit: true,
        culpritCover: 'Değirmende tek başımaydım.',
        hasConfessed: false,
        confrontation: { impact: 'DECISIVE' },
        fearLevel: 7,
      });
      expect(result).toBe(true);
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

    it('gece olaylarını herkes bilir; yalnızca katile "bunu sen yaptın" satırı gider', () => {
      const personaState = {
        version: 1,
        processedNights: [1],
        happened: [{ night: 1, kind: 'THREAT_LETTER' }],
        papers: [],
      };
      const promptFor = (id: string) =>
        buildNpcPrompt({
          scenarioConfig: config,
          session: { ...baseSession, personaState, currentDay: 2 },
          npc: { id, name: id, description: id, basePrompt: '' },
          fearLevel: 0,
          hasConfessed: false,
        });
      const innocent = promptFor('tavern');
      const culprit = promptFor('church');
      expect(innocent).toContain('threatening letter');
      expect(culprit).toContain('threatening letter');
      expect(innocent).not.toContain('You yourself did the night events');
      expect(culprit).toContain('You yourself did the night events');
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

    it('Rüya Tabiri ifadesi olan herkesi konuşturur; ifadesi olmayanı ve katili konuşturmaz', () => {
      const session = {
        ...baseSession,
        caseFacts: {
          ...baseSession.caseFacts,
          involvements: [
            { npcId: 'mill', kind: 'WITNESS' as const, aboutNpcId: 'farm' },
            { npcId: 'graveyard', kind: 'SCAVENGER' as const },
          ],
        },
      };
      const params = {
        scenarioConfig: config,
        session,
        fearLevel: 2,
        hasConfessed: false,
        dreamActive: true,
      };
      const npcOf = (id: string, name: string) => ({
        id,
        name,
        description: '',
        basePrompt: '',
      });
      const witness = buildNpcPrompt({
        ...params,
        npc: npcOf('mill', 'Giles'),
      });
      expect(witness).toContain('DREAM VISION:');
      expect(witness).toContain('[STATEMENT_GIVEN]');
      const scavenger = buildNpcPrompt({
        ...params,
        npc: npcOf('graveyard', 'Silas'),
      });
      expect(scavenger).not.toContain('DREAM VISION:');
      const culprit = buildNpcPrompt({
        ...params,
        npc: npcOf('church', 'Peder'),
      });
      expect(culprit).not.toContain('DREAM VISION:');
    });

    it('Sessiz Oda katile somut cevabının örtü hikâyesi olduğunu söyler', () => {
      const session = {
        ...baseSession,
        caseFacts: {
          ...baseSession.caseFacts,
          culpritCover: 'Kilisede yalnızdım.',
        },
      };
      const params = {
        scenarioConfig: config,
        session,
        fearLevel: 2,
        hasConfessed: false,
        quietRoom: true,
      };
      const prompt = buildNpcPrompt({
        ...params,
        npc: { id: 'church', name: 'Peder', description: '', basePrompt: '' },
      });
      expect(prompt).toContain(
        'Your concrete answer about that night is your cover story',
      );
      const innocent = buildNpcPrompt({
        ...params,
        npc: { id: 'tavern', name: 'Aldric', description: '', basePrompt: '' },
      });
      expect(innocent).not.toContain('cover story');
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

    it('katil örtü hikâyesini bilir, kırılınca onu itiraf gibi anlatır ama cinayeti asla itiraf etmez', () => {
      const cover =
        'Gece boyu kilisede tek başımaydım; Lord ile aramızda eski bir borç vardı.';
      const session = {
        ...baseSession,
        caseFacts: {
          ...baseSession.caseFacts,
          culpritId: 'church',
          culpritCover: cover,
        },
      };
      const npc = {
        id: 'church',
        name: 'Peder',
        description: 'Rahip',
        basePrompt: '',
      };
      const params = { scenarioConfig: config, session, npc };
      const calm = buildNpcPrompt({
        ...params,
        fearLevel: 2,
        hasConfessed: false,
      });
      expect(calm).toContain('YOUR COVER STORY');
      expect(calm).toContain(cover);
      expect(calm).toContain('keep its shameful secret to yourself');
      expect(calm).toContain('Never reveal your real motive');
      expect(calm).not.toContain('FEAR BREAK:');

      const broken = buildNpcPrompt({
        ...params,
        fearLevel: 7,
        hasConfessed: false,
        confrontation: { evidenceText: 'Borç senedi.', impact: 'DECISIVE' },
      });
      expect(broken).toContain('FEAR BREAK:');
      expect(broken).toContain(
        `exactly this, in your own words and nothing more: "${cover}"`,
      );
      expect(broken).toContain('you NEVER confess to the murder');
      // Panikte örtü hikâyesine sarılır; gerçek motifi söylemez
      expect(broken).toContain('cling to your cover story');
      expect(broken).not.toContain(
        'can no longer hold back your personal secret',
      );
      const after = buildNpcPrompt({
        ...params,
        fearLevel: 10,
        hasConfessed: true,
      });
      expect(after).toContain('never reveal your real motive');
    });

    it('sırrı olmayan masum kırılınca kayıtlı itiraf metnini anlatır, kanıtla bağ uydurmaz', () => {
      const tavern = {
        id: 'tavern',
        name: 'Aldric',
        description: 'Hancı',
        basePrompt: '',
      };
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc: tavern,
        fearLevel: 7,
        hasConfessed: false,
        confrontation: {
          evidenceText: 'Yanmış bir disk.',
          impact: 'IMPLICATING',
        },
      });
      expect(prompt).toContain('FEAR BREAK:');
      expect(prompt).toContain(
        'exactly this, in your own words and nothing more: "Gece boyu bardaydı."',
      );
      expect(prompt).toContain(
        'Never invent a theft, a link to the evidence shown',
      );
      // Masuma "seni gösteriyor" denmez; kanıtla bağ kurması yasaklanır
      expect(prompt).not.toContain('This evidence points at you');
      expect(prompt).toContain('never invent a link between yourself and it');
      // Korku, oyuncunun uydurduğu olayı doğrulatmaz
      expect(prompt).toContain(
        'Fear changes how you speak, never what you know.',
      );
    });

    it('tamamen masumun sırrı yoktur; baskı, tehdit ve pazarlık kimseyi itiraf ettirmez', () => {
      const session = {
        ...baseSession,
        caseFacts: {
          ...baseSession.caseFacts,
          involvements: [
            { npcId: 'tavern', kind: 'NONE' as const, aboutNpcId: 'mill' },
          ],
        },
      };
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session,
        npc: {
          id: 'tavern',
          name: 'Aldric',
          description: 'Hancı',
          basePrompt: '',
        },
        fearLevel: 2,
        hasConfessed: false,
      });
      expect(prompt).toContain('you have NO secret at all');
      expect(prompt).not.toContain('you may have your own secret');
      expect(prompt).toContain('Never invent anything to confess');
      expect(prompt).toContain('Threats (hanging, prison');
      expect(prompt).toContain('Do not repeat sentences you already said');
    });

    it('adı geçen ama onu suçlamayan kanıtı karakter inkâr etmez', () => {
      const tavern = {
        id: 'tavern',
        name: 'Aldric',
        description: 'Hancı',
        basePrompt: '',
      };
      const promptFor = (evidenceText: string) =>
        buildNpcPrompt({
          scenarioConfig: config,
          session: baseSession,
          npc: tavern,
          fearLevel: 1,
          hasConfessed: false,
          confrontation: { evidenceText, impact: 'IRRELEVANT' },
        });
      const named = promptFor(
        `Değirmenin defterinde ${config.npcDefinitions.find((n) => n.id === 'tavern')!.name} ile değirmencinin imzası var.`,
      );
      expect(named).toContain('This evidence mentions you');
      expect(named).not.toContain('This evidence has nothing to do with you');
      const unnamed = promptFor('Değirmende bir un çuvalı.');
      expect(unnamed).toContain('This evidence has nothing to do with you');
    });

    it('masum ve katil ölüm saatini koddan bilir, başka saat uydurmaz', () => {
      const session = {
        ...baseSession,
        caseFacts: {
          ...baseSession.caseFacts,
          timeOfDeath: 'EVENING' as const,
        },
      };
      const innocent = buildNpcPrompt({
        scenarioConfig: config,
        session,
        npc: {
          id: 'tavern',
          name: 'Aldric',
          description: 'Hancı',
          basePrompt: '',
        },
        fearLevel: 1,
        hasConfessed: false,
      });
      expect(innocent).toContain(
        'The murder happened akşam, hava karardıktan sonra',
      );
      expect(innocent).toContain('never name another hour');
      const culprit = buildNpcPrompt({
        scenarioConfig: config,
        session,
        npc: {
          id: 'church',
          name: 'Peder',
          description: 'Rahip',
          basePrompt: '',
        },
        fearLevel: 1,
        hasConfessed: false,
      });
      expect(culprit).toContain('in the evening, after dark');
    });

    it('katile kanıt yine onu gösteren kanıt olarak sunulur', () => {
      const church = {
        id: 'church',
        name: 'Peder',
        description: 'Rahip',
        basePrompt: '',
      };
      const prompt = buildNpcPrompt({
        scenarioConfig: config,
        session: baseSession,
        npc: church,
        fearLevel: 9,
        hasConfessed: false,
        confrontation: {
          evidenceText: 'Yanmış bir disk.',
          impact: 'IMPLICATING',
        },
      });
      expect(prompt).toContain('This evidence points at you');
      expect(prompt).not.toContain('FEAR BREAK:');
    });
  });
});
