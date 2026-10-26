import { Test, TestingModule } from '@nestjs/testing';
import {
  LlmService,
  dropWrongSightings,
  ensureCulpritCover,
} from './llm.service';
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

    it('eşi leş kargasıysa onarılan tamamen masumdur; leş kargasının ipucu korunur (pilot, Çin-orta)', async () => {
      const chinaPlan = {
        involvements: [
          { npcId: 'graveyard', kind: 'NONE', aboutNpcId: 'farm' },
          { npcId: 'farm', kind: 'SCAVENGER' },
        ],
      };
      const chinaNames = {
        graveyard: 'Keşiş Huikang',
        farm: 'Mei Teyze',
        church: 'Komutan Zhao',
      };
      const chinaDraft = {
        ...draft,
        locationClues: {
          graveyard: 'Tapınakta bir tütsü çubuğu.',
          farm: 'İskelede ağların altına saklanmış gümüş bir tarak.',
        },
        alibis: {
          graveyard:
            'Kadim tapınağın ana sunağının önünde Mei Teyze ile birlikte akşam tütsülerini yakıp dua ediyordum.',
          farm: 'Nehir kenarındaki balıkçı iskelemde ağlarımı onarıyor ve günün son avını tuzluyordum.',
        },
      };
      const complete = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                alibi:
                  'Balıkçı iskelesinde Mei Teyze ile birlikte ağları onarıp dua ediyordum.',
                clue: 'Tapınakta, iskelede geçen geceyi anlatan bir not.',
                truthReveal: 'Huikang ile Mei Teyze iskeledeydi.',
              }),
            },
          },
        ],
      });
      Object.assign(service, { complete });
      const target = service as unknown as { repairAlibiPlaces: Repair };
      const repaired = (await target.repairAlibiPlaces(
        chinaDraft,
        chinaPlan,
        'china',
        chinaNames,
      )) as unknown as typeof chinaDraft;
      expect(complete).toHaveBeenCalledTimes(1);
      expect(repaired.alibis.graveyard).toContain('iskelesinde');
      // Leş kargasının mazereti ve sırrını taşıyan ipucu değişmez
      expect(repaired.alibis.farm).toBe(chinaDraft.alibis.farm);
      expect(repaired.locationClues.farm).toBe(chinaDraft.locationClues.farm);
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

describe('kısmi tanığın gördüğü yer', () => {
  // Gemini denemesinden (cyberpunk): tanık Brakk Coil, AURA-9'u kendi kliniğinde gördüğünü yazdı
  const names = {
    graveyard: 'Brakk Coil',
    mill: 'AURA-9',
    clinic: 'Vera Nyx',
    church: 'Mirel Sato',
    farm: 'Ash',
  };
  const plan = {
    culpritId: 'farm',
    involvements: [
      { npcId: 'graveyard', kind: 'WITNESS' as const, aboutNpcId: 'mill' },
    ],
  };
  const draft = (prompt: string) => ({
    scenario: '',
    truthReveal: '',
    culpritId: 'farm',
    locationClues: {},
    npcPrompts: { graveyard: prompt },
    alibis: {
      mill: 'AURA-9, cinayet saatinde Velvet Static barının bodrum katında Vera Nyx ile birlikte jeneratörü temizliyordu.',
    },
  });

  it('görülen kişiyi mazeretinde olmayan bir yerde anan cümle rol metninden çıkar', () => {
    const result = dropWrongSightings(
      draft(
        "Sen bir sokak cerrahısın. Cinayet gecesi siber kliniğin arka kapısının çıkışında AURA-9'u kendi gözlerinle gördün. Kimseye güvenmezsin.",
      ),
      plan,
      names,
      'cyberpunk',
    );
    expect(result.npcPrompts.graveyard).toBe(
      'Sen bir sokak cerrahısın. Kimseye güvenmezsin.',
    );
  });

  it('yer mazeretle uyuşuyorsa ya da hiç yer geçmiyorsa cümle kalır', () => {
    for (const prompt of [
      "Cinayet gecesi AURA-9'u barın arka kapısında gördün.",
      "Cinayet gecesi AURA-9'u uzaktan gördün.",
    ]) {
      const input = draft(prompt);
      expect(dropWrongSightings(input, plan, names, 'cyberpunk')).toBe(input);
    }
  });

  it('katili gören doğrulayan tanığa dokunmaz', () => {
    const input = draft("Ash'i kliniğin arka kapısında gördün.");
    const culpritPlan = {
      culpritId: 'farm',
      involvements: [
        { npcId: 'graveyard', kind: 'WITNESS' as const, aboutNpcId: 'farm' },
      ],
    };
    expect(dropWrongSightings(input, culpritPlan, names, 'cyberpunk')).toBe(
      input,
    );
  });
});

describe('katilin örtü hikâyesi', () => {
  const names = { mill: 'Değirmenci Giles', tavern: 'Kardeş Aldric' };
  const plan = {
    culpritId: 'mill',
    motive: 'DEBT' as const,
    weaponId: 'hammer',
  };
  const draft = (culpritCover?: string) => ({
    scenario: '',
    truthReveal: '',
    culpritId: 'mill',
    npcPrompts: {},
    locationClues: {},
    culpritCover,
  });
  const fallback = (cover?: string) =>
    ensureCulpritCover(draft(cover), plan, names, 'medieval').culpritCover;

  it('uygun örtü hikâyesine dokunmaz; olay yerini inkâr etmek serbesttir', () => {
    for (const cover of [
      'O gece değirmende tek başıma un çuvallarını sayıyordum. Kurbana borcum vardı, bu yüzden sustum.',
      'Köy kuyusuna o gece hiç gitmedim; değirmende yalnızdım ve kurbana olan borcumu saklıyordum.',
    ]) {
      expect(fallback(cover)).toBe(cover);
    }
  });

  it('başka şüpheliyi, kanı ya da cinayet aletini anan ya da boş hikâye koddan sade bir yalanla değişir', () => {
    for (const bad of [
      undefined,
      '',
      'O gece Kardeş Aldric ile birlikteydim.',
      'Önlüğümdeki kan tavuk kesmekten.',
      'Demirci çekicini o gece ödünç verdim.',
    ]) {
      const cover = fallback(bad);
      expect(cover).toContain('Değirmen içinde tek başımaydım');
      expect(cover).not.toContain('Aldric');
    }
  });

  it('eski planda (motif yok) örtü hikâyesi istenmez', () => {
    const input = draft();
    expect(
      ensureCulpritCover(
        input,
        { ...plan, motive: undefined },
        names,
        'medieval',
      ),
    ).toBe(input);
  });
});
