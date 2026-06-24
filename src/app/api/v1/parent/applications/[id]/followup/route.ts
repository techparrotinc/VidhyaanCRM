import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 1. Find Parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // 2. Find ParentEnquiry
    const enquiry = await prisma.parentEnquiry.findUnique({
      where: { id },
      include: {
        school: {
          select: { name: true }
        }
      }
    })

    if (!enquiry || enquiry.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Enquiry not found' },
        { status: 404 }
      )
    }

    // 3. Verify ownership
    if (enquiry.parentId !== parent.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Enquiry does not belong to you.' },
        { status: 403 }
      )
    }

    // 4. Rate-limit check (24 hours)
    const now = new Date()
    if (enquiry.lastFollowUpAt) {
      const msSinceLast = now.getTime() - new Date(enquiry.lastFollowUpAt).getTime()
      const hoursSinceLast = msSinceLast / (1000 * 60 * 60)
      if (hoursSinceLast < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLast)
        return NextResponse.json(
          { 
            success: false, 
            error: `Rate limit: You can only send one follow-up per 24 hours. Please wait ${hoursRemaining} hours.` 
          },
          { status: 429 }
        )
      }
    }

    // 5. Update timestamp
    await prisma.parentEnquiry.update({
      where: { id },
      data: { lastFollowUpAt: now }
    })

    // 6. Create LeadActivity in CRM (if linked to CRM Lead)
    if (enquiry.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: enquiry.leadId }
      })

      if (lead) {
        await prisma.leadActivity.create({
          data: {
            orgId: lead.orgId,
            branchId: lead.branchId,
            academicYearId: lead.academicYearId,
            leadId: lead.id,
            type: 'SYSTEM',
            summary: 'Parent sent a follow-up request'
          }
        }).catch(e => console.error('Error creating LeadActivity for follow-up:', e))
      }
    }

    // 7. Send notification to school admin (if orgId present)
    if (enquiry.orgId) {
      await prisma.notification.create({
        data: {
          orgId: enquiry.orgId,
          recipientType: 'USER',
          recipientId: null, // Broadcast to school team
          channel: 'IN_APP',
          title: 'Parent Follow-up',
          body: `Parent ${parent.name || 'User'} has sent a follow-up request for ${enquiry.school.name} (Grade: ${enquiry.gradeSought || 'Not specified'}).`
        }
      }).catch(e => console.error('Error creating Notification for follow-up:', e))
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Follow-up API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
