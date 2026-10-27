import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getScenarioConfig } from '../scenarios/scenario-config';
import { findOwnedSession } from '../game-sessions/session-access';
import { parseStoredNotebook, sanitizeNotebook } from './notebook';

@Injectable()
export class NotebookService {
  constructor(private readonly prisma: PrismaService) {}

  // Defterin kayıt kartları: oyuncunun aldığı ifadeler (itiraf ve tanıklık) ve gece olayları
  private loadStatements(sessionId: string) {
    return this.prisma.evidence.findMany({
      where: { sessionId, category: { in: ['STATEMENT', 'EVENT'] } },
      select: {
        id: true,
        kind: true,
        sourceId: true,
        text: true,
        dayNumber: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Sayfaya bantlanabilecek fiziksel kanıtlar
  private async loadItemEvidenceIds(sessionId: string) {
    const rows = await this.prisma.evidence.findMany({
      where: { sessionId, category: 'ITEM' },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async getNotebook(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const statements = await this.loadStatements(sessionId);
    const config = getScenarioConfig(session.scenarioType, session.difficulty);
    const nameOf = (id: string) =>
      config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;

    return {
      notebook: parseStoredNotebook(session.notebookState),
      records: statements.map((s) => ({
        evidenceId: s.id,
        kind: s.kind,
        day: s.dayNumber,
        // Gece olayının konuşanı yoktur
        speaker: s.kind === 'EVENT' ? '' : nameOf(s.sourceId),
        text: s.text,
      })),
      currentDay: session.currentDay,
    };
  }

  async saveNotebook(sessionId: string, userId: string, input: unknown) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }
    const statements = await this.loadStatements(sessionId);
    const itemIds = await this.loadItemEvidenceIds(sessionId);
    const notebook = sanitizeNotebook(input, statements, itemIds);
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { notebookState: notebook as unknown as Prisma.InputJsonValue },
    });
    return { notebook };
  }
}
