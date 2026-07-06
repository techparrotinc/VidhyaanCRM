import { Prisma, type Parent } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { activatePendingLinks } from '@/lib/parent-access'

/**
 * Parent-portal helpers. Students are linked to parent accounts two ways:
 *  1. Explicit StudentGuardianLink rows (school-initiated invites) — the
 *     durable, auditable path. ACTIVE grants access; REVOKED blocks it even
 *     if the phone still matches.
 *  2. Guardian phone/email match — bootstrap fallback for students whose
 *     school never ran the invite flow. Parent phone is OTP-verified.
 */

export async function requireParent(): Promise<Parent | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') return null
  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
  if (parent) {
    // The parent has authenticated via OTP — pending invites are now proven.
    await activatePendingLinks(parent.id)
  }
  return parent
}

/** Where-clause matching crm students visible to this parent account. */
export function linkedStudentsWhere(parent: Parent): Prisma.StudentWhereInput {
  const contactMatch: Prisma.StudentWhereInput[] = [{ guardianPhone: parent.phone }]
  if (parent.email) contactMatch.push({ guardianEmail: parent.email })
  return {
    deletedAt: null,
    // A revoked link beats any contact match — schools can cut visibility.
    NOT: { guardianLinks: { some: { parentId: parent.id, status: 'REVOKED' } } },
    OR: [
      { guardianLinks: { some: { parentId: parent.id, status: 'ACTIVE' } } },
      ...contactMatch
    ]
  }
}
