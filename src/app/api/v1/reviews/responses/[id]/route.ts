// Delete own thread response (soft delete). Author-checked: the org member's
// school, the parent author, or a platform admin.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const ORG_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'ACCOUNTANT'])

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const response = await prisma.reviewResponse.findFirst({
      where: { id, deletedAt: null },
    })
    if (!response) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 })
    }

    const role = session.user.role || ''
    let allowed = false
    if (['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role)) {
      allowed = true
    } else if (ORG_ROLES.has(role) && response.authorType === 'SCHOOL') {
      allowed = response.orgId === session.user.orgId
    } else if (role === 'PARENT' && response.authorType === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      allowed = Boolean(parent && parent.id === response.authorId)
    }

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own response' },
        { status: 403 }
      )
    }

    await prisma.reviewResponse.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/v1/reviews/responses/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
