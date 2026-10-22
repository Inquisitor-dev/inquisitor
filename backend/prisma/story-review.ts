// Hikâye hakemi denemesi: `npm run stories:review -- <seçenekler>`
//   --fixtures [--repeat N]  deneme setini (temiz vaka + tek hatalı kopyalar) gerçek Gemini hakeminden
//                            geçirir; yakalama oranını ve temiz vakadaki yanlış alarmı ölçer
//   --generate N             oyundaki yoldan N vaka üretip hakemden geçirir (veritabanı gerekmez)
//     [--universe medieval]  evren (varsayılan: hepsi sırayla)
//     [--difficulty easy]    zorluk (varsayılan: hepsi sırayla)
//   --sessions N             yerel veritabanındaki son N gerçek (Vaka Motoru v2) vakayı hakemden geçirir
//     [--only a,b]           yalnızca bu id'li deneme vakaları
//   --verbose                deneme setinde de her bulguyu alıntısıyla yazar
//   --out dosya.json         bütün sonuçları JSON olarak kaydeder
// Token kullanımı veritabanına değil, bu komutun raporuna yazılır.
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { LlmService } from '../src/llm/llm.service';
import type {
  LlmUsageContext,
  LlmUsageRecorder,
} from '../src/llm/usage/llm-usage.recorder';
import { getScenarioConfig } from '../src/scenarios/scenario-config';
import { CaseFacts, planCase } from '../src/scenarios/case-setup';
import { UNIVERSE_REGISTRY } from '../src/scenarios/universes';
import { buildCaseFacts } from '../src/game-sessions/case-facts';
import {
  StoryReviewInput,
  StoryReviewResult,
  reviewStory,
} from '../src/stories/story-review';
import { REVIEW_FIXTURES } from '../src/stories/review-fixtures';
import { evaluateFixture, summarizeFixtures } from '../src/stories/review-eval';

Logger.overrideLogger(['warn', 'error']);

const DIFFICULTIES = ['easy', 'medium', 'hard'];
// Kotayı zorlamamak için iki vaka arasında kısa bekleme
const PAUSE_MS = 1500;

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

