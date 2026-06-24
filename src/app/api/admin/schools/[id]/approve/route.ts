import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction, OrgStatus, VerificationStatus } from '@prisma/client'

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
    const { notes } = body

    // Find school
    const school = await prisma.school.findUnique({
      where: { id, deletedAt: null },
      include: { organization: true, contacts: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const now = new Date()

    // 1. Update school
    await prisma.school.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        isVerified: true,
        isPublished: true,
        verifiedAt: now
      }
    })

    // 2. Update linked organization if status was PENDING_VERIFICATION
    if (school.orgId && school.organization) {
      if (school.organization.status === OrgStatus.PENDING_VERIFICATION) {
        await prisma.organization.update({
          where: { id: school.orgId },
          data: { status: OrgStatus.ACTIVE }
        })
      }
    }

    // 3. Send email to school admin
    const adminEmail = school.organization?.email || school.contacts.find(c => c.type === 'email')?.value
    if (adminEmail) {
      const origin = req.headers.get('origin') || 'https://vidhyaan.com'
      const dashboardUrl = `${origin}/dashboard`
      
      console.log(`[SuperAdmin Notification] School "${school.name}" verification approved. Sending email to admin: ${adminEmail}`)

      if (process.env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'Vidhyaan <noreply@vidhyaan.com>',
              to: adminEmail,
              subject: 'Your school listing is approved!',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #1a365d;">Congratulations!</h2>
                  <p>Your school listing <strong>${school.name}</strong> on Vidhyaan has been approved and is now live!</p>
                  <p>You can access your CRM dashboard and manage your listing here:</p>
                  <p><a href="${dashboardUrl}" style="display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to CRM Dashboard</a></p>
                  <p style="color: #718096; font-size: 14px; margin-top: 20px;">If the button above does not work, copy and paste this link: ${dashboardUrl}</p>
                </div>
              `
            })
          })
        } catch (emailErr) {
          console.error('Failed to send Resend email:', emailErr)
        }
      }
    }

    // 4. Create Audit Log
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
          isVerified: school.isVerified,
          isPublished: school.isPublished,
          verifiedAt: school.verifiedAt
        },
        after: {
          verificationStatus: VerificationStatus.VERIFIED,
          isVerified: true,
          isPublished: true,
          verifiedAt: now,
          notes
        },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      }
    }).catch(e => console.error('Failed to create audit log for school approval:', e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Approve School API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
