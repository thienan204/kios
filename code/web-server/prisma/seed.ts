import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Hardcoded bcrypt hash for 'admin123' to avoid missing dependency in standalone mode
  const adminPassword = '$2b$10$OLhyOjAkQEisYfC2Lo4QtOfEdCCT/7EKH82rYT1QRCPpAcQk4Oake';
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
    },
  });
  
  console.log('Admin user created/verified:', admin.username);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
