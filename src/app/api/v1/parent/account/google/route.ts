import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

/** Google link status + unlink for the parent profile "Connected accounts" card. */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const link = await prisma.userOAuthAccount.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: 'google' } },
    select: { email: true, createdAt: true }
  })
  return NextResponse.json({ success: true, data: { linked: !!link, email: link?.email ?? null } })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PARENT') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  // Unlink is always safe: phone OTP login keeps working.
  await prisma.userOAuthAccount.deleteMany({
    where: { userId: session.user.id, provider: 'google' }
  })
  return NextResponse.json({ success: true })
}
