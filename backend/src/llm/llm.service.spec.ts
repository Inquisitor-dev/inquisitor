import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { LlmUsageRecorder } from './usage/llm-usage.recorder';
import { storyReviewFields } from '../stories/story-review';
import { CLEAN_REVIEW_CASE } from '../stories/review-fixtures';

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

  it('karakter cevabı boş dönerse bir kez daha denenir', async () => {
    const complete = jest
      .fn()
      .mockResolvedValueOnce({ choices: [{ message: { content: '' } }] })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{"reply": "Tamam, anlatıyorum."}' } }],
      });
    Object.assign(service, { complete });
    const { reply } = await service.generateNpcResponse(
      'Aldric',
      'rol',
      [],
      'Konuş!',
    );
    expect(complete).toHaveBeenCalledTimes(2);
    expect(reply).toBe('Tamam, anlatıyorum.');
  });

  describe('tamamen masum eşler aynı yeri söyler', () => {
    const plan = {
      involvements: [
        { npcId: 'clinic', kind: 'NONE', aboutNpcId: 'mill' },
        { npcId: 'mill', kind: 'NONE', aboutNpcId: 'clinic' },
      ],
    };
    const names = { clinic: 'Doktor Harland', mill: 'Değirmenci Giles' };
    // Tarama sırasında çıkan mazeretler
    const draft = {
      scenario: '',
      truthReveal: '',
      culpritId: 'x',
      npcPrompts: {},
      locationClues: { mill: 'Değirmende un defteri.' },
      alibis: {
        clinic:
          'Gece yarısı revirin arka çalışma odasında Değirmenci Giles ile birlikte merhem tariflerini kaydediyordu.',
        mill: 'Gece yarısı değirmenin un öğütme odasında Doktor Harland ile birlikte tahıl stok dökümünü düzenliyordu.',
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
      const target = service as unknown as { repairAlibiPlaces: Repair };
      return {
        complete,
        result: target.repairAlibiPlaces(draft, plan, 'medieval', names),
      };
    };

    it('farklı mekân söyleyen eşin mazereti ve ipucu ilkinin yerine göre onarılır', async () => {
      const { complete, result } = runWith(
        JSON.stringify({
          alibi:
            'Gece yarısı revirde Doktor Harland ile birlikte merhem tariflerini kaydediyordu.',
          clue: 'Değirmende, gece revirde olduğunu gösteren bir not.',
          truthReveal: 'Harland ile Giles revirdeydi.',
        }),
      );
      const repaired = await result;
      expect(complete).toHaveBeenCalledTimes(1);
      expect(repaired.alibis.mill).toContain('revirde');
      expect(repaired.locationClues.mill).toContain('revirde');
      // Gerçek metni de yeni yere göre güncellenir
      expect(repaired.truthReveal).toBe('Harland ile Giles revirdeydi.');
    });

    it('onarım tutmazsa ilkinin mazereti ikisine de verilir', async () => {
      const { result } = runWith('yapamam');
      const repaired = await result;
      expect(repaired.alibis.mill).toBe(draft.alibis.clinic);
    });
  });

  describe('hikâye hakemi', () => {
    const fields = storyReviewFields(CLEAN_REVIEW_CASE);
    const reviewWith = (complete: jest.Mock) => {
      Object.assign(service, { complete });
      return service.reviewStory(CLEAN_REVIEW_CASE, fields);
    };

    it('bulguları okur ve çağrıyı STORY_REVIEW olarak kaydeder', async () => {
      const complete = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                issues: [
                  {
                    category: 'LOGIC',
                    severity: 'CERTAIN',
                    field: 'truthReveal',
                    quote: 'orakla Marta’nın boğazını kesti',
                    note: 'Örnek.',
                  },
                ],
              }),
            },
          },
        ],
      });
      const issues = await reviewWith(complete);
      expect(issues).toEqual([
        expect.objectContaining({ category: 'LOGIC', source: 'JUDGE' }),
      ]);
      expect(complete).toHaveBeenCalledWith(
        expect.anything(),
        'Story review',
        90_000,
        { kind: 'STORY_REVIEW' },
      );
    });

    it('okunamayan cevapta bir kez daha sorar', async () => {
      const complete = jest
        .fn()
        .mockResolvedValueOnce({ choices: [{ message: { content: 'bozuk' } }] })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{"issues":[]}' } }],
        });
      expect(await reviewWith(complete)).toEqual([]);
      expect(complete).toHaveBeenCalledTimes(2);
    });

    it('çağrı başarısızsa null döner', async () => {
      const complete = jest.fn().mockRejectedValue(new Error('429'));
      expect(await reviewWith(complete)).toBeNull();
    });
  });
});
