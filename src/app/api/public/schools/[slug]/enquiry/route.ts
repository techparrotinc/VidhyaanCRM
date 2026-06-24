import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = await req.json()

    const { parentName, phone, email, childName, gradeSought, message, source = 'VIDHYAAN' } = body

    // 1. Validation
    if (!parentName || parentName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Parent name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Indian mobile phone format validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
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

    // 3. Check for duplicates in last 24 hours
    const duplicate = await prisma.parentEnquiry.findFirst({
      where: {
        schoolId: school.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        parent: {
          phone
        }
      }
    })

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'You already sent an enquiry to this school recently.' },
        { status: 409 }
      )
    }

    // 4. Find or create Parent record
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

    // 5. Create ParentEnquiry record
    const enquiry = await prisma.parentEnquiry.create({
      data: {
        orgId: school.orgId,
        schoolId: school.id,
        parentId: parent.id,
        kidName: childName || null,
        gradeSought: gradeSought || null,
        message: message || null,
        status: 'NEW'
      }
    })

    // 6. If claimed school (has orgId), auto-create Lead in CRM schema
    if (school.orgId) {
      // Find branch and academic year if available
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
          kidName: childName || null,
          gradeSought: gradeSought || null,
          source: 'VIDHYAAN',
          status: 'NEW',
          priority: 'MEDIUM'
        }
      })

      // Link lead back to the enquiry
      await prisma.parentEnquiry.update({
        where: { id: enquiry.id },
        data: { leadId: lead.id }
      }).catch(e => console.error('Error linking Lead to Enquiry:', e))
    }

    // 7. Increment school enquiryCount asynchronously
    prisma.school.update({
      where: { id: school.id },
      data: { enquiryCount: { increment: 1 } }
    }).catch(e => console.error('Error incrementing enquiryCount:', e))

    // 8. Log email notification (Mock in development)
    console.log(`[Email Mock] Sending enquiry notification for ${school.name} to admin.`)

    return NextResponse.json({
      success: true,
      message: 'Enquiry sent successfully. The school will contact you soon.'
    })
  } catch (error: any) {
    console.error('Enquiry API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit enquiry' },
      { status: 500 }
    )
  }
}
