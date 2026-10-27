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
import {
  emptyPersonaState,
  firstMorningPaper,
  parsePersonaState,
  processNight,
  type NightContext,
  type PersonaState,
} from './persona-night';

export function nightContext(session: {
  id: string;
  scenarioType: string;
}): NightContext {
  return {
    scenarioType: session.scenarioType,
    seed: session.id,
    placeName: (id) => getLocalizedLocationLabel(session.scenarioType, id),
  };
}

// Vaka açılırken: ilk sabahın gazetesi cinayeti duyurur
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
      ),
    ],
  };
}

// Gün kapanırken: o gecenin hamleleri işlenir, sabah gazetesi yazılır, olay kartı deftere düşer
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
    personaPlanOf(session.caseFacts),
    night,
    nightContext(session),
  );
  await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      personaState: result.state as unknown as Prisma.InputJsonValue,
    },
  });
  if (result.cards.length > 0) {
    const existing = await prisma.evidence.findMany({
      where: { sessionId: session.id },
      select: { kind: true, sourceId: true },
    });
    await recordEvidence(prisma, session.id, night + 1, existing, result.cards);
  }
  return result;
}
