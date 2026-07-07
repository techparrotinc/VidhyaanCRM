import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { sendCampaignEmail } from '@/lib/campaign/channels'
import { sendMeteredSms } from '@/lib/credits/metered-send'

const announceSchema = z.object({
  audience: z.enum(['PARENTS', 'LEADS', 'ALL']),
  channels: z.array(z.enum(['PORTAL', 'EMAIL', 'SMS'])).min(1)
})

type Recipient = { name: string; phone: string | null; email: string | null }

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
 * Announce a published event to parents/leads through selected channels.
 * PORTAL costs nothing (published events already appear in the parent
 * portal events tab); EMAIL is free via the platform sender; SMS is
 * metered (BYO provider or 1 wallet credit per message).
 */
export const POST = route({
  module: MODULES.EVENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, params, user, org }) => {
    const { id } = (await params) as { id?: string }
    const body = announceSchema.parse(await req.json())

    const event = await db.event.findFirst({ where: { id, deletedAt: null } })
    if (!event) throw Errors.notFound('Event')
    if (event.status !== 'PUBLISHED') {
      throw Errors.businessRule('Publish the event before announcing it.')
    }

    // Build recipient list
    const recipients: Recipient[] = []
    if (body.audience === 'PARENTS' || body.audience === 'ALL') {
      const students = await prisma.student.findMany({
        where: { orgId: user.orgId, deletedAt: null, status: 'ACTIVE' },
        select: { guardianName: true, guardianPhone: true, guardianEmail: true }
      })
      for (const s of students) {
        recipients.push({ name: s.guardianName ?? 'Parent', phone: s.guardianPhone, email: s.guardianEmail })
      }
    }
    if (body.audience === 'LEADS' || body.audience === 'ALL') {
      const leads = await prisma.lead.findMany({
        where: { orgId: user.orgId, deletedAt: null, status: { notIn: ['CONVERTED', 'NOT_INTERESTED'] } },
        select: { parentName: true, phone: true, email: true }
      })
      for (const l of leads) {
        recipients.push({ name: l.parentName, phone: l.phone, email: l.email })
      }
    }

    // Dedupe by phone (fallback email)
    const seen = new Set<string>()
    const unique = recipients.filter((r) => {
      const key = r.phone || r.email || ''
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })

    const orgName = await prisma.organization
      .findUnique({ where: { id: user.orgId }, select: { name: true } })
      .then((o) => o?.name ?? 'Your school')

    const msg = eventMessage(event, orgName)
    let sent = 0
    let failed = 0

    for (const r of unique) {
      let attempted = false
      try {
        if (body.channels.includes('EMAIL') && r.email) {
          attempted = true
          await sendCampaignEmail({
            to: r.email,
            subject: msg.subject,
            body: msg.body,
            fromName: orgName,
            campaignName: event.title
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
        audience: body.audience,
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
