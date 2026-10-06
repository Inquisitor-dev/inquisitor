import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Prisma 7: "client" engine, Driver Adapter gerektirir.
// @prisma/adapter-pg PostgreSQL için native adapter'dır.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prismaClient = new PrismaClient({ adapter });

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  readonly user = prismaClient.user;
  readonly gameSession = prismaClient.gameSession;
  readonly npc = prismaClient.npc;
  readonly sessionNpcState = prismaClient.sessionNpcState;
  readonly dialogueHistory = prismaClient.dialogueHistory;
  readonly evidence = prismaClient.evidence;
  readonly userPurchase = prismaClient.userPurchase;
  readonly tokenTransaction = prismaClient.tokenTransaction;

  get $transaction() {
    return prismaClient.$transaction.bind(prismaClient);
  }

  async onModuleInit() {
    await prismaClient.$connect();
    this.logger.log('✅ Database connected successfully (Prisma 7 + PrismaPg adapter).');
  }

  async onModuleDestroy() {
    await prismaClient.$disconnect();
  }
}
