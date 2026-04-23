import { Module } from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { NpcsController } from './npcs.controller';

@Module({
  providers: [NpcsService],
  controllers: [NpcsController]
})
export class NpcsModule {}
