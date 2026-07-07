import { prisma } from '@/lib/db/client'

export const DEFAULT_ADMISSION_STAGES = [
  { name: 'New', sortOrder: 1, color: 'blue', isWon: false, isLost: false, requiresDocs: false, requiresPayment: false },
  { name: 'Contacted', sortOrder: 2, color: 'amber', isWon: false, isLost: false, requiresDocs: false, requiresPayment: false },
  { name: 'Application Submitted', sortOrder: 3, color: 'indigo', isWon: false, isLost: false, requiresDocs: false, requiresPayment: false },
  { name: 'Docs Uploaded', sortOrder: 4, color: 'violet', isWon: false, isLost: false, requiresDocs: true, requiresPayment: false },
  { name: 'Interview Scheduled', sortOrder: 5, color: 'cyan', isWon: false, isLost: false, requiresDocs: false, requiresPayment: false },
  { name: 'Payment Pending', sortOrder: 6, color: 'orange', isWon: false, isLost: false, requiresDocs: false, requiresPayment: true },
  { name: 'Admitted', sortOrder: 7, color: 'green', isWon: true, isLost: false, requiresDocs: false, requiresPayment: false },
  { name: 'Rejected', sortOrder: 8, color: 'red', isWon: false, isLost: true, requiresDocs: false, requiresPayment: false }
] as const

/**
 * Seed the default admission pipeline stages for a newly created org.
 * No-op if the org already has any stages (counts soft-deleted rows too,
 * to avoid violating the (orgId, sortOrder) unique constraint).
 */
export async function createDefaultAdmissionStages(orgId: string): Promise<void> {
  const existing = await prisma.admissionStage.count({ where: { orgId } })
  if (existing > 0) return

  await prisma.admissionStage.createMany({
    data: DEFAULT_ADMISSION_STAGES.map(stage => ({ orgId, ...stage })),
    skipDuplicates: true,
  })
}
