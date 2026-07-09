import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { cleanPhoneNumber } from '@/lib/utils'
import { createLeadWithUniqueCode } from '@/lib/lead-code'
import { dedupFields } from '@/lib/dedup'

const trialBookingSchema = z.object({
  parentName: z.string().max(150).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  childName: z.string().max(150).optional().nullable(),
  childAge: z.union([z.string().max(10), z.number()]).optional().nullable(),
  batchScheduleId: z.string().max(50).optional().nullable(),
  preferredDate: z.string().max(40).optional().nullable(),
  activityType: z.string().max(100).optional().nullable(),
  message: z.string().max(2000).optional().nullable()
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const parsed = trialBookingSchema.safeParse(await req.json())
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
      childName,
      childAge,
      batchScheduleId,
      preferredDate,
      activityType,
      message
    } = parsed.data

    const phone = typeof rawPhone === 'string' ? cleanPhoneNumber(rawPhone) as string : rawPhone


    // 1. Validation
    if (!parentName || parentName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Parent name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!childName || childName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Child name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phone || !phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }

    // Child age validation
    const age = parseInt(String(childAge))
    if (isNaN(age) || age < 1 || age > 25) {
      return NextResponse.json(
        { success: false, error: 'Child age must be between 1 and 25' },
        { status: 400 }
      )
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // 2. Find Learning Center by slug
    const lc = await prisma.school.findFirst({
      where: {
        slug,
        institutionType: 'LEARNING_CENTER',
        isDummy: false,
        deletedAt: null
      }
    })

    if (!lc) {
      return NextResponse.json(
        { success: false, error: 'Learning center not found' },
        { status: 404 }
      )
    }

    // 3. Batch Schedule capacity check
    if (batchScheduleId) {
      const batch = await prisma.batchSchedule.findUnique({
        where: { id: batchScheduleId }
      })

      if (!batch || batch.schoolId !== lc.id) {
        return NextResponse.json(
          { success: false, error: 'Selected batch schedule was not found' },
          { status: 404 }
        )
      }

      if (batch.enrolledCount >= batch.capacity) {
        return NextResponse.json(
          { success: false, error: 'This batch is currently full. Please choose another batch.' },
          { status: 409 }
        )
      }
    }

    // 4. Duplicate guard: block only an identical resubmit (same center +
    // phone + child + activity) within 48h. A booking for another child or
    // another activity from the same parent is legitimate.
    const duplicate = await prisma.trialClassBooking.findFirst({
      where: {
        schoolId: lc.id,
        phone,
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
        },
        childName: { equals: childName.trim(), mode: 'insensitive' },
        activityType: activityType || null
      }
    })

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `You already booked a trial class for ${childName.trim()} recently. To book for another child or activity, just change those details.`
        },
        { status: 409 }
      )
    }

    // 5. Create TrialClassBooking record
    const booking = await prisma.trialClassBooking.create({
      data: {
        orgId: lc.orgId || '', // In schema, orgId is non-null for TrialClassBooking
        schoolId: lc.id,
        batchScheduleId: batchScheduleId || null,
        parentName,
        phone,
        email: email || null,
        childName,
        childAge: age,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        activityType: activityType || null,
        message: message || null,
        status: 'PENDING'
      }
    })

    // 6. If claimed (has orgId), auto-create Lead in CRM schema with a note
    if (lc.orgId) {
      const orgId = lc.orgId
      const branch = await prisma.branch.findFirst({
        where: { orgId: lc.orgId, isDefault: true }
      })

      const academicYear = await prisma.academicYear.findFirst({
        where: { orgId: lc.orgId, status: 'ACTIVE' }
      })

      const identity = await dedupFields(prisma, { orgId, phone, name: parentName, email })

      // Merge into an existing open lead for this child instead of leaking a new one.
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

      if (existingLead && identity.phoneNormalized) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            householdId: identity.householdId ?? undefined,
            phoneNormalized: identity.phoneNormalized,
            email: email || existingLead.email,
            nextFollowUpAt: new Date(),
            activities: {
              create: {
                orgId,
                type: 'NOTE',
                summary: `Repeat trial class booking for ${activityType || 'Learning Center'}.`,
              },
            },
          },
        })
      } else {
        await createLeadWithUniqueCode(orgId, (leadCode) =>
          prisma.lead.create({
            data: {
              orgId,
              branchId: branch?.id || null,
              academicYearId: academicYear?.id || null,
              leadCode,
              parentName,
              phone,
              email: email || null,
              kidName: childName,
              gradeSought: activityType || 'Learning Center',
              phoneNormalized: identity.phoneNormalized,
              householdId: identity.householdId,
              source: 'VIDHYAAN',
              status: 'NEW',
              priority: 'MEDIUM',
              activities: {
                create: {
                  orgId,
                  type: 'NOTE',
                  summary: `Trial class booking request for ${activityType || 'Learning Center'}.`
                }
              }
            }
          })
        )
      }
    }

    // 7. Increment LC enquiryCount asynchronously
    prisma.school.update({
      where: { id: lc.id },
      data: { enquiryCount: { increment: 1 } }
    }).catch(e => console.error('Error incrementing LC enquiryCount:', e))

    // 8. Log confirmation email (Mock in development)
    console.log(`[Email Mock] Sending trial confirmation email to parent at ${email || 'phone only'}`)

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Trial class booked! We will confirm your slot within 24 hours via phone.'
    })
  } catch (error: any) {
    console.error('Trial Booking API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to book trial class' },
      { status: 500 }
    )
  }
}
