// Gece baskınının oturuma bağlanması: baskın gecesinde gün kapanmaz, baskın başlar; oyuncu aksiyonlarla
// ilerler (POST /game-sessions/:id/raid/act), baskın bitince sonucu uygulanır ve gün kapanır.
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { effectivePersonaPlan } from '../scenarios/personas/detention';
import {
  act,
  availableActions,
  MAX_TURNS,
  openingEvents,
  startRaid,
  type RaidAction,
  type RaidOptions,
} from './raid-engine';
import { raidActionLabel, raidEventText, raidRoomName } from './raid-texts';
import { parsePersonaState, type PersonaState } from './persona-night';

// Kötü sonuçta bu vakanın ödülünden kesilen pay (oyuncunun akçe bakiyesine dokunulmaz)
export const RAID_REWARD_PENALTY = 0.2;
// Çatı Geçişi gecesi: oyuncu dışarıdayken ev aranır; daha küçük kesinti, kanıt çalınmaz
export const SEARCHED_REWARD_PENALTY = 0.1;

interface RaidSession {
  id: string;
  difficulty: string;
  characterId: string;
  scenarioType: string;
  caseFacts: unknown;
  personaState: unknown;
}

export const raidOptions = (session: RaidSession): RaidOptions => ({
  hard: session.difficulty === 'hard',
  // Mavi Rozet baskında silahını çekebilir
  hasGun: session.characterId === 'mavi_rozet',
});

// Bu gecenin baskını (planlıysa ve henüz başlamadıysa)
export function pendingRaid(session: RaidSession, night: number) {
  const event = effectivePersonaPlan(
    session.caseFacts,
    session.personaState,
  ).events.find((e) => e.kind === 'RAID' && e.night === night);
  const state = parsePersonaState(session.personaState);
  return event && state.raid?.night !== night ? event : null;
}

// Süren baskın (yoksa null)
export function activeRaid(state: PersonaState) {
  return state.raid && !state.raid.outcome ? state.raid : null;
}

async function saveState(
  prisma: PrismaService,
  id: string,
  state: PersonaState,
) {
  await prisma.gameSession.update({
    where: { id },
    data: { personaState: state as unknown as Prisma.InputJsonValue },
  });
}

// Baskını başlatır: oyuncu yatak odasında karanlıkta uyanır. Kar Kâhini saldırganın odasını rüyada görmüştür.
export async function beginRaid(
  prisma: PrismaService,
  session: RaidSession,
  night: number,
  playerAway = false,
) {
  const event = pendingRaid(session, night);
  if (!event) return null;
  // Oyuncu o gece Çatı Geçişi'yle dışarıdaydı: baskın olmaz, ev aranmış bulunur. Gün olağan kapanır.
  if (playerAway) {
    const prev = parsePersonaState(session.personaState);
    await saveState(prisma, session.id, {
      ...prev,
      rewardPenalty: (prev.rewardPenalty ?? 0) + SEARCHED_REWARD_PENALTY,
      raid: {
        night,
        state: startRaid(event.raidStart ?? 'HALLWAY'),
        log: [
          'Eve döndüğünde kapı aralık: biri sen yokken içeri girip her yeri karıştırmış.',
        ],
        outcome: 'SEARCHED',
      },
    });
    return null;
  }
  const raid = startRaid(
    event.raidStart ?? 'HALLWAY',
    session.characterId === 'kar_kahini',
  );
  const intro = ['Gece yarısı bir gıcırtıyla uyanıyorsun. Evde biri var.'];
  if (raid.known) {
    intro.push(
      `Rüyanda gördüğün gibi: ${raidRoomName(session.scenarioType, raid.known)} tarafında bekliyor.`,
    );
  }
  const state: PersonaState = {
    ...parsePersonaState(session.personaState),
    raid: {
      night,
      state: raid,
      log: [
        ...intro,
        ...openingEvents(raid).map((e) =>
          raidEventText(session.scenarioType, e),
        ),
      ],
      outcome: null,
    },
  };
  await saveState(prisma, session.id, state);
  return state.raid;
}

// Bir aksiyon: durum makinesi ilerler, anlatım eklenir; baskın bittiyse kötü sonucun bedeli yazılır
export async function applyRaidAction(
  prisma: PrismaService,
  session: RaidSession,
  action: RaidAction,
) {
  const state = parsePersonaState(session.personaState);
  const raid = activeRaid(state);
  if (!raid) return null;
  const result = act(raid.state, action, raidOptions(session));
  const next: PersonaState = {
    ...state,
    raid: {
      ...raid,
      state: result.state,
      log: [
        ...raid.log,
        ...result.events.map((e) => raidEventText(session.scenarioType, e)),
      ],
      outcome: result.state.outcome,
    },
  };
  if (result.state.outcome === 'BAD') {
    next.rewardPenalty = (next.rewardPenalty ?? 0) + RAID_REWARD_PENALTY;
    const stolen = await pickStolenEvidence(prisma, session.id, next);
    if (stolen)
      next.stolenEvidenceIds = [...(next.stolenEvidenceIds ?? []), stolen];
  }
  await saveState(prisma, session.id, next);
  return next.raid!;
}

// Çalınacak kanıt: oyuncunun bulduğu bir eşya. Olay yeri izi ve beden her zaman yeniden görülebildiği için
// ve bonus izler (mektup, baskın izi) çalınmaz. Plan "tek kritik kanıt yok" kuralıyla kurulduğu için
// (isPlanSound) herhangi bir eşyanın gitmesi vakayı çözülemez yapmaz.
async function pickStolenEvidence(
  prisma: PrismaService,
  sessionId: string,
  state: PersonaState,
): Promise<string | null> {
  const items = await prisma.evidence.findMany({
    where: {
      sessionId,
      category: 'ITEM',
      kind: { notIn: ['LETTER', 'RAID_TRACE', 'BODY'] },
      sourceId: { not: 'crime_scene' },
      id: { notIn: state.stolenEvidenceIds ?? [] },
    },
    select: { id: true },
  });
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)].id;
}

// Oyuncuya gösterilen hâli (cevap ne olacağını söylemez: saldırganın yeri yalnızca anlatımda geçer)
export function raidView(session: RaidSession) {
  const raid = parsePersonaState(session.personaState).raid;
  if (!raid) return { active: false as const };
  const opts = raidOptions(session);
  return {
    active: !raid.outcome,
    night: raid.night,
    room: raid.state.room,
    roomName: raidRoomName(session.scenarioType, raid.state.room),
    light: raid.state.light,
    holding: raid.state.holding,
    turn: raid.state.turn,
    maxTurns: MAX_TURNS,
    actions: availableActions(raid.state, opts).map((id) => ({
      id,
      label: raidActionLabel(session.scenarioType, id),
    })),
    log: raid.log,
    outcome: raid.outcome,
  };
}

// Çalınan kanıtlar: gösterilemez, panoya iğnelenemez, hükme dayanak olamaz
export const stolenIdsOf = (personaState: unknown) =>
  parsePersonaState(personaState).stolenEvidenceIds ?? [];

// Bu vakanın ödül çarpanına baskın kesintisi
export const raidRewardFactor = (personaState: unknown) =>
  Math.max(0, 1 - (parsePersonaState(personaState).rewardPenalty ?? 0));

// Baskında bayılan oyuncu ertesi sabahın ilk dilimini kaybeder
export const raidLostMorning = (personaState: unknown, night: number) => {
  const raid = parsePersonaState(personaState).raid;
  return raid?.night === night && raid.outcome === 'BAD';
};
