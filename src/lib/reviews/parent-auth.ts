// Shared helper for parent-facing review routes: resolves the logged-in
// PARENT session to its marketplace Parent record. Mirrors the pattern used
// across /api/v1/parent/* routes.

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import type { Parent } from '@prisma/client'

export type ParentAuthResult =
  | { ok: true; parent: Parent }
  | { ok: false; status: number; error: string }

export async function requireParent(): Promise<ParentAuthResult> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') {
    return { ok: false, status: 401, error: 'Unauthorized. Parent role required.' }
  }
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
  })
  if (!parent) {
    return { ok: false, status: 404, error: 'Parent record not found' }
  }
  return { ok: true, parent }
}
