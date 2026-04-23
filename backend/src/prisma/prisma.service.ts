import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

// Prisma 7: Connection URL, prisma.config.ts üzerinden yönetiliyor.
// Burada singleton bir client oluşturuyoruz.
const prismaClient = new PrismaClient({
  log: ['warn', 'error'],
});

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Tüm model accessor'larını doğrudan delegate ediyoruz
  readonly user = prismaClient.user;
  readonly gameSession = prismaClient.gameSession;
  readonly npc = prismaClient.npc;
  readonly sessionNpcState = prismaClient.sessionNpcState;
  readonly dialogueHistory = prismaClient.dialogueHistory;

  async onModuleInit() {
    await prismaClient.$connect();
    this.logger.log('Database connected successfully.');
  }

  async onModuleDestroy() {
    await prismaClient.$disconnect();
  }
}
