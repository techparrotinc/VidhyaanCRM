import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leadCount = await prisma.lead.count();
  const admissionCount = await prisma.admission.count();
  const studentCount = await prisma.student.count();
  const invoiceCount = await prisma.invoice.count();

  console.log('Record Counts:');
  console.log(`Lead: ${leadCount}`);
  console.log(`Admission: ${admissionCount}`);
  console.log(`Student: ${studentCount}`);
  console.log(`Invoice: ${invoiceCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
