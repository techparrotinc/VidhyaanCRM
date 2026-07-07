import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { sendMeteredSms } from '@/lib/credits/metered-send'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { resolveOrgEmail, renderEmailHtml, replaceVars } from '@/lib/mail/org-templates'

const customRecipientSchema = z.object({
  type: z.enum(['STUDENT', 'LEAD']),
  id: z.string().min(1)
})

const announceSchema = z.object({
  audience: z.enum(['PARENTS', 'LEADS', 'ALL', 'CUSTOM']),
  channels: z.array(z.enum(['PORTAL', 'EMAIL', 'SMS'])).min(1),
  /** limit PARENTS/ALL to guardians of one class */
  gradeLabel: z.string().max(50).optional().nullable(),
  /** required for CUSTOM: hand-picked students/leads (contacts resolved server-side) */
  recipients: z.array(customRecipientSchema).max(200).optional()
})

type Recipient = { name: string; phone: string | null; email: string | null }

function dedupe(recipients: Recipient[]): Recipient[] {
  const seen = new Set<string>()
  return recipients.filter((r) => {
    const key = r.phone || r.email || ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function parentRecipients(orgId: string, gradeLabel?: string | null): Promise<Recipient[]> {
  const students = await prisma.student.findMany({
    where: {
      orgId,
      deletedAt: null,
      status: 'ACTIVE',
      ...(gradeLabel ? { gradeLabel } : {})
    },
    select: { guardianName: true, guardianPhone: true, guardianEmail: true }
  })
  return students.map((s) => ({ name: s.guardianName ?? 'Parent', phone: s.guardianPhone, email: s.guardianEmail }))
}

async function leadRecipients(orgId: string): Promise<Recipient[]> {
  const leads = await prisma.lead.findMany({
    where: { orgId, deletedAt: null, status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] } },
    select: { parentName: true, phone: true, email: true }
  })
  return leads.map((l) => ({ name: l.parentName, phone: l.phone, email: l.email }))
}

async function customRecipients(
  orgId: string,
  picks: { type: 'STUDENT' | 'LEAD'; id: string }[]
): Promise<Recipient[]> {
  const studentIds = picks.filter((p) => p.type === 'STUDENT').map((p) => p.id)
  const leadIds = picks.filter((p) => p.type === 'LEAD').map((p) => p.id)
  const [students, leads] = await Promise.all([
    studentIds.length
      ? prisma.student.findMany({
          where: { id: { in: studentIds }, orgId, deletedAt: null },
          select: { guardianName: true, guardianPhone: true, guardianEmail: true }
        })
      : [],
    leadIds.length
      ? prisma.lead.findMany({
          where: { id: { in: leadIds }, orgId, deletedAt: null },
          select: { parentName: true, phone: true, email: true }
        })
      : []
  ])
  return [
    ...students.map((s) => ({ name: s.guardianName ?? 'Parent', phone: s.guardianPhone, email: s.guardianEmail })),
    ...leads.map((l) => ({ name: l.parentName, phone: l.phone, email: l.email }))
  ]
}

function eventMessage(event: { title: string; startsAt: Date; location: string | null; meetingLink: string | null }, orgName: string) {
  const when = new Date(event.startsAt).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
  const where = event.location || event.meetingLink || ''
  return {
    subject: `${event.title} — ${orgName}`,
    body: `You're invited: ${event.title}\n\nWhen: ${when}${where ? `\nWhere: ${where}` : ''}\n\n— ${orgName}`,
    sms: `${orgName}: ${event.title} on ${when}${event.location ? ` at ${event.location}` : ''}. See parent portal for details.`
  }
}

/**
 * Audience preview: recipient counts per option + per-class parent
 * counts, so the modal can show real numbers before anything is sent.
 */
export const GET = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    const [parents, leads, gradeGroups] = await Promise.all([
      parentRecipients(user.orgId),
      leadRecipients(user.orgId),
      prisma.student.groupBy({
        by: ['gradeLabel'],
        where: { orgId: user.orgId, deletedAt: null, status: 'ACTIVE', gradeLabel: { not: null } },
        _count: { _all: true },
        orderBy: { gradeLabel: 'asc' }
      })
    ])

    const parentCount = dedupe(parents).length
    const leadCount = dedupe(leads).length
    const bothCount = dedupe([...parents, ...leads]).length

    return ok({
      parents: parentCount,
      leads: leadCount,
      both: bothCount,
      grades: gradeGroups.map((g) => ({ label: g.gradeLabel, count: g._count._all }))
    })
  }
})

