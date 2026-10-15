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
        motive: 'İntikam',
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

      expect(prompt).toContain('[SYSTEM - SEARCH WARRANT STATUS]:');
      expect(prompt).toContain('Total Warrants Issued in Session: 1/2');
      expect(prompt).toContain('Remaining Warrants You Can Grant: 1');
    });

    it('Sessiz Oda yalnızca istendiğinde eklenir, katil için de itiraf kuralı korunur', () => {
      const npc = { id: 'church', name: 'Peder', description: 'Rahip', basePrompt: '' };
      const params = { scenarioConfig: config, session: baseSession, npc, fearLevel: 2, hasConfessed: false };
      expect(buildNpcPrompt(params)).not.toContain('PRIVATE ROOM:');
      const prompt = buildNpcPrompt({ ...params, quietRoom: true });
      expect(prompt).toContain('PRIVATE ROOM:');
      expect(prompt).toContain('must NEVER openly confess');
    });
  });
});
