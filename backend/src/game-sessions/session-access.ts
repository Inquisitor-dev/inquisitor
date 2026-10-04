import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    throw new NotFoundException('Oturum bulunamadi.');
  }
  return session;
}

// Aktif oturumda suçlu, gerçek hikaye ve mekan ipuçları oyuncuya gönderilmez:
// tarayıcının ağ sekmesinden okunup vakanın cevabını ele verirler. Oyun bitince açılırlar.
export function toPublicSession<
  T extends {
    status: string;
    culpritId?: unknown;
    truthReveal?: unknown;
    locationClues?: unknown;
  },
>(session: T) {
  if (session.status !== 'ACTIVE') return session;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { culpritId, truthReveal, locationClues, ...publicSession } = session;
  return publicSession;
}
