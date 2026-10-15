import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotebookService } from './notebook.service';

type AuthedRequest = { user: { userId: string } };

// Not Defteri: gün sayfaları, oyuncunun yazıları ve kayıt kartlarının yerleri
@Controller('game-sessions')
export class NotebookController {
  constructor(private readonly notebookService: NotebookService) {}

  @Get(':id/notebook')
  @UseGuards(JwtAuthGuard)
  getNotebook(@Request() req: AuthedRequest, @Param('id') sessionId: string) {
    return this.notebookService.getNotebook(sessionId, req.user.userId);
  }

  // Defter yazarken ve çizerken kendiliğinden kaydedilir; genel dakikada 20 istek sınırı
  // burada kayıtları reddetmesin diye daha geniş tutulur
  @Put(':id/notebook')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  saveNotebook(
    @Request() req: AuthedRequest,
    @Param('id') sessionId: string,
    @Body('notebook') notebook: unknown,
  ) {
    return this.notebookService.saveNotebook(
      sessionId,
      req.user.userId,
      notebook,
    );
  }
}
