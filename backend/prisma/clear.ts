import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Clearing dialogue history...');
  await prisma.dialogueHistory.deleteMany();
  await prisma.sessionNpcState.deleteMany();
  console.log('✅ History cleared.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
