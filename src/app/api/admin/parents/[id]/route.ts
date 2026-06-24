import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction, UserStatus } from '@prisma/client'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = session?.user?.role
    // GDPR/DPDP deletions require SUPER_ADMIN only
    if (!session?.user || role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. SUPER_ADMIN required.' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    const parent = await prisma.parent.findUnique({
      where: { id }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent account not found' }, { status: 404 })
    }

    // Anonymize Parent Table
    const anonymizedEmail = `anonymized-${id}@vidhyaan.com`
    const anonymizedPhone = `0000000000`

    await prisma.$transaction([
      prisma.parent.update({
        where: { id },
        data: {
          name: 'Anonymized Parent (Compliance)',
          email: anonymizedEmail,
          phone: anonymizedPhone,
          city: 'Anonymized',
          deletedAt: new Date()
        }
      }),
      // Anonymize linked User if it exists
      ...(parent.userId ? [
        prisma.user.update({
          where: { id: parent.userId },
          data: {
            name: 'Anonymized User',
            email: anonymizedEmail,
            phone: anonymizedPhone,
            status: UserStatus.DEACTIVATED,
            deletedAt: new Date()
          }
        })
      ] : [])
    ])

    // Log compliance audit log
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.DELETE,
        entityType: 'PARENT_ERASURE_COMPLIANCE',
        entityId: id,
        before: { phone: parent.phone, email: parent.email },
        after: { reason, compliance: 'DPDP/GDPR_ERASURE_SUCCESSFUL' },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch(e => console.error('Failed to create compliance log:', e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Parent erasure error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { action } = body // e.g. 'deactivate' | 'reactivate'

    const parent = await prisma.parent.findUnique({
      where: { id }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent account not found' }, { status: 404 })
    }

    if (parent.userId) {
      const newStatus = action === 'deactivate' ? UserStatus.DEACTIVATED : UserStatus.ACTIVE
      await prisma.user.update({
        where: { id: parent.userId },
        data: { status: newStatus }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update parent status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
