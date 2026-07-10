import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { enquiryNotificationTemplate, enquiryConfirmationTemplate } from '@/lib/mail/templates'
import { cleanPhoneNumber } from '@/lib/utils'
import { createLeadWithUniqueCode } from '@/lib/lead-code'
import { dedupFields } from '@/lib/dedup'
import { resolveOrgEmail } from '@/lib/mail/org-templates'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = z.object({
      parentName: z.string().trim().max(150),
      phone: z.string().max(20),
      email: z.string().max(200).optional().nullable(),
      childName: z.string().max(150).optional().nullable(),
      gradeSought: z.string().max(50).optional().nullable(),
      message: z.string().max(2000).optional().nullable(),
      source: z.enum(['VIDHYAAN', 'WEBSITE', 'WALK_IN', 'PHONE', 'WHATSAPP', 'REFERRAL', 'OTHER']).catch('VIDHYAAN').default('VIDHYAAN')
    }).parse(await req.json())

    const { parentName, email, childName, gradeSought, message, source } = body
    const phone = cleanPhoneNumber(body.phone) as string


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

    const { searchParams } = new URL(req.url)
    const isClaim = searchParams.get('claim') === 'true'

    // 2. Find school by slug
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ],
        isDummy: false,
        ...(isClaim ? {} : { isPublished: true })
      }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    // 3. Duplicate guard: block only an identical resubmit (same school +
    // phone + child + class) within 24h. A second enquiry for another child
    // or another class from the same parent is legitimate and goes through.
    const duplicate = await prisma.parentEnquiry.findFirst({
      where: {
        schoolId: school.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        parent: {
          phone
        },
        kidName: childName
          ? { equals: childName.trim(), mode: 'insensitive' }
          : null,
        gradeSought: gradeSought || null
      }
    })

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: childName
            ? `You already sent an enquiry for ${childName.trim()} recently. To enquire for another child or class, just change those details.`
            : 'You already sent an enquiry to this school recently.'
        },
        { status: 409 }
      )
    }

    // 4. Find or create Parent record
    let parent = await prisma.parent.findUnique({
      where: { phone }
    })

    if (!parent && email) {
      const existingEmail = await prisma.parent.findUnique({
        where: { email }
      })
      if (existingEmail) {
        if (existingEmail.phone !== phone) {
          return NextResponse.json(
            { success: false, error: 'This email address is already registered under another mobile number. Please check your details or use your registered phone number.' },
            { status: 400 }
          )
        }
        parent = existingEmail
      }
    }

    if (!parent) {
      try {
        parent = await prisma.parent.create({
          data: {
            phone,
            name: parentName,
            email: email || null
          }
        })
      } catch (createErr: any) {
        console.error('Error creating parent record:', createErr)
        if (createErr.code === 'P2002') {
          return NextResponse.json(
            { success: false, error: 'This phone number or email address is already registered. Please check your details.' },
            { status: 400 }
          )
        }
        throw createErr
      }
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

    // In-app bell for org admins (suppressEmail: the detailed enquiry email
    // below already covers email; this is the dashboard/bell signal)
    if (school.orgId) {
      const { notifyOrgAdmins } = await import('@/lib/services/notifications')
      notifyOrgAdmins(school.orgId, {
        type: 'ENQUIRY_RECEIVED',
        title: `New enquiry from ${parentName}`,
        body: `${childName ? `For ${childName}` : 'Enquiry'}${gradeSought ? ` (${gradeSought})` : ''} via your Vidhyaan profile. Open Lead Management to follow up.`,
        data: { href: '/lead-management', enquiryId: enquiry.id },
        suppressEmail: true,
      }).catch(() => {})
    }

    // 6. If claimed school (has orgId), auto-create Lead in CRM schema
    if (school.orgId) {
      const orgId = school.orgId
      // Find branch and academic year if available
      const branch = await prisma.branch.findFirst({
        where: { orgId: school.orgId, isDefault: true }
      })

      const academicYear = await prisma.academicYear.findFirst({
        where: { orgId: school.orgId, status: 'ACTIVE' }
      })

      // Normalized phone + household identity (the dedup join key).
      const identity = await dedupFields(prisma, { orgId, phone, name: parentName, email })

      // Merge instead of leaking a fresh lead per re-enquiry: if this parent
      // already has an OPEN lead for this child, reattach the enquiry to it.
      const existingLead = await prisma.lead.findFirst({
        where: {
          orgId,
          deletedAt: null,
          phoneNormalized: identity.phoneNormalized ?? undefined,
          status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] },
          ...(childName ? { kidName: { equals: childName.trim(), mode: 'insensitive' } } : {}),
        },
        orderBy: { createdAt: 'desc' },
      })

      let lead
      if (existingLead && identity.phoneNormalized) {
        lead = await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            householdId: identity.householdId ?? undefined,
            phoneNormalized: identity.phoneNormalized,
            email: email || existingLead.email,
            gradeSought: gradeSought || existingLead.gradeSought,
            nextFollowUpAt: new Date(),
          },
        })
        await prisma.leadActivity.create({
          data: {
            orgId, leadId: lead.id, type: 'SYSTEM',
            summary: `Repeat enquiry received via Vidhyaan${gradeSought ? ` for ${gradeSought}` : ''}`,
          },
        }).catch(e => console.error('Error logging repeat-enquiry activity:', e))
      } else {
        lead = await createLeadWithUniqueCode(orgId, (leadCode) =>
          prisma.lead.create({
            data: {
              orgId,
              branchId: branch?.id || null,
              academicYearId: academicYear?.id || null,
              leadCode,
              parentName,
              phone,
              email: email || null,
              kidName: childName || null,
              gradeSought: gradeSought || null,
              phoneNormalized: identity.phoneNormalized,
              householdId: identity.householdId,
              source: 'VIDHYAAN',
              status: 'NEW',
              priority: 'MEDIUM'
            }
          })
        )
      }

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
      let orgEmail = null
      let contactEmail = null

      if (school.orgId) {
        const org = await prisma.organization.findUnique({
          where: { id: school.orgId },
          select: { email: true }
        })
        schoolAdminEmail = org?.email
        orgEmail = org?.email
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
        contactEmail = primaryEmailContact?.value
      } else {
        const primaryEmailContact = await prisma.schoolContact.findFirst({
          where: {
            schoolId: school.id,
            type: 'email',
            isPrimary: true
          }
        })
        contactEmail = primaryEmailContact?.value
      }

      // TEMP DEBUG - remove after enquiry email diagnosis
      console.log('[EnquiryDebug] orgId:', school.orgId, 'org email:', orgEmail, 'primary contact email:', contactEmail)
      // TEMP DEBUG - remove after enquiry email diagnosis
      console.log('[EnquiryDebug] resolved schoolAdminEmail:', schoolAdminEmail)

      // Send to school admin
      if (schoolAdminEmail) {
        const crmLink = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/lead-management`
        // TEMP DEBUG - remove after enquiry email diagnosis
        console.log('[EnquiryDebug] About to send admin notification to:', schoolAdminEmail)
        try {
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
        } catch (adminEmailErr) {
          // TEMP DEBUG - remove after enquiry email diagnosis
          console.error('[EnquiryDebug] Admin email send FAILED:', adminEmailErr)
        }
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

        // TEMP DEBUG - remove after enquiry email diagnosis
        console.log('[EnquiryDebug] About to send parent confirmation to:', email)
        try {
          if (school.orgId) {
            // Claimed school — honor the org's customized template
            const { subject, bodyText, html } = await resolveOrgEmail(school.orgId, 'ENQUIRY_CONFIRMATION', {
              parentName,
              childName: childName ?? '',
              schoolName: school.name
            })
            await sendTransactionalEmail({ to: email, subject, htmlBody: html, textBody: bodyText })
          } else {
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
        } catch (parentEmailErr) {
          // TEMP DEBUG - remove after enquiry email diagnosis
          console.error('[EnquiryDebug] Parent email send FAILED:', parentEmailErr)
        }
      }
    } catch (emailErr) {
      // TEMP DEBUG - remove after enquiry email diagnosis
      console.error('[EnquiryDebug] Outer email notification catch error:', emailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry sent successfully. The school will contact you soon.'
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error('Enquiry API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit enquiry' },
      { status: 500 }
    )
  }
}
