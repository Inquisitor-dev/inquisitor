import { Module } from '@nestjs/common';
import { NpcsService } from './npcs.service';
import { NpcsController } from './npcs.controller';
import { LlmModule } from '../llm/llm.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LlmModule, AuthModule, PrismaModule],
  controllers: [NpcsController],
  providers: [NpcsService],
})
export class NpcsModule {}