const count = (name: string, fallback: number) => {
  const value = Number(option(name));
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Çağrıların token kullanımı bellekte toplanır; her vakadan önce sıfırlanır
const usage = { generation: 0, review: 0 };
const recorder = {
  record: (
    context: LlmUsageContext,
    _model: string,
    tokens: { total_tokens?: number } | undefined,
  ) => {
    const total = tokens?.total_tokens ?? 0;
    if (context.kind === 'STORY_REVIEW') usage.review += total;
    else usage.generation += total;
    return Promise.resolve();
  },
};
const llm = new LlmService(recorder as unknown as LlmUsageRecorder);
const judge = (input: StoryReviewInput, fields: Record<string, string>) =>
  llm.reviewStory(input, fields);

const nameOf = (input: StoryReviewInput, id: string) =>
  getScenarioConfig(input.scenarioType, 'hard').npcDefinitions.find(
    (npc) => npc.id === id,
  )?.name ?? id;

function printResult(
  label: string,
  input: StoryReviewInput,
  result: StoryReviewResult,
) {
  const tokens =
    (usage.generation ? `üretim ${usage.generation} + ` : '') +
    `hakem ${usage.review} token`;
  console.log(
    `\n${label} · katil: ${nameOf(input, input.facts.culpritId)} · karar: ${result.verdict}${result.judged ? '' : ' (hakem çalışmadı)'} · ${tokens}`,
  );
  for (const issue of result.issues) {
    console.log(
      `  - ${issue.severity} ${issue.category} [${issue.field}] “${issue.quote}” — ${issue.note}${issue.source === 'CODE' ? ' (kod)' : ''}`,
    );
  }
}

async function runFixtures(verbose: boolean) {
  const repeat = count('repeat', 1);
  const only = option('only')?.split(',').filter(Boolean);
  const fixtures = only?.length
    ? REVIEW_FIXTURES.filter((fixture) => only.includes(fixture.id))
    : REVIEW_FIXTURES;
  const runs: {
    fixture: (typeof REVIEW_FIXTURES)[number];
    result: StoryReviewResult;
    tokens: number;
  }[] = [];
  for (let round = 1; round <= repeat; round++) {
    for (const fixture of fixtures) {
      usage.review = 0;
      const result = await reviewStory(fixture.input, judge);
      runs.push({ fixture, result, tokens: usage.review });
      if (verbose)
        printResult(`[${round}] ${fixture.id}`, fixture.input, result);
      await sleep(PAUSE_MS);
    }
  }

  console.log(`\nDeneme seti (${repeat} tur)`);
  console.table(
    runs.map(({ fixture, result, tokens }) => {
      const evaluation = evaluateFixture(fixture, result);
      return {
        vaka: fixture.id,
        beklenen: fixture.expect.join('/') || '-',
        sonuç: evaluation.outcome,
        'doğru alan':
          evaluation.fieldMatch === null
            ? '-'
            : evaluation.fieldMatch
              ? 'evet'
              : 'hayır',
        fazladan: evaluation.extra,
        karar: result.verdict,
        token: tokens,
      };
    }),
  );
  const summary = summarizeFixtures(runs);
  const tokens = runs.map((run) => run.tokens);
  console.log(
    `Yakalanan: ${summary.caught}/${summary.broken} · temiz vakada yanlış alarm: ${summary.falseAlarms}/${summary.clean}` +
      ` · hakem çalışmadı: ${summary.unjudged} · ortalama ${Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length)} token`,
  );
  return { summary, runs };
}

async function runGenerated(total: number) {
  const universes = option('universe')
    ? [option('universe')!]
    : Object.keys(UNIVERSE_REGISTRY);
  const difficulties = option('difficulty')
    ? [option('difficulty')!]
    : DIFFICULTIES;
  const cases: { input: StoryReviewInput; result: StoryReviewResult }[] = [];
  for (let i = 0; i < total; i++) {
    const scenarioType = universes[i % universes.length];
    const difficulty = difficulties[i % difficulties.length];
    usage.generation = 0;
    usage.review = 0;
    try {
      const config = getScenarioConfig(scenarioType, difficulty);
      const plan = planCase(config, difficulty);
      const draft = await llm.generateSessionScenario(
        difficulty,
        scenarioType,
        plan,
      );
      const suspects = config.npcDefinitions.map((npc) => npc.id);
      const input: StoryReviewInput = {
        scenarioType,
        facts: buildCaseFacts(plan, draft),
        scenario: draft.scenario,
        truthReveal: draft.truthReveal,
        npcPrompts: Object.fromEntries(
          suspects.map((id) => [id, draft.npcPrompts?.[id] ?? '']),
        ),
        locationClues: draft.locationClues ?? {},
      };
      const result = await reviewStory(input, judge);
      printResult(
        `[${i + 1}/${total}] ${scenarioType} · ${difficulty}`,
        input,
        result,
      );
      cases.push({ input, result });
    } catch (error) {
      console.log(
        `\n[${i + 1}/${total}] ${scenarioType} · ${difficulty}: vaka üretilemedi (${error})`,
      );
    }
    await sleep(PAUSE_MS);
  }
  return cases;
}

async function runSessions(total: number) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const sessions = await prisma.gameSession.findMany({
      where: { isTestMode: false },
      orderBy: { createdAt: 'desc' },
      take: total * 5,
      include: { npcStates: { select: { npcId: true, dynamicPrompt: true } } },
    });
    // Yalnızca Vaka Motoru v2 vakaları: eski vakalarda hakemin baktığı alanlar yok
    const v2 = sessions
      .filter((s) => (s.caseFacts as CaseFacts | null)?.involvements)
      .slice(0, total);
    if (v2.length === 0)
      console.log('Veritabanında Vaka Motoru v2 ile açılmış gerçek vaka yok.');

    const cases: { input: StoryReviewInput; result: StoryReviewResult }[] = [];
    for (const [i, session] of v2.entries()) {
      const facts = session.caseFacts as unknown as CaseFacts;
      const suspects = [facts.culpritId, ...facts.innocentIds];
      usage.generation = 0;
      usage.review = 0;
      const input: StoryReviewInput = {
        scenarioType: session.scenarioType,
        facts,
        scenario: session.scenario ?? '',
        truthReveal: session.truthReveal ?? '',
        npcPrompts: Object.fromEntries(
          session.npcStates
            .filter((state) => suspects.includes(state.npcId))
            .map((state) => [state.npcId, state.dynamicPrompt ?? '']),
        ),
        locationClues: (session.locationClues ?? {}) as Record<string, string>,
      };
      const result = await reviewStory(input, judge);
      printResult(
        `[${i + 1}/${v2.length}] ${session.id.slice(0, 8)} · ${session.scenarioType} · ${session.difficulty}`,
        input,
        result,
      );
      cases.push({ input, result });
      await sleep(PAUSE_MS);
    }
    return cases;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY tanımlı değil (backend/.env).');
    process.exitCode = 1;
    return;
  }
  const report: Record<string, unknown> = {};
  if (option('fixtures') !== undefined)
    report.fixtures = await runFixtures(option('verbose') !== undefined);
  if (option('generate') !== undefined)
    report.generated = await runGenerated(count('generate', 1));
  if (option('sessions') !== undefined)
    report.sessions = await runSessions(count('sessions', 5));
  if (Object.keys(report).length === 0) {
    console.log(
      'Kullanım: npm run stories:review -- --fixtures [--repeat N] [--only a,b] | --generate N [--universe X] [--difficulty Y] | --sessions N [--verbose] [--out dosya.json]',
    );
    return;
  }
  const out = option('out');
  if (out) {
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(`\nSonuçlar ${out} dosyasına yazıldı.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
