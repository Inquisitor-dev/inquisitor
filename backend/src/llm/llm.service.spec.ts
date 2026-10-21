import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { LlmUsageRecorder } from './usage/llm-usage.recorder';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: LlmUsageRecorder, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('doğrulayan tanık katilin adını söylemez', () => {
    const plan = {
      culpritId: 'tavern',
      verification: {
        kind: 'FLAW',
        placement: { type: 'TESTIMONY', npcId: 'graveyard' },
      },
      crimeSceneClue: { implicatedNpcIds: ['church'] },
    };
    const names = {
      tavern: 'Kael Voss',
      graveyard: 'Brakk Coil',
      church: 'Mirel Sato',
    };
    const draft = {
      scenario: '',
      truthReveal: '',
      culpritId: 'tavern',
      locationClues: {},
      verificationText:
        "Brakk Coil, Kael Voss'un kabloyu Mirel'in dükkânından aldığını gördü.",
      npcPrompts: {
        graveyard:
          "Sen Brakk Coil'sin. Kael Voss'un kabloyla çıktığını gördün. Sırrın: kaçak çip.",
      },
    };
    type Repair = (
      d: unknown,
      p: unknown,
      s: string,
      n: Record<string, string>,
    ) => Promise<typeof draft>;
    const repairOf = (reply: string) => {
      const complete = jest.fn().mockResolvedValue({
        choices: [{ message: { content: reply } }],
      });
      Object.assign(service, { complete });
      const target = service as unknown as { repairWitnessLeak: Repair };
      return {
        complete,
        run: () => target.repairWitnessLeak(draft, plan, 'cyberpunk', names),
      };
    };

    it('ad geçerse iki metin onarılır', async () => {
      const { complete, run } = repairOf(
        JSON.stringify({
          verificationText:
            "Brakk Coil, birinin kabloyu Mirel'in dükkânından aldığını gördü.",
          npcPrompt:
            "Sen Brakk Coil'sin. Birinin kabloyla çıktığını gördün. Sırrın: kaçak çip.",
        }),
      );
      const result = await run();
      expect(complete).toHaveBeenCalledTimes(1);
      expect(result.verificationText).not.toContain('Kael');
      expect(result.npcPrompts.graveyard).toContain('kaçak çip');
    });

    it('onarım da adı söylerse koddan sade bir tanıklık konur', async () => {
      const { run } = repairOf(
        JSON.stringify({
          verificationText: 'Kael Voss kabloyu aldı.',
          npcPrompt: 'Kael Voss.',
        }),
      );
      const result = await run();
      expect(result.verificationText).toContain('kim olduğunu seçemedi');
      expect(result.verificationText).toContain('Mirel Sato');
      expect(result.verificationText).not.toContain('Kael');
      expect(result.npcPrompts.graveyard).not.toContain('Kael');
    });
  });

  describe('tuzak iz suçlanmak istenen herkesi gösterir', () => {
    const plan = {
      culpritId: 'clinic',
      crimeSceneClue: {
        authentic: false,
        implicatedNpcIds: ['mill', 'church'],
      },
    };
    const names = { mill: 'AURA-9', church: 'Mirel Sato', clinic: 'Vera Nyx' };
    const draft = {
      scenario: '',
      truthReveal: 'Vera, AURA-9 kartını bıraktı.',
      culpritId: 'clinic',
      npcPrompts: {},
      locationClues: { crime_scene: "AURA-9'un yanık devre kartı." },
    };
    type Repair = (
      d: unknown,
      p: unknown,
      s: string,
      n: Record<string, string>,
    ) => Promise<typeof draft>;
    const runWith = (reply: string) => {
      Object.assign(service, {
        complete: jest.fn().mockResolvedValue({
          choices: [{ message: { content: reply } }],
        }),
      });
      const target = service as unknown as { repairPlantedTrace: Repair };
      return target.repairPlantedTrace(draft, plan, 'cyberpunk', names);
    };

    it('eksik kişi onarımla ize eklenir', async () => {
      const result = await runWith(
        JSON.stringify({
          clue: "AURA-9'un devre kartı ve Mirel Sato'nun tork anahtarının parçası.",
          truthReveal: 'Vera iki eşyayı bıraktı.',
        }),
      );
      expect(result.locationClues.crime_scene).toContain('Mirel Sato');
      expect(result.truthReveal).toBe('Vera iki eşyayı bıraktı.');
    });

    it('onarım katili adlandırırsa reddedilir, koddan işaret eklenir', async () => {
      const result = await runWith(
        JSON.stringify({
          clue: 'Vera Nyx, AURA-9 ve Mirel Sato.',
          truthReveal: 'x',
        }),
      );
      expect(result.locationClues.crime_scene).not.toContain('Vera');
      expect(result.locationClues.crime_scene).toContain(
        'Mirel Sato (Lokanta) ile bağlantılı bir işaret',
      );
      expect(result.truthReveal).toBe(draft.truthReveal);
    });
  });

  describe('masum metinleri katilin adını söylemez', () => {
    const plan = {
      culpritId: 'mill',
      innocentIds: ['tavern', 'church'],
      verification: {
        kind: 'FLAW',
        placement: { type: 'LOCATION', locationId: 'church' },
      },
      involvements: [
        { npcId: 'tavern', kind: 'UNWITTING_HELP', aboutNpcId: 'mill' },
        { npcId: 'church', kind: 'WITNESS', aboutNpcId: 'tavern' },
      ],
    };
    const names = { mill: 'AURA-9', tavern: 'Kael Voss', church: 'Mirel Sato' };
    const draft = {
      scenario: '',
      truthReveal: '',
      culpritId: 'mill',
      locationClues: {
        tavern: "AURA-9'a satılan enjektörün satış fişi.",
        church: 'Boş bir askı.',
      },
      npcPrompts: {
        // Silahı veren alıcıyı bilir: onun rol metni denetlenmez
        tavern: "Enjektörü AURA-9'a sattın.",
        church: "Sen Mirel'sin. AURA-9'u o gece gördün. Sırrın: kaçak un.",
      },
    };
    type Repair = (
      d: unknown,
      p: unknown,
      s: string,
      n: Record<string, string>,
    ) => Promise<typeof draft>;
    const runWith = (reply: string) => {
      const complete = jest.fn().mockResolvedValue({
        choices: [{ message: { content: reply } }],
      });
      Object.assign(service, { complete });
      const target = service as unknown as { repairInnocentLeaks: Repair };
      return {
        complete,
        result: target.repairInnocentLeaks(draft, plan, 'cyberpunk', names),
      };
    };

    it('adı geçen ipucu ve rol metni tek çağrıyla onarılır', async () => {
      const { complete, result } = runWith(
        JSON.stringify({
          'clue:tavern': 'Adı yazılmamış bir alıcıya satılan enjektörün fişi.',
          'prompt:church':
            "Sen Mirel'sin. O gece kapüşonlu birini gördün. Sırrın: kaçak un.",
        }),
      );
      const repaired = await result;
      expect(complete).toHaveBeenCalledTimes(1);
      expect(repaired.locationClues.tavern).not.toContain('AURA');
      expect(repaired.npcPrompts.church).toContain('kaçak un');
      expect(repaired.npcPrompts.tavern).toContain('AURA-9');
    });

    it('onarım başarısızsa ipucu koddan, rol metni adı geçen cümle çıkarılarak düzelir', async () => {
      const { result } = runWith('yapamam');
      const repaired = await result;
      expect(repaired.locationClues.tavern).not.toContain('AURA');
      expect(repaired.npcPrompts.church).toBe(
        "Sen Mirel'sin. Sırrın: kaçak un.",
      );
    });
  });
});
