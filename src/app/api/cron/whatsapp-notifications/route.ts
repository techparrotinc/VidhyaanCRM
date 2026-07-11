import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'
import { sendTemplateNotification } from '@/lib/whatsapp/notify'
import { formatInr, invoiceItemsLabel } from '@/lib/whatsapp/emitters'

// Daily WhatsApp workflow reminders. Idempotency strategies:
//  - date-window jobs (fee due/overdue/final/escalation) match an exact
//    day offset, so a once-a-day cron sends exactly once per invoice;
//  - one-shot jobs (lead follow-up, SLA alerts) drop a marker activity row
//    and skip records that already carry it.
// Every send respects org template adoption via sendTemplateNotification.

export const maxDuration = 300

const FOLLOWUP_MARKER = 'WhatsApp follow-up nudge sent'
const LEAD_SLA_MARKER = 'WhatsApp SLA breach alert sent'
const ADMISSION_SLA_MARKER = 'WhatsApp SLA alert sent'

const FOLLOWUP_AFTER_DAYS = 3
const SLA_AFTER_DAYS = 5
const OVERDUE_AFTER_DAYS = 1
const FINAL_AFTER_DAYS = 14
const ESCALATION_AFTER_DAYS = 30

function dayWindow(offsetDays: number): { gte: Date; lte: Date } {
  const start = new Date()
  start.setDate(start.getDate() + offsetDays)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { gte: start, lte: end }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function whatsappOrgIds(): Promise<string[]> {
  const rows = await prisma.organizationModule.findMany({
    where: { enabled: true, module: { slug: MODULES.WHATSAPP_ADDON } },
    select: { orgId: true }
  })
  return rows.map(r => r.orgId)
}

async function orgAdmins(orgId: string): Promise<Array<{ name: string; phone: string | null }>> {
  return prisma.user.findMany({
    where: {
      orgId,
      deletedAt: null,
      status: 'ACTIVE',
      phone: { not: null },
      roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }
    },
    select: { name: true, phone: true },
    take: 3
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgIds = await whatsappOrgIds()
  if (orgIds.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const orgNames = new Map(
    (
      await prisma.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, name: true }
      })
    ).map(o => [o.id, o.name])
  )

  const counters: Record<string, number> = {}
  const bump = (k: string) => (counters[k] = (counters[k] ?? 0) + 1)

  // ── 1. Lead follow-up nudge to the parent (once per lead, after N quiet days)
  const staleLeads = await prisma.lead.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      status: { in: ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING'] },
      createdAt: { lt: daysAgo(FOLLOWUP_AFTER_DAYS) },
      activities: {
        none: {
          OR: [
            { createdAt: { gte: daysAgo(FOLLOWUP_AFTER_DAYS) } },
            { summary: FOLLOWUP_MARKER }
          ]
        }
      }
    },
    select: {
      id: true, orgId: true, parentName: true, phone: true,
      gradeSought: true, course: true, batch: true, assignedToId: true,
      kidName: true
    },
    take: 500
  })
  for (const lead of staleLeads) {
    const sent = await sendTemplateNotification({
      orgId: lead.orgId,
      template: 'followup_reminder_only_if_no_response__23_days',
      phone: lead.phone,
      values: {
        parentName: lead.parentName,
        grade: lead.gradeSought || lead.course || lead.batch || 'admission',
        schoolName: orgNames.get(lead.orgId) ?? 'our institution'
      },
      ref: `lead_followup:${lead.id}`
    }).catch(() => false)
    if (sent) {
      bump('followup_reminder')
      await prisma.leadActivity.create({
        data: { orgId: lead.orgId, leadId: lead.id, type: 'SYSTEM', summary: FOLLOWUP_MARKER }
      })
    }

    // Same staleness signal → SLA alert to the assigned counsellor (own marker,
    // longer threshold handled below via createdAt check)
  }

  // ── 2. Lead SLA breach → assigned counsellor (once per lead)
  const slaLeads = await prisma.lead.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      status: { in: ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING'] },
      assignedToId: { not: null },
      createdAt: { lt: daysAgo(SLA_AFTER_DAYS) },
      activities: {
        none: {
          OR: [
            { createdAt: { gte: daysAgo(SLA_AFTER_DAYS) } },
            { summary: LEAD_SLA_MARKER }
          ]
        }
      }
    },
    select: {
      id: true, orgId: true, parentName: true, kidName: true,
      assignedTo: { select: { name: true, phone: true } }
    },
    take: 500
  })
  for (const lead of slaLeads) {
    if (!lead.assignedTo?.phone) continue
    const sent = await sendTemplateNotification({
      orgId: lead.orgId,
      template: 'sla_breach_alert',
      phone: lead.assignedTo.phone,
      values: {
        counsellorName: lead.assignedTo.name,
        days: String(SLA_AFTER_DAYS),
        parentName: lead.parentName,
        kidName: lead.kidName || '-'
      },
      ref: `lead_sla:${lead.id}`
    }).catch(() => false)
    if (sent) {
      bump('sla_breach_alert')
      await prisma.leadActivity.create({
        data: { orgId: lead.orgId, leadId: lead.id, type: 'SYSTEM', summary: LEAD_SLA_MARKER }
      })
    }
  }

  // ── 3. Admission SLA → org admins (once per admission)
  const slaAdmissions = await prisma.admission.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      archivedAt: null,
      status: 'IN_PROGRESS',
      createdAt: { lt: daysAgo(SLA_AFTER_DAYS) },
      activities: {
        none: {
          OR: [
            { createdAt: { gte: daysAgo(SLA_AFTER_DAYS) } },
            { summary: ADMISSION_SLA_MARKER }
          ]
        }
      }
    },
    select: {
      id: true, orgId: true, applicantName: true,
      assignedTo: { select: { name: true } }
    },
    take: 500
  })
  for (const adm of slaAdmissions) {
    let any = false
    for (const admin of await orgAdmins(adm.orgId)) {
      const sent = await sendTemplateNotification({
        orgId: adm.orgId,
        template: 'admission_sla_alert',
        phone: admin.phone,
        values: {
          adminName: admin.name,
          days: String(SLA_AFTER_DAYS),
          counsellorName: adm.assignedTo?.name ?? 'Unassigned',
          kidName: adm.applicantName
        },
        ref: `admission_sla:${adm.id}`
      }).catch(() => false)
      any = any || sent
    }
    if (any) {
      bump('admission_sla_alert')
      await prisma.admissionActivity.create({
        data: { orgId: adm.orgId, admissionId: adm.id, type: 'SYSTEM', summary: ADMISSION_SLA_MARKER }
      })
    }
  }

  // ── 4–6. Fee reminders on exact day offsets (window match = idempotent)
  const feeJobs: Array<{
    template: string
    counter: string
    window: { gte: Date; lte: Date }
    values: (inv: any) => Record<string, string>
  }> = [
    {
      template: 'fee_due_reminder',
      counter: 'fee_due_reminder',
      window: dayWindow(3), // due in 3 days
      values: inv => ({
        parentName: inv.student?.guardianName || 'Parent',
        kidName: inv.student?.name || '-',
        plan: invoiceItemsLabel(inv.items),
        amount: formatInr(Number(inv.totalAmount) - Number(inv.paidAmount)),
        term: inv.term?.name || 'this term',
        date: inv.dueDate ? format(inv.dueDate, 'd MMM yyyy') : '-'
      })
    },
    {
      template: 'fee_overdue_notice',
      counter: 'fee_overdue_notice',
      window: dayWindow(-OVERDUE_AFTER_DAYS),
      values: inv => ({
        parentName: inv.student?.guardianName || 'Parent',
        kidName: inv.student?.name || '-',
        plan: invoiceItemsLabel(inv.items),
        amount: formatInr(Number(inv.totalAmount) - Number(inv.paidAmount)),
        term: inv.term?.name || 'this term',
        date: inv.dueDate ? format(inv.dueDate, 'd MMM yyyy') : '-'
      })
    },
    {
      template: 'final_reminder',
      counter: 'final_reminder',
      window: dayWindow(-FINAL_AFTER_DAYS),
      values: inv => ({
        parentName: inv.student?.guardianName || 'Parent',
        kidName: inv.student?.name || '-',
        amount: formatInr(Number(inv.totalAmount) - Number(inv.paidAmount)),
        term: inv.term?.name || 'this term'
      })
    }
  ]

  for (const job of feeJobs) {
    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: { in: orgIds },
        deletedAt: null,
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: job.window
      },
      include: {
        student: { select: { name: true, guardianName: true, guardianPhone: true, gradeLabel: true } },
        items: { select: { head: true } },
        term: { select: { name: true } }
      },
      take: 1000
    })
    for (const inv of invoices) {
      const sent = await sendTemplateNotification({
        orgId: inv.orgId,
        template: job.template,
        phone: inv.student?.guardianPhone,
        values: job.values(inv),
        ref: `${job.counter}:${inv.id}`
      }).catch(() => false)
      if (sent) bump(job.counter)
    }
  }

  // ── 7. Escalation to admins: unpaid ESCALATION_AFTER_DAYS past due
  const escalations = await prisma.invoice.findMany({
    where: {
      orgId: { in: orgIds },
      deletedAt: null,
      status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      dueDate: dayWindow(-ESCALATION_AFTER_DAYS)
    },
    include: {
      student: { select: { name: true, gradeLabel: true } },
      term: { select: { name: true } }
    },
    take: 500
  })
  for (const inv of escalations) {
    for (const admin of await orgAdmins(inv.orgId)) {
      const sent = await sendTemplateNotification({
        orgId: inv.orgId,
        template: 'admin_fee_escalation',
        phone: admin.phone,
        values: {
          adminName: admin.name,
          days: String(ESCALATION_AFTER_DAYS),
          kidName: inv.student?.name || '-',
          grade: inv.student?.gradeLabel || '-',
          amount: formatInr(Number(inv.totalAmount) - Number(inv.paidAmount)),
          term: inv.term?.name || 'this term'
        },
        ref: `fee_escalation:${inv.id}`
      }).catch(() => false)
      if (sent) bump('admin_fee_escalation')
    }
  }

  // ── 8. Monthly pending-fee summary to admins (1st of the month)
  if (new Date().getDate() === 1) {
    for (const orgId of orgIds) {
      const agg = await prisma.invoice.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] }
        },
        _count: { id: true },
        _sum: { totalAmount: true, paidAmount: true }
      })
      if (!agg._count.id) continue
      const outstanding = Number(agg._sum.totalAmount ?? 0) - Number(agg._sum.paidAmount ?? 0)
      for (const admin of await orgAdmins(orgId)) {
        const sent = await sendTemplateNotification({
          orgId,
          template: 'admin_fee_monthly_summary',
          phone: admin.phone,
          values: {
            adminName: admin.name,
            count: String(agg._count.id),
            amount: formatInr(outstanding)
          },
          ref: `fee_monthly_summary:${orgId}:${format(new Date(), 'yyyy-MM')}`
        }).catch(() => false)
        if (sent) bump('admin_fee_monthly_summary')
      }
    }
  }

  return NextResponse.json({ ok: true, counters })
}
