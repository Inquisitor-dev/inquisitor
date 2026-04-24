import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NpcsService } from './npcs.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // İleride entegre edilecek

@Controller('npcs')
export class NpcsController {
  constructor(private readonly npcsService: NpcsService) {}

  // @UseGuards(JwtAuthGuard) // Oyuncu girişini doğrulamak için (Faz 4/5'te eklenebilir)
  @Post('interact')
  async interact(
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
    @Body('message') message: string,
  ) {
    if (!sessionId || !npcId || !message) {
      return { error: 'Gerekli alanlar eksik (sessionId, npcId, message)' };
    }
    
    return await this.npcsService.interact(sessionId, npcId, message);
  }

  @Post('history')
  async getHistory(
    @Body('sessionId') sessionId: string,
    @Body('npcId') npcId: string,
  ) {
    if (!sessionId || !npcId) {
      return { error: 'Gerekli alanlar eksik (sessionId, npcId)' };
    }
    
    return await this.npcsService.getNpcHistory(sessionId, npcId);
  }
}
