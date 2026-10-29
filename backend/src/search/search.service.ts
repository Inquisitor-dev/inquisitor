import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { findOwnedSession } from '../game-sessions/session-access';
import { closedMessage } from '../personas/closure-message';
import { recordEvidence } from '../npcs/evidence-recorder';
import { EVIDENCE_TAG, evidenceFromTags } from '../npcs/evidence';
import type { CaseFacts } from '../scenarios/case-setup';
import { getLocalizedLocationLabel } from '../scenarios/scenario-config';
import { findSearchScene } from './scenes';
import type { SearchSceneDef } from './search-scene';
import {
  applyClick,
  parseSearchState,
  publicView,
  startAttempt,
  takeHint,
  withExpiry,
  type SearchAttempt,
  type SearchState,
} from './search-game';

type Session = Awaited<ReturnType<typeof findOwnedSession>>;

// Gece (game-sessions.service.ts advanceTime ile aynı sınır)
const MAX_TIME_OF_DAY = 4;

// Mekân araması (tıkla-bul). Arama izniyle başlar; asıl yer bulununca mekânın ipucu kanıt olarak
// kaydedilir ve izin harcanır. Kanıt metni her zaman vaka kaydından gelir (locationClues).
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private now() {
    return Date.now();
  }

  private async load(sessionId: string, userId: string, locationId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const scene = findSearchScene(
      session.scenarioType,
      locationId,
      session.isTestMode,
    );
    const state = parseSearchState(session.searchState);
    // Süresi dolan arama okunduğu anda başarısız sayılır ve vaktini harcar
    const stored = state[locationId];
    if (scene && stored?.status === 'RUNNING') {
      const expired = withExpiry(stored, session.difficulty, this.now());
      if (expired.status === 'FAILED') {
        await this.save(session, state, locationId, expired);
      }
    }
    return { session, scene, state };
  }

  // Sahnesi olmayan mekân eski yolla (anlatıcıyla) aranır; istemci buna göre yönlendirir
  async getSearch(sessionId: string, userId: string, locationId: string) {
    const { session, scene, state } = await this.load(
      sessionId,
      userId,
      locationId,
    );
    if (!scene) return { available: false, view: null };
    const attempt = state[locationId];
    return {
      available: true,
      view: attempt ? this.view(session, scene, attempt) : null,
      timeOfDay: session.timeOfDay,
    };
  }

  async start(sessionId: string, userId: string, locationId: string) {
    const { session, scene, state } = await this.load(
      sessionId,
      userId,
      locationId,
    );
    const existing = state[locationId] ?? null;
    // Aranmış mekânın izni harcanmıştır; "izin yok" yerine bu söylenir
    if (existing?.status === 'WON') {
      throw new BadRequestException('Bu mekânı zaten aradın.');
    }
    this.assertCanSearch(session, locationId);
    if (!scene) {
      throw new BadRequestException(
        'Bu mekânın arama sahnesi henüz hazır değil.',
      );
    }
    if (existing?.status === 'RUNNING') {
      return {
        view: this.view(session, scene, existing),
        timeOfDay: session.timeOfDay,
      };
    }
    // Başarısız aramadan sonra yeni liste ve yeni asıl yerle yeniden denenir
    const attempt = startAttempt({
      scene,
      difficulty: session.difficulty,
      seed: `${session.id}:${locationId}`,
      attempt: (existing?.attempt ?? 0) + 1,
      now: this.now(),
    });
    await this.save(session, state, locationId, attempt);
    return {
      view: this.view(session, scene, attempt),
      timeOfDay: session.timeOfDay,
    };
  }

  async click(
    sessionId: string,
    userId: string,
    locationId: string,
    x: number,
    y: number,
  ) {
    const { session, scene, attempt, state } = await this.running(
      sessionId,
      userId,
      locationId,
    );
    const { attempt: next, outcome } = applyClick({
      scene,
      attempt,
      difficulty: session.difficulty,
      x,
      y,
      now: this.now(),
    });
    const evidence =
      outcome.kind === 'FINAL_FOUND'
        ? await this.recordClue(session, locationId)
        : [];
    const saved = await this.save(session, state, locationId, next);
    return {
      outcome: outcome.kind,
      objectId: outcome.kind === 'FOUND' ? outcome.objectId : null,
      view: this.view(session, scene, saved),
      evidence,
      timeOfDay: session.timeOfDay,
    };
  }

  async hint(sessionId: string, userId: string, locationId: string) {
    const { session, scene, attempt, state } = await this.running(
      sessionId,
      userId,
      locationId,
    );
    const result = takeHint({
      scene,
      attempt,
      difficulty: session.difficulty,
      seed: `${session.id}:${locationId}`,
      now: this.now(),
    });
    if (!result) throw new BadRequestException('İpucu hakkın kalmadı.');
    const saved = await this.save(session, state, locationId, result.attempt);
    return {
      hint: result.hint,
      view: this.view(session, scene, saved),
      timeOfDay: session.timeOfDay,
    };
  }

  // Test modu (yapay zekâsız oturum): aramayı tek tıkla bitirir
  async testSolve(sessionId: string, userId: string, locationId: string) {
    const { session, scene, attempt, state } = await this.running(
      sessionId,
      userId,
      locationId,
    );
    if (!session.isTestMode) {
      throw new BadRequestException('Yalnızca test modunda kullanılabilir.');
    }
    const next: SearchAttempt = {
      ...attempt,
      found: [...attempt.targets],
      finalFound: true,
      status: 'WON',
    };
    const evidence = await this.recordClue(session, locationId);
    await this.save(session, state, locationId, next);
    return {
      view: this.view(session, scene, next),
      evidence,
      timeOfDay: session.timeOfDay,
    };
  }

  private async running(sessionId: string, userId: string, locationId: string) {
    const { session, scene, state } = await this.load(
      sessionId,
      userId,
      locationId,
    );
    this.assertCanSearch(session, locationId);
    const attempt = state[locationId];
    if (!scene || !attempt) {
      throw new BadRequestException('Önce aramaya başla.');
    }
    return { session, scene, attempt, state };
  }

  private assertCanSearch(session: Session, locationId: string) {
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }
    const closed = closedMessage(session, locationId);
    if (closed) throw new BadRequestException(closed);
    if (!session.activeWarrants.includes(locationId)) {
      throw new BadRequestException(
        `${getLocalizedLocationLabel(session.scenarioType, locationId)} için arama iznin yok.`,
      );
    }
  }

  // Asıl yer bulundu: mekânın ipucu (doğrulayan kanıt oradaysa o) kaydedilir
  private async recordClue(session: Session, locationId: string) {
    const existing = await this.prisma.evidence.findMany({
      where: { sessionId: session.id },
      select: { kind: true, sourceId: true },
    });
    return recordEvidence(
      this.prisma,
      session.id,
      session.currentDay,
      existing,
      evidenceFromTags({
        tags: new Set([EVIDENCE_TAG.clue]),
        npcId: null,
        locationId,
        culpritId: session.culpritId,
        caseFacts: (session.caseFacts ?? null) as unknown as CaseFacts | null,
        locationClues: (session.locationClues ?? {}) as Record<string, string>,
      }),
    );
  }

  // Kazanılan arama izni harcar (Keskin Göz'deki gibi); başarısız arama günün bir vaktini harcar
  // (gece en son vakittir, ötesine geçmez; günü yalnızca oyuncu kapatır). Oturum ve durum yerinde güncellenir.
  private async save(
    session: Session,
    state: SearchState,
    locationId: string,
    attempt: SearchAttempt,
  ): Promise<SearchAttempt> {
    const won = attempt.status === 'WON';
    const charge =
      attempt.status === 'FAILED' &&
      !attempt.timeCharged &&
      session.status === 'ACTIVE';
    const stored = charge ? { ...attempt, timeCharged: true } : attempt;
    const timeOfDay = charge
      ? Math.min(MAX_TIME_OF_DAY, session.timeOfDay + 1)
      : session.timeOfDay;
    const warrants = won
      ? {
          activeWarrants: session.activeWarrants.filter(
            (w) => w !== locationId,
          ),
          usedWarrants: session.usedWarrants.includes(locationId)
            ? session.usedWarrants
            : [...session.usedWarrants, locationId],
        }
      : {};
    state[locationId] = stored;
    await this.prisma.gameSession.update({
      where: { id: session.id },
      data: {
        searchState: state as unknown as Prisma.InputJsonValue,
        ...warrants,
        ...(charge ? { timeOfDay } : {}),
      },
    });
    Object.assign(session, warrants, { timeOfDay, searchState: state });
    return stored;
  }

  private view(
    session: Session,
    scene: SearchSceneDef,
    attempt: SearchAttempt,
  ) {
    return publicView({
      scene,
      attempt,
      difficulty: session.difficulty,
      now: this.now(),
    });
  }
}
