import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
} from '../scenarios/scenario-config';
import { CaseFacts } from '../scenarios/case-setup';
import { findOwnedSession } from '../game-sessions/session-access';
import {
  applyVerdicts,
  BoardCard,
  BoardEvidence,
  BoardState,
  describeJudged,
  EMPTY_BOARD_THOUGHT,
  judgeBoard,
  parseStoredBoard,
  sanitizeBoard,
  templateThought,
} from './board';

const EMPTY_BOARD: BoardState = { cards: [], strings: [] };
// Yapay zekâya giden kanıt alıntısının uzunluğu
const EXCERPT_LENGTH = 90;

type OwnedSession = Awaited<ReturnType<typeof findOwnedSession>>;

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  // Düşün günde bir kez: aynı gün tekrar düşünülemez, gece de olsa
  private canThink(session: OwnedSession) {
    return (
      session.status === 'ACTIVE' &&
      session.boardThoughtDay !== session.currentDay
    );
  }

  private suspectIds(session: OwnedSession) {
    return getScenarioConfig(
      session.scenarioType,
      session.difficulty,
    ).npcDefinitions.map((npc) => npc.id);
  }

  private loadEvidence(sessionId: string): Promise<BoardEvidence[]> {
    return this.prisma.evidence.findMany({
      where: { sessionId },
      select: {
        id: true,
        kind: true,
        category: true,
        sourceId: true,
        text: true,
      },
    });
  }

  async getBoard(sessionId: string, userId: string) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    return {
      board: parseStoredBoard(session.boardState) ?? EMPTY_BOARD,
      thought: session.boardThought,
      canThink: this.canThink(session),
    };
  }

  async saveBoard(sessionId: string, userId: string, input: unknown) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    const evidence = await this.loadEvidence(sessionId);
    const board = sanitizeBoard(input, {
      suspectIds: this.suspectIds(session),
      evidenceIds: evidence.map((e) => e.id),
      previous: parseStoredBoard(session.boardState),
    });
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: { boardState: board as unknown as Prisma.InputJsonValue },
    });
    return { board };
  }

  // İpleri vaka gerçeklerine göre değerlendirir ve dedektifin iç sesini döndürür
  async think(sessionId: string, userId: string, input?: unknown) {
    const session = await findOwnedSession(this.prisma, sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Bu soruşturma sona erdi.');
    }
    if (!this.canThink(session)) {
      throw new BadRequestException(
        'Bugün panoya yeterince baktın. Yarın yeniden düşünebilirsin.',
      );
    }
    const facts = session.caseFacts as unknown as CaseFacts | null;
    if (!facts) {
      throw new BadRequestException('Bu vakada pano değerlendirilemiyor.');
    }

    const evidence = await this.loadEvidence(sessionId);
    const previous = parseStoredBoard(session.boardState);
    // İstemci son hâlini gönderdiyse onunla düşünülür (kaydedilmemiş son değişiklik kaybolmasın)
    const board =
      input === undefined
        ? (previous ?? EMPTY_BOARD)
        : sanitizeBoard(input, {
            suspectIds: this.suspectIds(session),
            evidenceIds: evidence.map((e) => e.id),
            previous,
          });

    const judged = judgeBoard(board, facts, evidence);
    // Bağ yoksa günün düşünme hakkı harcanmaz
    if (judged.length === 0) {
      return { board, thought: EMPTY_BOARD_THOUGHT, canThink: true };
    }

    const scenarioType = session.scenarioType;
    const config = getScenarioConfig(scenarioType, session.difficulty);
    const nameOf = (id: string) =>
      config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
    const evidenceById = new Map(evidence.map((e) => [e.id, e]));
    const labelOf = (card: BoardCard, withExcerpt: boolean) => {
      if (card.kind === 'suspect') return nameOf(card.refId ?? '');
      const e = card.refId ? evidenceById.get(card.refId) : undefined;
      if (!e) return 'Not';
      const base =
        e.kind === 'CONFESSION'
          ? `İtiraf: ${nameOf(e.sourceId)}`
          : e.category === 'STATEMENT'
            ? `Tanıklık: ${nameOf(e.sourceId)}`
            : e.sourceId === 'crime_scene'
              ? 'Olay yeri izi'
              : `Kanıt (${getLocalizedLocationLabel(scenarioType, e.sourceId)})`;
      if (!withExcerpt) return base;
      const excerpt =
        e.text.length > EXCERPT_LENGTH
          ? `${e.text.slice(0, EXCERPT_LENGTH)}…`
          : e.text;
      return `${base} – ${excerpt}`;
    };

    const shortLines = describeJudged(judged, (card) => labelOf(card, false));
    let thought: string;
    if (session.isTestMode) {
      thought = `[Test Düşüncesi] ${templateThought(shortLines)}`;
    } else {
      const llmText = await this.llm.generateBoardThought(
        describeJudged(judged, (card) => labelOf(card, true)),
        scenarioType,
      );
      thought = llmText ?? templateThought(shortLines);
    }

    const judgedBoard = applyVerdicts(board, judged);
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        boardState: judgedBoard as unknown as Prisma.InputJsonValue,
        boardThought: thought,
        boardThoughtDay: session.currentDay,
      },
    });
    this.logger.log(
      `Board thought for ${sessionId}: ${judged.filter((j) => j.verdict === 'CORRECT').length}/${judged.length} correct`,
    );

    return { board: judgedBoard, thought, canThink: false };
  }
}
