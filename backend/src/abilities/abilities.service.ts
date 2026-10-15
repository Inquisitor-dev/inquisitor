import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { findOwnedSession } from '../game-sessions/session-access';
import { abilitiesFor, availability, parseAbilityState } from './abilities';

@Injectable()
export class AbilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  // Vakadaki karakterin yetenekleri ve şu an kullanılıp kullanılamayacakları
  async list(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    return {
      characterId: session.characterId,
      abilityState: parseAbilityState(session.abilityState),
      abilities: abilitiesFor(session.characterId).map((ability) => {
        const check = availability(session, ability);
        return {
          id: ability.id,
          name: ability.name,
          limit: ability.limit,
          target: ability.target,
          available: check.available,
          reason: check.available ? null : check.reason,
        };
      }),
    };
  }
}
