import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result: any = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM crm.students WHERE deleted_at IS NULL) as students,
      (SELECT COUNT(*) FROM crm.invoices WHERE deleted_at IS NULL) as invoices,
      (SELECT COUNT(*) FROM crm.leads WHERE deleted_at IS NULL) as leads,
      (SELECT COUNT(*) FROM crm.admissions WHERE deleted_at IS NULL) as admissions;
  `;
  console.log('Query result:', {
    students: result[0].students.toString(),
    invoices: result[0].invoices.toString(),
    leads: result[0].leads.toString(),
    admissions: result[0].admissions.toString(),
  });
}
main().finally(() => prisma.$disconnect());
