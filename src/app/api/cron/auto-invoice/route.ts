import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createNotification } from '@/lib/services/notifications'
import { notifyBatchInvoices } from '@/lib/whatsapp/emitters'

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
        const createdInvoice = await prisma.invoice.create({
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

        // WhatsApp fee notification to the guardian (fire-and-forget)
        notifyBatchInvoices(enrollment.orgId, [createdInvoice.id]).catch(() => {})

        generated++
      } catch (err: any) {
        failed++
        errors.push(`Enrollment ${enrollment.id}: ${err.message}`)
      }
    }

    // Activate SCHEDULED invoices (ids captured first so the guardians get
    // their WhatsApp fee notification on activation day, not creation day)
    const now = new Date()
    const toActivate = await prisma.invoice.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { lte: now }
      },
      select: { id: true, orgId: true }
    })
    const scheduledUpdateResult = await prisma.invoice.updateMany({
      where: { id: { in: toActivate.map(i => i.id) } },
      data: {
        status: 'UNPAID',
        scheduledDate: null
      }
    })

    const activatedCount = scheduledUpdateResult.count
    console.log(`Activated ${activatedCount} scheduled invoices.`)

    // Group by org and notify guardians (fire-and-forget)
    const byOrg = new Map<string, string[]>()
    for (const inv of toActivate) {
      byOrg.set(inv.orgId, [...(byOrg.get(inv.orgId) ?? []), inv.id])
    }
    for (const [orgId, ids] of byOrg) {
      notifyBatchInvoices(orgId, ids).catch(() => {})
    }

    // ── Activate scheduled campaigns ──────────────
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status:      'SCHEDULED',
        scheduledAt: { lte: new Date() },
        deletedAt:   null
      },
      include: {
        organization: { select: { name: true } }
      }
    })

    let campaignsActivatedCount = 0
    for (const campaign of scheduledCampaigns) {
      try {
        // Trigger the send API internally
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/campaigns/${campaign.id}/send`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({})
          }
        )
        campaignsActivatedCount++
      } catch (err) {
        console.error(
          `Failed to activate campaign ${campaign.id}:`, err
        )
      }
    }

    // ── Fee reminders: invoices due in exactly 3 days ──────────────
    // Fires once per invoice (the day it crosses the 3-day mark), aggregated
    // into one notification per org so admins aren't spammed per invoice.
    const remindStart = new Date(today)
    remindStart.setDate(remindStart.getDate() + 3)
    const remindEnd = new Date(remindStart)
    remindEnd.setDate(remindEnd.getDate() + 1)

    const dueSoon = await prisma.invoice.groupBy({
      by: ['orgId'],
      where: {
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { gte: remindStart, lt: remindEnd },
        deletedAt: null
      },
      _count: { _all: true }
    })

    let feeRemindersSent = 0
    for (const grp of dueSoon) {
      try {
        const admins = await prisma.user.findMany({
          where: {
            orgId: grp.orgId,
            roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } },
            deletedAt: null
          },
          select: { id: true }
        })
        const n = grp._count._all
        for (const admin of admins) {
          await createNotification({
            orgId: grp.orgId,
            recipientType: 'USER',
            recipientId: admin.id,
            type: 'FEE_REMINDER',
            title: 'Fees Due Soon',
            body: `${n} invoice${n === 1 ? '' : 's'} due in 3 days — follow up before they turn overdue`,
            data: { href: '/fee-management?status=UNPAID' }
          })
          feeRemindersSent++
        }
      } catch (err) {
        console.error(`Fee reminder failed for org ${grp.orgId}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueEnrollments.length,
      generated,
      failed,
      errors,
      courseInvoicesGenerated: generated,
      scheduledInvoicesActivated: activatedCount,
      scheduledCampaignsActivated: campaignsActivatedCount,
      feeRemindersSent
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
