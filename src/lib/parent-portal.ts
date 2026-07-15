import { Prisma, type Parent } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { activatePendingLinks } from '@/lib/parent-access'
import { verifyMobileAccessToken } from '@/lib/mobile-auth/jwt'

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
  return requireParentFromUserId(session.user.id)
}

/** Resolve a Parent row from an already-authenticated userId (session or JWT claims). */
export async function requireParentFromUserId(userId: string): Promise<Parent | null> {
  const parent = await prisma.parent.findUnique({ where: { userId } })
  if (parent) {
    // The parent has authenticated via OTP — pending invites are now proven.
    await activatePendingLinks(parent.id)
  }
  return parent
}

/**
 * Dual-mode parent resolution for routes callable from both the web portal
 * (NextAuth cookie session) and the mobile app (Bearer access JWT) — used by
 * existing session-based `/api/v1/parent/*` routes we extend for mobile
 * rather than fork. `/api/mobile/v1/*` routes should call
 * `requireParentFromUserId` directly against verified JWT claims instead.
 */
export async function requireParentFromRequest(req: Request): Promise<Parent | null> {
  const session = await auth()
  if (session?.user && session.user.role === 'PARENT') {
    return requireParentFromUserId(session.user.id)
  }
  const authz = req.headers.get('authorization')
  const token = authz?.startsWith('Bearer ') ? authz.slice(7) : null
  if (!token) return null
  const claims = await verifyMobileAccessToken(token)
  if (!claims || claims.role !== 'PARENT') return null
  return requireParentFromUserId(claims.userId)
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
