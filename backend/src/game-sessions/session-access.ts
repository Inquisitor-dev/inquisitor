import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CaseFacts } from '../scenarios/case-setup';

// Oturumu sadece sahibine verir. Başkasının oturumu da "bulunamadı" döner;
// böylece başka kullanıcıların oturum id'lerinin var olup olmadığı dışarı sızmaz.
export async function findOwnedSession(
  prisma: PrismaService,
  sessionId: string,
  userId: string,
) {
  const session = sessionId
    ? await prisma.gameSession.findUnique({ where: { id: sessionId } })
    : null;
  if (!session || session.userId !== userId) {
    throw new NotFoundException('Oturum bulunamadı.');
  }
  return session;
}

// Aktif oturumda suçlu, gerçek hikaye, mekan ipuçları ve vaka gerçekleri oyuncuya gönderilmez:
// tarayıcının ağ sekmesinden okunup vakanın cevabını ele verirler. Oyun bitince açılırlar.
export function toPublicSession<
  T extends {
    status: string;
    culpritId?: unknown;
    truthReveal?: unknown;
    locationClues?: unknown;
    caseFacts?: unknown;
  },
>(session: T) {
  const crimeScene = publicCrimeScene(session.caseFacts);
  if (session.status !== 'ACTIVE') return { ...session, crimeScene };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { culpritId, truthReveal, locationClues, caseFacts, ...publicSession } =
    session;
  return { ...publicSession, crimeScene };
}

// Olay yerinin hangi mekân olduğu ve görünüşü (dağınık/düzenli) cevabı ele vermez: oyuncu ikisini de
// olay yerinde zaten görür. Ön yüz doğru görseli seçsin diye aktif oturumda da gönderilir.
export function publicCrimeScene(
  caseFacts: unknown,
): { id: string; appearance: 'MESSY' | 'TIDY' } | null {
  const facts = caseFacts as Partial<CaseFacts> | null;
  if (!facts?.crimeSceneId) return null;
  return {
    id: facts.crimeSceneId,
    appearance: facts.sceneState === 'MESSY' ? 'MESSY' : 'TIDY',
  };
}
