import { NextResponse } from 'next/server'
import { requireParent, parentHasLinkedStudent } from '@/lib/parent-portal'

/**
 * Lightweight portal-scope probe for the parent shell. Returns whether this
 * parent has any linked ward so the nav can hide student-data features for
 * discovery parents and reveal them the moment a school links/invites them —
 * client-fetched (not baked into the JWT) so it flips live without re-login.
 */
export async function GET() {
  const parent = await requireParent()
  if (!parent) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Parent role required.' },
      { status: 401 }
    )
  }
  const hasLinkedStudent = await parentHasLinkedStudent(parent)
  return NextResponse.json({ success: true, data: { hasLinkedStudent } })
}
