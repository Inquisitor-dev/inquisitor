// Yapay zekâ token kullanım raporu: `npm run usage:report` (isteğe bağlı: son kaç gün, varsayılan 7)
// Çağrı türüne göre ortalamalar ve vaka başına toplamlar LlmUsage tablosundan hesaplanır.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const avg = (sum: number | null, count: number) =>
  count > 0 ? Math.round((sum ?? 0) / count) : 0;

async function main() {
  const days = Number(process.argv[2] ?? 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };

  const byKind = await prisma.llmUsage.groupBy({
    by: ['kind'],
    where,
    _count: { _all: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
  });

  console.log(`\nSon ${days} gün — çağrı türüne göre`);
  console.table(
    byKind
      .sort((a, b) => (b._sum.totalTokens ?? 0) - (a._sum.totalTokens ?? 0))
      .map((row) => ({
        tür: row.kind,
        çağrı: row._count._all,
        'ort. girdi': avg(row._sum.promptTokens, row._count._all),
        'ort. çıktı': avg(row._sum.completionTokens, row._count._all),
        'toplam token': row._sum.totalTokens ?? 0,
      })),
  );

  const bySession = await prisma.llmUsage.groupBy({
    by: ['sessionId'],
    where: { ...where, sessionId: { not: null } },
    _count: { _all: true },
    _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
  });

  const sessions = bySession.filter((row) => row.sessionId);
  const totals = sessions.map((row) => row._sum.totalTokens ?? 0);
  console.log(`\nVaka başına (${sessions.length} vaka)`);
  console.table(
    sessions
      .sort((a, b) => (b._sum.totalTokens ?? 0) - (a._sum.totalTokens ?? 0))
      .slice(0, 20)
      .map((row) => ({
        vaka: row.sessionId!.slice(0, 8),
        çağrı: row._count._all,
        girdi: row._sum.promptTokens ?? 0,
        çıktı: row._sum.completionTokens ?? 0,
        toplam: row._sum.totalTokens ?? 0,
      })),
  );
  if (totals.length > 0) {
    const total = totals.reduce((a, b) => a + b, 0);
    console.log(
      `Vaka başına ortalama: ${Math.round(total / totals.length)} token`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
