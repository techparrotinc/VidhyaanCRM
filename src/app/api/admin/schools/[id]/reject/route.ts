import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { AuditAction, VerificationStatus } from '@prisma/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

export async function POST(
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
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'rejection reason is required' }, { status: 400 })
    }

    // Find school
    const school = await prisma.school.findUnique({
      where: { id, deletedAt: null },
      include: { organization: true, contacts: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // 1. Update school
    await prisma.school.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason
      }
    })

    // 2. Send email to school admin
    const adminEmail = school.organization?.email || school.contacts.find(c => c.type === 'email')?.value
    if (adminEmail) {
      console.log(`[SuperAdmin Notification] School "${school.name}" verification rejected. Reason: ${reason}. Sending email to admin: ${adminEmail}`)

      if (process.env.ZEPTOMAIL_API_TOKEN) {
        try {
          await sendTransactionalEmail({
            to: adminEmail,
            subject: 'Update regarding your school listing on Vidhyaan',
            htmlBody: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #c53030;">Listing Status Update</h2>
                <p>Thank you for submitting your school <strong>${school.name}</strong> to Vidhyaan.</p>
                <p>Unfortunately, your verification request has been rejected for the following reason:</p>
                <blockquote style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 10px 15px; margin: 20px 0; font-style: italic;">
                  ${reason}
                </blockquote>
                <p>Please address these concerns and resubmit your claim verification request.</p>
                <p style="color: #718096; font-size: 14px; margin-top: 20px;">If you have any questions, please contact Vidhyaan Support.</p>
              </div>
            `,
            textBody: `Your verification request for ${school.name} has been rejected. Reason: ${reason}`
          })
        } catch (emailErr) {
          console.error('Failed to send ZeptoMail rejection email:', emailErr)
        }
      }
    }

    // 3. Create Audit Log
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        orgId: school.orgId,
        action: AuditAction.UPDATE,
        entityType: 'SCHOOL_VERIFICATION',
        entityId: id,
        before: {
          verificationStatus: school.verificationStatus,
          rejectionReason: school.rejectionReason
        },
        after: {
          verificationStatus: VerificationStatus.REJECTED,
          rejectionReason: reason
        },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch(e => console.error('Failed to create audit log for school rejection:', e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reject School API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
