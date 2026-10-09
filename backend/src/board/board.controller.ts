import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BoardService } from './board.service';

type AuthedRequest = { user: { userId: string } };

// Soruşturma Panosu: oturumun panosu (kartlar ve ipler) ve "Düşün"
@Controller('game-sessions')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get(':id/board')
  @UseGuards(JwtAuthGuard)
  getBoard(@Request() req: AuthedRequest, @Param('id') sessionId: string) {
    return this.boardService.getBoard(sessionId, req.user.userId);
  }

  @Put(':id/board')
  @UseGuards(JwtAuthGuard)
  saveBoard(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('board') board: unknown,
  ) {
    return this.boardService.saveBoard(sessionId, req.user.userId, board);
  }

  @Post(':id/board/think')
  @UseGuards(JwtAuthGuard)
  think(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('board') board?: unknown,
  ) {
    return this.boardService.think(sessionId, req.user.userId, board);
  }
}
