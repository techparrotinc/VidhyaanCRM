import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { cleanPhoneNumber } from '@/lib/utils'

const visitRequestSchema = z.object({
  parentName: z.string().max(150).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  preferredDate: z.string().max(40).optional().nullable(),
  preferredTime: z.string().max(40).optional().nullable(),
  numberOfVisitors: z.union([z.string().max(10), z.number()]).optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const parsed = visitRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      parentName,
      phone: rawPhone,
      email,
      preferredDate,
      preferredTime,
      numberOfVisitors,
      notes
    } = parsed.data

    const phone = typeof rawPhone === 'string' ? cleanPhoneNumber(rawPhone) as string : rawPhone


    // 1. Validation
    if (!parentName || parentName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Parent name must be at least 2 characters' },
        { status: 400 }
      )
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }

    if (!preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Preferred date is required' },
        { status: 400 }
      )
    }

    // 2. Find school by slug
    const school = await prisma.school.findFirst({
      where: { slug }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // 3. Find or create Parent record
    let parent = await prisma.parent.findUnique({
      where: { phone }
    })

    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          phone,
          name: parentName,
          email: email || null
        }
      })
    }

    // 4. Create ParentEnquiry record representing the visit request
    const visitRequest = await prisma.parentEnquiry.create({
      data: {
        orgId: school.orgId,
        schoolId: school.id,
        parentId: parent.id,
        type: 'VISIT_REQUEST',
        preferredDate: new Date(preferredDate),
        preferredTime: preferredTime || null,
        visitorCount: numberOfVisitors ? Number(numberOfVisitors) : null,
        message: notes || null,
        status: 'NEW'
      }
    })

    // 5. If claimed school (has orgId), auto-create Lead in CRM schema and log visit activity
    if (school.orgId) {
      const branch = await prisma.branch.findFirst({
        where: { orgId: school.orgId, isDefault: true }
      })

      const academicYear = await prisma.academicYear.findFirst({
        where: { orgId: school.orgId, status: 'ACTIVE' }
      })

      // Generate unique lead code
      const year = new Date().getFullYear()
      const leadCount = await prisma.lead.count({
        where: { orgId: school.orgId }
      })
      const leadCode = `LD-${year}-${String(leadCount + 1).padStart(5, '0')}`

      const lead = await prisma.lead.create({
        data: {
          orgId: school.orgId,
          branchId: branch?.id || null,
          academicYearId: academicYear?.id || null,
          leadCode,
          parentName,
          phone,
          email: email || null,
          source: 'VIDHYAAN',
          status: 'NEW',
          priority: 'HIGH'
        }
      })

      // Link lead back to the visit enquiry
      await prisma.parentEnquiry.update({
        where: { id: visitRequest.id },
        data: { leadId: lead.id }
      })

      // Log LeadActivity for the campus visit request
      await prisma.leadActivity.create({
        data: {
          orgId: school.orgId,
          branchId: branch?.id || null,
          academicYearId: academicYear?.id || null,
          leadId: lead.id,
          type: 'MEETING',
          summary: 'Parent requested a campus visit',
          metadata: {
            preferredDate,
            preferredTime,
            numberOfVisitors: numberOfVisitors ? Number(numberOfVisitors) : 1,
            notes: notes || ''
          }
        }
      }).catch(e => console.error('Error creating LeadActivity for visit:', e))
    }

    // 6. Increment school enquiryCount asynchronously
    prisma.school.update({
      where: { id: school.id },
      data: { enquiryCount: { increment: 1 } }
    }).catch(e => console.error('Error incrementing enquiryCount:', e))

    return NextResponse.json({
      success: true,
      visitId: visitRequest.id,
      message: 'Visit request sent. School will confirm timing.'
    })
  } catch (error: any) {
    console.error('Visit Request API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule school visit' },
      { status: 500 }
    )
  }
}