/**
 * Announce a published event to the chosen audience through selected
 * channels. PORTAL is free (published events already show in the parent
 * portal); EMAIL is free; SMS is metered (BYO provider or wallet credits).
 */
export const POST = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, params, user }) => {
    const { id } = (await params) as { id?: string }
    const body = announceSchema.parse(await req.json())

    const event = await db.event.findFirst({ where: { id, deletedAt: null } })
    if (!event) throw Errors.notFound('Event')
    if (event.status !== 'PUBLISHED') {
      throw Errors.businessRule('Publish the event before announcing it.')
    }

    let recipients: Recipient[] = []
    if (body.audience === 'CUSTOM') {
      if (!body.recipients?.length) {
        throw Errors.businessRule('Pick at least one recipient.')
      }
      recipients = await customRecipients(user.orgId, body.recipients)
    } else {
      if (body.audience === 'PARENTS' || body.audience === 'ALL') {
        recipients.push(...(await parentRecipients(user.orgId, body.gradeLabel)))
      }
      if (body.audience === 'LEADS' || body.audience === 'ALL') {
        recipients.push(...(await leadRecipients(user.orgId)))
      }
    }
    const unique = dedupe(recipients)

    const orgName = await prisma.organization
      .findUnique({ where: { id: user.orgId }, select: { name: true } })
      .then((o) => o?.name ?? 'Your school')

    const msg = eventMessage(event, orgName)
    const eventVars = {
      eventTitle: event.title,
      eventDate: new Date(event.startsAt).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }),
      eventLocation: event.location || event.meetingLink || '—',
      schoolName: orgName
    }
    // Resolve the org's (possibly customized) template once; per-recipient
    // name substituted below
    const template = await resolveOrgEmail(user.orgId, 'EVENT_INVITE', {
      ...eventVars,
      recipientName: '{{recipientName}}'
    })
    let sent = 0
    let failed = 0

    for (const r of unique) {
      let attempted = false
      try {
        if (body.channels.includes('EMAIL') && r.email) {
          attempted = true
          const bodyText = replaceVars(template.bodyText, { recipientName: r.name })
          await sendTransactionalEmail({
            to: r.email,
            subject: replaceVars(template.subject, { recipientName: r.name }),
            htmlBody: renderEmailHtml(bodyText, { imageUrl: event.imageUrl }),
            textBody: bodyText
          })
        }
        if (body.channels.includes('SMS') && r.phone) {
          attempted = true
          await sendMeteredSms(user.orgId, r.phone, msg.sms, `event:${event.id}`)
        }
        if (attempted) sent++
      } catch (err) {
        failed++
        console.error('Event announce send failed:', err)
      }
    }

    const announcement = await prisma.eventAnnouncement.create({
      data: {
        orgId: user.orgId,
        eventId: event.id,
        channels: body.channels,
        audience: body.audience + (body.gradeLabel ? `:${body.gradeLabel}` : ''),
        recipientCount: unique.length,
        sentCount: sent,
        failedCount: failed,
        createdById: user.id
      }
    })

    await db.event.update({
      where: { id: event.id },
      data: { audience: body.audience }
    })

    return ok({
      announcementId: announcement.id,
      recipients: unique.length,
      sent,
      failed
    })
  }
})
