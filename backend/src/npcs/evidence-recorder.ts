import { PrismaService } from '../prisma/prisma.service';
import type { EvidenceDraft } from './evidence';

// Daha önce kaydedilmemiş kanıtları ekler ve sadece yenilerini döndürür
export async function recordEvidence(
  prisma: PrismaService,
  sessionId: string,
  dayNumber: number,
  existing: { kind: string; sourceId: string }[],
  drafts: EvidenceDraft[],
) {
  const fresh = drafts.filter(
    (draft) => !existing.some((e) => e.kind === draft.kind && e.sourceId === draft.sourceId),
  );
  const created: Array<EvidenceDraft & { id: string; dayNumber: number }> = [];
  for (const draft of fresh) {
    try {
      const row = await prisma.evidence.create({
        data: { ...draft, sessionId, dayNumber },
        select: { id: true, kind: true, category: true, sourceId: true, text: true, dayNumber: true },
      });
      created.push(row as EvidenceDraft & { id: string; dayNumber: number });
    } catch (err) {
      // Aynı anda gelen iki istek aynı kanıtı yazmaya çalışırsa ikincisi atlanır
      if ((err as { code?: string }).code !== 'P2002') throw err;
    }
  }
  return created;
}

export async function appendStatementsToNotes(
  prisma: PrismaService,
  sessionId: string,
  statements: { sourceId: string; text: string; dayNumber: number }[],
  nameOf: (npcId: string) => string,
): Promise<string | undefined> {
  if (statements.length === 0) return undefined;
  return appendToNotes(
    prisma,
    sessionId,
    statements.map(
      (statement) => `[${statement.dayNumber}. gün · ${nameOf(statement.sourceId)}] ${statement.text}`,
    ),
  );
}

// Not defterinin sonuna paragraf paragraf ekler ve notların son hâlini döndürür
export async function appendToNotes(
  prisma: PrismaService,
  sessionId: string,
  lines: string[],
): Promise<string> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    select: { notes: true },
  });
  const current = (session?.notes ?? '').trimEnd();
  const notes = [current, ...lines].filter(Boolean).join('\n\n');
  await prisma.gameSession.update({ where: { id: sessionId }, data: { notes } });
  return notes;
}
