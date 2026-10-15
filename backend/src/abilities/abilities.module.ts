import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AbilitiesService } from './abilities.service';
import { AbilitiesController } from './abilities.controller';

@Module({
  imports: [PrismaModule],
  providers: [AbilitiesService],
  controllers: [AbilitiesController],
})
export class AbilitiesModule {}
