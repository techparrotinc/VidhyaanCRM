import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTwoFactorState, orgPolicyRequires } from '@/lib/auth/twofactor'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const state = await getTwoFactorState(session.user.id)
  const policyRequired = await orgPolicyRequires(
    session.user.orgId ?? null,
    session.user.role
  )
  return NextResponse.json({
    success: true,
    ...state,
    policyRequired,
    mustEnrol: policyRequired && !state.enrolled
  })
}
