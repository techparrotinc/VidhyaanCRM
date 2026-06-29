import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe('SELECT id, lead_code FROM crm.leads;');
  console.log(JSON.stringify(result, null, 2));
}

main().finally(() => prisma.$disconnect());
