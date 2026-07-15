import { NextRequest } from 'next/server'
import { auth } from '@/auth'

export const PLATFORM_ADMIN_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']

/**
 * `/api/admin/*` predates the route() composer and calls auth() directly,
 * so it doesn't pick up the mobile Bearer JWT for free. middleware.ts
 * rewrites a verified platform-role JWT to x-user-id/x-user-role for this
 * path prefix (same trust model as every /api/v1 route) — read those first,
 * falling back to the NextAuth cookie session for web. Returns null unless
 * the resolved role is a platform admin role.
 */
export async function resolveAdminUser(req: NextRequest): Promise<{ id: string; role: string } | null> {
  const headerId = req.headers.get('x-user-id')
  const headerRole = req.headers.get('x-user-role')
  const user =
    headerId && headerRole
      ? { id: headerId, role: headerRole }
      : await auth().then((session) => (session?.user ? { id: session.user.id, role: session.user.role } : null))
  if (!user || !PLATFORM_ADMIN_ROLES.includes(user.role)) return null
  return user
}
