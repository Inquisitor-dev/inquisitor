// Çelişki Taraması ölçümü: `npm run abilities:scan-eval -- <seçenekler>` (gerçek Gemini)
//   --fixtures-only         yalnızca bilinen cevaplı deneme setleri
//   --real N                yerel veritabanından en çok N gerçek konuşma (varsayılan 35; katiller önce)
//   --out dosya.json        sonuçları JSON olarak kaydeder
// Deneme setleri: çelişkisi bilinen ve çelişkisiz cevap dizileri (yakalama ve yanlış alarm).
// Gerçek konuşmalar: katil ile masumlarda bulunan çelişki oranı (tarama katili ele veriyor mu).
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { LlmService } from '../src/llm/llm.service';
import type { LlmUsageRecorder } from '../src/llm/usage/llm-usage.recorder';
import type { Contradiction } from '../src/llm/prompts/contradiction-prompt.builder';
import { getScenarioConfig } from '../src/scenarios/scenario-config';
import type { CaseFacts } from '../src/scenarios/case-setup';

Logger.overrideLogger(['warn', 'error']);

const SCAN_REPLIES = 12;
const PAUSE_MS = 1200;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : '';
}

let tokens = 0;
const recorder = {
  record: (
    _c: unknown,
    _m: string,
    t: { total_tokens?: number } | undefined,
  ) => {
    tokens += t?.total_tokens ?? 0;
    return Promise.resolve();
  },
};
const llm = new LlmService(recorder as unknown as LlmUsageRecorder);

interface Fixture {
  id: string;
  expect: boolean; // gerçek bir çelişki var mı
  replies: string[];
}

// Ortaçağ kasabası; cevaplar kısa tutuldu, oyundaki NPC cevaplarına benzer
const FIXTURES: Fixture[] = [
  {
    id: 'saat',
    expect: true,
    replies: [
      'Ne mi yapıyordum? O gece meyhanede kapanışa kadar tezgâhın başındaydım, ayrılmadım.',
      'Değirmenci mi? Onu pek tanımam, selamlaşırız o kadar.',
      'Yağmur başladığında, gece yarısından az önce, çoktan evime dönmüştüm. Meyhaneyi çırağa bırakmıştım.',
      'Bana bu soruları sorup durma, işim başımdan aşkın.',
    ],
  },
  {
    id: 'yer',
    expect: true,
    replies: [
      'Bütün akşam kilisedeydim, mumları yakıyor, sıraları siliyordum.',
      'Rahip Efendi şahidimdir, beni orada görmüştür.',
      'Mezarlığa mı? Hayır, o gece mezarlık tarafına hiç uğramadım.',
      'Mezarlıktaki kuyudan su çekerken bir fener gördüm, o kadar.',
    ],
  },
  {
    id: 'kisi',
    expect: true,
    replies: [
      'O gece yalnızdım, kimseyle konuşmadım. Erkenden yattım.',
      'Kurbanla aramda bir husumet yoktu.',
      'Kız kardeşim yanımdaydı, birlikte yün eğirdik sabaha kadar. O da söyler.',
    ],
  },
  {
    id: 'esya',
    expect: true,
    replies: [
      'Benim evimde bıçak falan bulunmaz, ekmeği elle bölerim ben.',
      'Kasap dükkânının önünden geçtim, evet, ama içeri girmedim.',
      'Dün akşam bıçağımı bileğitaşında biledim, körelmişti.',
      'Daha ne soracaksın?',
    ],
  },
  {
    id: 'inkar-sonra-kabul',
    expect: true,
    replies: [
      'Değirmen mi? Ben o gece neden değirmene gideyim ki?',
      'Değirmenciyle aram iyidir, ama gece işim olmaz orada.',
      'Peki, peki... Evet, o gece değirmene uğradım, un borcumu ödemeye.',
    ],
  },
  {
    id: 'sirali-temiz',
    expect: false,
    replies: [
      'Akşam meyhanedeydim, iki kadeh içtim.',
      'Gece yarısına doğru kalkıp eve döndüm, yağmur çiseliyordu.',
      'Evde karım uyuyordu, onu uyandırmadım.',
      'Sabah da erkenden tarlaya çıktım.',
    ],
  },
  {
    id: 'ruh-hali',
    expect: false,
    replies: [
      'Hoş geldin dedektif, buyur otur.',
      'Bak, beni sinirlendirme! Değirmende çalışıyordum dedim ya.',
      'Özür dilerim, sesimi yükselttim. Evet, bütün gece değirmendeydim, un çuvallarını taşıdım.',
      'Başka bir şey bilmiyorum, gerçekten.',
    ],
  },
  {
    id: 'belirsiz-sonra-ayrinti',
    expect: false,
    replies: [
      'Hatırlamıyorum, bir yerlerdeydim işte.',
      'Galiba ahırdaydım, hayvanlara bakıyordum.',
      'Evet, ahırdaydım; ineklerden biri hastaydı, sabaha kadar başında bekledim.',
    ],
  },
  {
    id: 'baskasi-hakkinda',
    expect: false,
    replies: [
      'Ben o gece fırındaydım, hamur yoğuruyordum.',
      'Demirci meyhanedeydi derler, ama ben görmedim.',
      'Biri de demircinin değirmen yolunda olduğunu söyledi. Bilmiyorum, ben fırından çıkmadım.',
    ],
  },
  {
    id: 'kimseyi-gormedim-tartisma',
    expect: false,
    replies: [
      'O gece kimsecikleri görmedim, kapımı sürgüledim, yattım.',
      'Tüccar mı? Onunla geçen hafta bir borç yüzünden tartışmıştık, doğru.',
      'Ama o gece onu görmedim, yemin ederim.',
    ],
  },
  {
    id: 'koyden-cikmadim-kule',
    expect: false,
    replies: [
      'O gece köyün dışına adım bile atmadım.',
      'Gözcü Kulesi mi? Hayır, oraya gitmedim.',
      'Köydeydim, mezarlıkta kazıyla uğraşıyordum.',
    ],
  },
];

