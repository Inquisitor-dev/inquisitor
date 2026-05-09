const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.gameSession.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'LOST' } })
  .then(res => console.log('Updated:', res))
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
