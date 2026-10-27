// Gece olaylarının oturuma bağlanması: oturum bilgisinden bağlamı kurar, saf gece işleyicisini çağırır.
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { recordEvidence } from '../npcs/evidence-recorder';
import { crimeSceneIdOf, type CaseFacts } from '../scenarios/case-setup';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
} from '../scenarios/scenario-config';
import { personaPlanOf } from '../scenarios/personas/persona-plan';
import { townEventsOf } from '../scenarios/personas/town-events';
import {
  emptyPersonaState,
  firstMorningPaper,
  parsePersonaState,
  processNight,
  type NightContext,
  type NightPlan,
  type PersonaState,
} from './persona-night';
import { fallbackLetter } from './threat-letter';

export function nightContext(session: {
  id: string;
  scenarioType: string;
}): NightContext {
  const npcs = getScenarioConfig(session.scenarioType, 'hard').npcDefinitions;
  return {
    scenarioType: session.scenarioType,
    seed: session.id,
    placeName: (id) => getLocalizedLocationLabel(session.scenarioType, id),
    npcName: (id) => npcs.find((npc) => npc.id === id)?.name ?? id,
  };
}

// Vakanın gece planı: persona, kasaba olayları ve mektubun metni (yazılmamışsa evrenin hazır mektubu)
export function nightPlanOf(
  caseFacts: unknown,
  scenarioType: string,
): NightPlan {
  const facts = caseFacts as Partial<CaseFacts> | null;
  const persona = personaPlanOf(caseFacts);
  const hasLetter = persona.events.some((e) => e.kind === 'THREAT_LETTER');
  return {
    persona,
    townEvents: townEventsOf(caseFacts),
    letter: hasLetter
      ? {
          text: facts?.threatLetter || fallbackLetter(scenarioType),
          trace: facts?.letterTrace || 'belli belirsiz bir leke var',
        }
      : undefined,
  };
}

// Vaka açılırken: ilk sabahın gazetesi cinayeti ve varsa yarınki kapanışı duyurur
export function initialPersonaState(session: {
  id: string;
  scenarioType: string;
  difficulty: string;
  caseFacts: unknown;
}): PersonaState {
  const facts = session.caseFacts as Partial<CaseFacts> | null;
  const scene = getScenarioConfig(
    session.scenarioType,
    session.difficulty,
    crimeSceneIdOf(facts),
  ).crimeScene;
  const place =
    scene?.label ??
    getLocalizedLocationLabel(session.scenarioType, 'crime_scene');
  return {
    ...emptyPersonaState(),
    papers: [
      firstMorningPaper(
        nightContext(session),
        facts?.victim?.name || 'Bir kasabalı',
        place,
        townEventsOf(facts),
      ),
    ],
  };
}

// Gün kapanırken: o gecenin hamleleri işlenir, sabah gazetesi yazılır, olay kartı deftere ve mektup
// envantere düşer
export async function runNight(
  prisma: PrismaService,
  session: {
    id: string;
    scenarioType: string;
    caseFacts: unknown;
    personaState: unknown;
  },
  night: number,
) {
  const result = processNight(
    parsePersonaState(session.personaState),
    nightPlanOf(session.caseFacts, session.scenarioType),
    night,
    nightContext(session),
  );
  await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      personaState: result.state as unknown as Prisma.InputJsonValue,
    },
  });
  if (result.records.length > 0) {
    const existing = await prisma.evidence.findMany({
      where: { sessionId: session.id },
      select: { kind: true, sourceId: true },
    });
    await recordEvidence(
      prisma,
      session.id,
      night + 1,
      existing,
      result.records,
    );
  }
  return result;
}
