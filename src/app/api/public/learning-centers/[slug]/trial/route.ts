import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const body = await req.json()

    const {
      parentName,
      phone,
      email,
      childName,
      childAge,
      batchScheduleId,
      preferredDate,
      activityType,
      message
    } = body

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
        institutionType: 'LEARNING_CENTER'
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

    // 4. Check for duplicates in the last 48 hours
    const duplicate = await prisma.trialClassBooking.findFirst({
      where: {
        schoolId: lc.id,
        phone,
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      }
    })

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'You already booked a trial class at this center recently.' },
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
      const branch = await prisma.branch.findFirst({
        where: { orgId: lc.orgId, isDefault: true }
      })

      const academicYear = await prisma.academicYear.findFirst({
        where: { orgId: lc.orgId, status: 'ACTIVE' }
      })

      const year = new Date().getFullYear()
      const leadCount = await prisma.lead.count({
        where: { orgId: lc.orgId }
      })
      const leadCode = `LD-${year}-${String(leadCount + 1).padStart(5, '0')}`

      await prisma.lead.create({
        data: {
          orgId: lc.orgId,
          branchId: branch?.id || null,
          academicYearId: academicYear?.id || null,
          leadCode,
          parentName,
          phone,
          email: email || null,
          kidName: childName,
          gradeSought: activityType || 'Learning Center',
          source: 'VIDHYAAN',
          status: 'NEW',
          priority: 'MEDIUM',
          activities: {
            create: {
              orgId: lc.orgId,
              type: 'NOTE',
              summary: `Trial class booking request for ${activityType || 'Learning Center'}.`
            }
          }
        }
      })
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
