import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }

    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const { id } = await context.params

    const org = await prisma.organization.findUnique({
      where: { id }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    // Perform updates in transaction
    await prisma.$transaction([
      prisma.organization.update({
        where: { id },
        data: { status: 'ACTIVE' }
      }),
      prisma.school.updateMany({
        where: { orgId: id },
        data: {
          isVerified: true,
          verificationStatus: 'VERIFIED'
        }
      })
    ])

    // Create Audit Log
    const audit = await prisma.auditLog.create({
      data: {
        orgId: id,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Organization',
        entityId: id,
        after: { status: 'ACTIVE', isVerified: true }
      }
    })

    // Simulate sending SMS/WhatsApp/Email to school admin
    console.log(`[SuperAdmin Notification] Organization "${org.name}" has been approved. Notification sent to admin email: ${org.email} / phone: ${org.phone}.`)

    return ok({
      success: true,
      message: `Organization "${org.name}" approved successfully`,
      auditId: audit.id
    })

  } catch (error) {
    return errorResponse(error)
  }
}
