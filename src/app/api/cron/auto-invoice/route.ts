import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    // Find all active enrollments due for billing today
    const dueEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        course: true,
        student: {
          select: {
            id: true,
            orgId: true,
            academicYearId: true
          }
        }
      }
    })

    let generated = 0
    let failed = 0
    const errors: string[] = []

    for (const enrollment of dueEnrollments) {
      try {
        const year = new Date().getFullYear()
        const count = await prisma.invoice.count({
          where: { orgId: enrollment.orgId }
        })
        const invoiceNumber =
          'INV-' + year + '-' + String(count + 1).padStart(5, '0')

        // Create invoice
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            invoiceType: 'COURSE',
            orgId: enrollment.orgId,
            academicYearId: enrollment.student.academicYearId ?? null,
            totalAmount: enrollment.course.amount,
            paidAmount: 0,
            lateFeeAmount: 0,
            status: 'UNPAID',
            dueDate: enrollment.nextBillingDate,
            notes: `Auto-generated: ${enrollment.course.name}`,
            items: {
              create: [
                {
                  head: enrollment.course.name,
                  amount: Number(enrollment.course.amount),
                  quantity: 1,
                  orgId: enrollment.orgId
                }
              ]
            }
          }
        })

        // Calculate next billing date based on course frequency
        const current = enrollment.nextBillingDate ?? new Date()
        let next = new Date(current)

        switch (enrollment.course.frequency) {
          case 'MONTHLY':
            next.setMonth(next.getMonth() + 1)
            break
          case 'QUARTERLY':
            next.setMonth(next.getMonth() + 3)
            break
          case 'HALF_YEARLY':
            next.setMonth(next.getMonth() + 6)
            break
          case 'ANNUAL':
            next.setFullYear(next.getFullYear() + 1)
            break
          default:
            next.setMonth(next.getMonth() + 1)
        }

        // Update enrollment with next billing date
        await prisma.courseEnrollment.update({
          where: { id: enrollment.id },
          data: { nextBillingDate: next }
        })

        generated++
      } catch (err: any) {
        failed++
        errors.push(`Enrollment ${enrollment.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueEnrollments.length,
      generated,
      failed,
      errors
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message
      },
      { status: 500 }
    )
  }
}
