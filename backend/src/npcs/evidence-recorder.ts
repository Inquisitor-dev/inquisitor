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

// Hızlı notların (GameSession.notes) sonuna paragraf paragraf ekler ve son hâlini döndürür.
// Yeteneklerin sonuçları (Arşiv Özeti, Muhbir, Çelişki Taraması) buraya yazılır.
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
