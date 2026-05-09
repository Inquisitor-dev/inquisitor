import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Clearing active sessions...');
  const res = await prisma.gameSession.updateMany({
    where: { status: 'ACTIVE' },
    data: { status: 'LOST' }
  });
  console.log('✅ Active sessions cleared. Count:', res.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
