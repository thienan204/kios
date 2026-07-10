const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const areas = await prisma.area.findMany();
  for (const area of areas) {
    if (!area.uid) {
      await prisma.area.update({
        where: { id: area.id },
        data: { uid: crypto.randomUUID() },
      });
      console.log(`Updated area ${area.id} with uid`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