async function scan(name: string, replies: string[], universe: string) {
  const found = await llm.findContradictions(name, replies, universe);
  await sleep(PAUSE_MS);
  return found;
}

const GUILT = /katil|suçlu|cinayeti (o|kendisi)|öldürd/i;

function show(found: Contradiction[]) {
  for (const c of found) {
    const flag = GUILT.test(c.note) ? '  [SUÇ İMASI?]' : '';
    console.log(
      `     “${c.quoteA}” / “${c.quoteB}”\n       → ${c.note}${flag}`,
    );
  }
}

async function runFixtures() {
  console.log('\n=== Deneme setleri ===');
  let hit = 0;
  let falseAlarm = 0;
  let failed = 0;
  const out: unknown[] = [];
  for (const f of FIXTURES) {
    const found = await scan('Tanık', f.replies, 'medieval');
    if (!found) failed++;
    else if (f.expect && found.length > 0) hit++;
    else if (!f.expect && found.length > 0) falseAlarm++;
    const verdict = !found
      ? 'OKUNAMADI'
      : f.expect === found.length > 0
        ? 'doğru'
        : 'YANLIŞ';
    console.log(
      `  ${f.id} (çelişki ${f.expect ? 'var' : 'yok'}): ${found?.length ?? '-'} madde · ${verdict}`,
    );
    if (found) show(found);
    out.push({ id: f.id, expect: f.expect, found });
  }
  const withC = FIXTURES.filter((f) => f.expect).length;
  console.log(
    `  Yakalama ${hit}/${withC}, yanlış alarm ${falseAlarm}/${FIXTURES.length - withC}, okunamayan ${failed}`,
  );
  return out;
}

