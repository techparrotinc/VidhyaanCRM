import { Prisma, type Parent } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/**
 * Parent-portal helpers. Parents are marketplace accounts; school records
 * (crm.students) are linked by guardian phone/email — the school captures
 * these at admission, and parent accounts verify phone via OTP, so the phone
 * match is trustworthy.
 */

export async function requireParent(): Promise<Parent | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') return null
  return prisma.parent.findUnique({ where: { userId: session.user.id } })
}

/** Where-clause matching crm students linked to this parent account. */
export function linkedStudentsWhere(parent: Parent): Prisma.StudentWhereInput {
  const or: Prisma.StudentWhereInput[] = [{ guardianPhone: parent.phone }]
  if (parent.email) or.push({ guardianEmail: parent.email })
  return { OR: or, deletedAt: null }
}
