const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vias = await prisma.via.findMany({ where: { isSuspended: false }, take: 2 });
  const trechos = await prisma.trecho.findMany({ where: { isSuspended: false }, take: 2 });
  console.log('✅ Query successful! Vias found:', vias.length, 'Trechos found:', trechos.length);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Query error:', err);
  process.exit(1);
});