async function runReal(limit: number) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const sessions = await prisma.gameSession.findMany({
    where: { isTestMode: false },
    select: {
      id: true,
      culpritId: true,
      scenarioType: true,
      difficulty: true,
      caseFacts: true,
    },
  });
  type Thread = {
    session: (typeof sessions)[number];
    npcId: string;
    replies: string[];
    culprit: boolean;
  };
  const threads: Thread[] = [];
  for (const session of sessions) {
    const rows = await prisma.dialogueHistory.findMany({
      where: {
        sessionId: session.id,
        speaker: 'NPC',
        npcId: { not: 'crime_scene' },
      },
      orderBy: { createdAt: 'asc' },
      select: { npcId: true, message: true },
    });
    const byNpc = new Map<string, string[]>();
    for (const r of rows)
      byNpc.set(r.npcId, [...(byNpc.get(r.npcId) ?? []), r.message]);
    for (const [npcId, replies] of byNpc) {
      // Tarama yalnızca şüphelilere uygulanır, anlatıcılara değil
      if (replies.length < 4 || npcId.startsWith('narrator_')) continue;
      threads.push({
        session,
        npcId,
        replies: replies.slice(-SCAN_REPLIES),
        culprit: npcId === session.culpritId,
      });
    }
  }
  await prisma.$disconnect();
  await pool.end();

  // Katillerin hepsi, kalan yer masumlardan (en uzun konuşmalar önce)
  const byLength = (a: Thread, b: Thread) =>
    b.replies.length - a.replies.length;
  const culprits = threads.filter((t) => t.culprit).sort(byLength);
  const innocents = threads.filter((t) => !t.culprit).sort(byLength);
  const half = Math.min(culprits.length, Math.floor(limit / 2));
  const picked = [
    ...culprits.slice(0, half),
    ...innocents.slice(0, limit - half),
  ];

  console.log(`\n=== Gerçek konuşmalar (${picked.length}: ${half} katil) ===`);
  const stats = {
    culprit: { n: 0, flagged: 0, items: 0 },
    innocent: { n: 0, flagged: 0, items: 0 },
  };
  let failed = 0;
  const out: unknown[] = [];
  for (const t of picked) {
    const config = getScenarioConfig(t.session.scenarioType, 'hard');
    const name =
      config.npcDefinitions.find((n) => n.id === t.npcId)?.name ?? t.npcId;
    const facts = t.session.caseFacts as unknown as CaseFacts | null;
    const role = t.culprit
      ? 'KATİL'
      : (facts?.involvements?.find((i) => i.npcId === t.npcId)?.kind ??
        'masum');
    const found = await scan(name, t.replies, t.session.scenarioType);
    if (!found) {
      failed++;
      console.log(`  ${name} [${role}] ${t.replies.length} cevap: OKUNAMADI`);
      continue;
    }
    const s = t.culprit ? stats.culprit : stats.innocent;
    s.n++;
    s.items += found.length;
    if (found.length) s.flagged++;
    console.log(
      `  ${name} [${role}] ${t.replies.length} cevap: ${found.length} madde`,
    );
    show(found);
    out.push({
      session: t.session.id,
      npcId: t.npcId,
      role,
      replies: t.replies,
      found,
    });
  }
  const pct = (a: number, b: number) =>
    b ? `${Math.round((a / b) * 100)}%` : '-';
  console.log(
    `  Katil: ${stats.culprit.flagged}/${stats.culprit.n} konuşmada çelişki (${pct(stats.culprit.flagged, stats.culprit.n)}), ${stats.culprit.items} madde`,
  );
  console.log(
    `  Masum: ${stats.innocent.flagged}/${stats.innocent.n} konuşmada çelişki (${pct(stats.innocent.flagged, stats.innocent.n)}), ${stats.innocent.items} madde`,
  );
  console.log(`  Okunamayan: ${failed}`);
  return out;
}

async function main() {
  const fixtures = await runFixtures();
  const real = process.argv.includes('--fixtures-only')
    ? []
    : await runReal(Number(option('real')) || 35);
  console.log(`\nToplam token: ${tokens}`);
  const outPath = option('out');
  if (outPath)
    writeFileSync(outPath, JSON.stringify({ fixtures, real, tokens }, null, 2));
}

void main();
