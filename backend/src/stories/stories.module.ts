import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StoryPoolService } from './story-pool.service';

@Module({
  imports: [PrismaModule],
  providers: [StoryPoolService],
  exports: [StoryPoolService],
})
export class StoriesModule {}
