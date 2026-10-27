import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { lastDayOf } from '../abilities/abilities';
import type { CaseFacts } from '../scenarios/case-setup';
import { closuresOn } from '../scenarios/personas/closures';
import { detentionOf } from '../scenarios/personas/detention';

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
// Vakanın son günü (lastDay) her cevapta gider: istemci "4. gün" varsaymaz (İkinci Nefes vakayı uzatabilir).
export function toPublicSession<
  T extends {
    status: string;
    culpritId?: unknown;
    truthReveal?: unknown;
    locationClues?: unknown;
    caseFacts?: unknown;
    abilityState?: unknown;
    personaState?: unknown;
    currentDay?: number;
  },
>(session: T) {
  const crimeScene = publicCrimeScene(session.caseFacts);
  // Bugün kapalı mekânlar (kasaba olayı ya da kilit kırma): yalnızca bugün, plan değil
  const closedToday = closuresOn(
    session.caseFacts,
    session.currentDay ?? 1,
    session.personaState,
  );
  // Nezaret hakkı kullanıldı mı (oyuncu kimi aldırdığını zaten bilir)
  const detention = detentionOf(session.personaState);
  // Vakanın son günü (lastDay) her cevapta gider: İkinci Nefes vakayı uzatabilir
  const lastDay = lastDayOf(session.abilityState);
  if (session.status !== 'ACTIVE') {
    return { ...session, crimeScene, lastDay, closedToday, detention };
  }
  // Gece olaylarının kaydı da gönderilmez: gazete kendi uç noktasından gelir (getNewspaper)
  const {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    culpritId,
    truthReveal,
    locationClues,
    caseFacts,
    personaState,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...publicSession
  } = session;
  return { ...publicSession, crimeScene, lastDay, closedToday, detention };
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
