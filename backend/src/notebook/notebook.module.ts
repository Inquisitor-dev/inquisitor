import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotebookService } from './notebook.service';
import { NotebookController } from './notebook.controller';

@Module({
  imports: [PrismaModule],
  providers: [NotebookService],
  controllers: [NotebookController],
})
export class NotebookModule {}
