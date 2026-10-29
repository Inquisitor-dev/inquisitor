import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { findOwnedSession } from '../game-sessions/session-access';
import { closedMessage } from '../personas/closure-message';
import { recordEvidence } from '../npcs/evidence-recorder';
import { EVIDENCE_TAG, evidenceFromTags } from '../npcs/evidence';
import type { CaseFacts } from '../scenarios/case-setup';
import { getLocalizedLocationLabel } from '../scenarios/scenario-config';
import { findSearchScene, searchAreas } from './scenes';
import type { SearchSceneDef } from './search-scene';
import {
  applyClick,
  parseSearchState,
  publicView,
  seededRng,
  startAttempt,
  takeHint,
  withExpiry,
  type SearchAttempt,
  type SearchState,
} from './search-game';

type Session = Awaited<ReturnType<typeof findOwnedSession>>;

// Gece (game-sessions.service.ts advanceTime ile aynı sınır)
const MAX_TIME_OF_DAY = 4;

// Mekân araması (tıkla-bul). Arama izniyle başlar. Kanıt mekânın tek bir alanındadır (vaka planı,
// caseFacts.searchAreas; hikâye kanıtı oraya yazar): yalnızca o alan aranabilir, öbürleri kilitlidir ve
// başarısız aramadan sonra da aynı alan yeni listeyle aranır. Asıl yer bulununca mekânın ipucu kanıt olarak
// kaydedilir ve izin harcanır. Kanıt metni her zaman vaka kaydından gelir (locationClues).
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private now() {
    return Date.now();
  }

  private async load(sessionId: string, userId: string, locationId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const state = parseSearchState(session.searchState);
    // Son denemenin sahnesi (denemenin yapıldığı alan)
    const stored = state[locationId];
    const scene = stored
      ? this.sceneFor(session, locationId, stored.areaId)
      : null;
    // Süresi dolan arama okunduğu anda başarısız sayılır ve vaktini harcar
    if (scene && stored?.status === 'RUNNING') {
      const expired = withExpiry(stored, session.difficulty, this.now());
      if (expired.status === 'FAILED') {
        await this.save(session, state, locationId, expired);
      }
    }
    return { session, scene, state };
  }

  private sceneFor(session: Session, locationId: string, areaId: string) {
    return findSearchScene(
      session.scenarioType,
      locationId,
      areaId,
      session.isTestMode,
    );
  }

  // Kanıtın bulunduğu alan: vaka planındaki alan; planda yoksa (havuzdaki eski hikâyeler) ya da o alanın
  // sahnesi kullanılamıyorsa oturuma tohumlanmış biri. Vakaya bakmaz.
  private openArea(session: Session, locationId: string): string | null {
    const areas = searchAreas(
      session.scenarioType,
      locationId,
      session.isTestMode,
    );
    if (areas.length === 0) return null;
    const planned = (
      session.caseFacts as { searchAreas?: Record<string, string> } | null
    )?.searchAreas?.[locationId];
    if (planned && areas.includes(planned)) return planned;
    const rng = seededRng(`${session.id}:${locationId}:area`);
    return areas[Math.floor(rng() * areas.length)];
  }

  // Sahnesi olmayan mekân eski yolla (anlatıcıyla) aranır; istemci buna göre yönlendirir
  async getSearch(sessionId: string, userId: string, locationId: string) {
    const { session, scene, state } = await this.load(
      sessionId,
      userId,
      locationId,
    );
    const areas = searchAreas(
      session.scenarioType,
      locationId,
      session.isTestMode,
    );
    if (areas.length === 0)
      return { available: false, areas, openArea: null, view: null };
    const attempt = state[locationId];
    return {
      available: true,
      areas,
      openArea: this.openArea(session, locationId),
      view: attempt && scene ? this.view(session, scene, attempt) : null,
      timeOfDay: session.timeOfDay,
    };
  }

  async start(
    sessionId: string,
    userId: string,
    locationId: string,
    areaId: string,
  ) {
    const {
      session,
      scene: lastScene,
      state,
    } = await this.load(sessionId, userId, locationId);
    const existing = state[locationId] ?? null;
    // Aranmış mekânın izni harcanmıştır; "izin yok" yerine bu söylenir
    if (existing?.status === 'WON') {
      throw new BadRequestException('Bu mekânı zaten aradın.');
    }
    this.assertCanSearch(session, locationId);
    // Kanıt yalnızca açık alanda aranır; öbür alanlar kilitlidir
    const open = this.openArea(session, locationId);
    if (!open || areaId !== open) {
      throw new BadRequestException(
        'Burada aranmaya değer bir şey görünmüyor.',
      );
    }
    if (existing?.status === 'RUNNING' && lastScene) {
      return {
        view: this.view(session, lastScene, existing),
        timeOfDay: session.timeOfDay,
      };
    }
    const scene = this.sceneFor(session, locationId, open);
    if (!scene) {
      throw new BadRequestException(
        'Bu alanın arama sahnesi henüz hazır değil.',
      );
    }
    // Başarısız aramadan sonra aynı alan yeni liste ve yeni asıl yerle yeniden aranır
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

  // Test modu (yapay zekâsız oturum): işaretlemeyi denetlemek için süren denemenin kutuları.
  // Normal oyunda kutular istemciye hiç gitmez.
  async testSpots(sessionId: string, userId: string, locationId: string) {
    const { session, scene, attempt } = await this.running(
      sessionId,
      userId,
      locationId,
    );
    if (!session.isTestMode) {
      throw new BadRequestException('Yalnızca test modunda kullanılabilir.');
    }
    return {
      targets: scene.objects
        .filter((o) => attempt.targets.includes(o.id))
        .map((o) => ({ id: o.id, label: o.label, box: o.box })),
      finalSpots: scene.finalSpots.map((s) => ({
        id: s.id,
        box: s.box,
        current: s.id === attempt.finalSpotId,
      })),
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
