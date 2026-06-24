import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AuditAction, OrgStatus, VerificationStatus } from '@prisma/client'
import { sendTemplateEmail, schoolVerifiedTemplate } from '@/lib/integrations/resend'

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
      const listingUrl = `${origin}/schools/${school.slug}`

      // Fetch ORG_ADMIN name if available
      let adminName = 'Administrator'
      if (school.orgId) {
        const adminUser = await prisma.user.findFirst({
          where: {
            orgId: school.orgId,
            role: 'ORG_ADMIN',
            deletedAt: null
          },
          select: { name: true }
        })
        if (adminUser?.name) {
          adminName = adminUser.name
        }
      }

      console.log(`[SuperAdmin Notification] School "${school.name}" verification approved. Sending live email to admin: ${adminEmail}`)

      try {
        await sendTemplateEmail(
          adminEmail,
          "Your school is now live! 🎉",
          schoolVerifiedTemplate({
            schoolName: school.name,
            adminName,
            listingUrl
          })
        )
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr)
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
