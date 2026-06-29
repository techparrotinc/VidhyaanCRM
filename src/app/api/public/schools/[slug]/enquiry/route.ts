import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { enquiryNotificationTemplate, enquiryConfirmationTemplate } from '@/lib/mail/templates'
import { cleanPhoneNumber } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = await req.json()

    const { parentName, phone: rawPhone, email, childName, gradeSought, message, source = 'VIDHYAAN' } = body
    const phone = typeof rawPhone === 'string' ? cleanPhoneNumber(rawPhone) as string : rawPhone


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

    // 8. Send real email notifications
    try {
      // Find school admin email
      let schoolAdminEmail = null
      if (school.orgId) {
        const org = await prisma.organization.findUnique({
          where: { id: school.orgId },
          select: { email: true }
        })
        schoolAdminEmail = org?.email
      }
      if (!schoolAdminEmail) {
        const primaryEmailContact = await prisma.schoolContact.findFirst({
          where: {
            schoolId: school.id,
            type: 'email',
            isPrimary: true
          }
        })
        schoolAdminEmail = primaryEmailContact?.value
      }

      // Send to school admin
      if (schoolAdminEmail) {
        const crmLink = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/lead-management`
        await sendTransactionalEmail({
          to: schoolAdminEmail,
          subject: `New admission enquiry for ${school.name}! 🏫`,
          htmlBody: enquiryNotificationTemplate({
            schoolName: school.name,
            parentName,
            phone,
            childName: childName || 'Not specified',
            gradeSought: gradeSought || 'Not specified',
            message: message || '',
            crmLink
          }),
          textBody: `New admission enquiry for ${school.name} from ${parentName}.`
        })
      }

      // Send confirmation to parent (if email is provided)
      if (email) {
        const phoneContact = await prisma.schoolContact.findFirst({
          where: {
            schoolId: school.id,
            type: 'phone',
            isPrimary: true
          }
        })
        const schoolPhone = phoneContact?.value || 'Contact school directly'

        await sendTransactionalEmail({
          to: email,
          subject: `Your enquiry to ${school.name} has been received!`,
          htmlBody: enquiryConfirmationTemplate({
            parentName,
            schoolName: school.name,
            schoolPhone,
            referenceId: enquiry.id
          }),
          textBody: `Dear ${parentName}, your enquiry to ${school.name} has been received. Reference ID: ${enquiry.id}.`
        })
      }
    } catch (emailErr) {
      console.error('Failed to send enquiry email notifications:', emailErr)
    }

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
