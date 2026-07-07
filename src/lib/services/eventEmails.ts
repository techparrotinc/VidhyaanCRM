import { prisma } from '@/lib/db'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { eventInviteTemplate } from '@/lib/mail/templates'
import { resolveOrgEmail, renderEmailHtml, replaceVars } from '@/lib/mail/org-templates'
import { EVENT_TYPE_LABELS, EventType } from '@/constants/events'

// All sends are fire-and-forget from the caller's perspective: email failure
// must never fail the CRM action. Callers invoke without await or .catch().

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const fmtIST = (d: Date | string) =>
  new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  }) + ' IST'

interface EventLike {
  id: string
  orgId: string
  title: string
  type: string | null
  startsAt: Date | string
  endsAt: Date | string | null
  location: string | null
  meetingLink: string | null
  description: string | null
}

async function orgName(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true }
  })
  return org?.name ?? 'Your institution'
}

export async function resolveAttendeeContact(
  attendeeType: string,
  attendeeId: string
): Promise<{ name: string; email: string | null } | null> {
  if (attendeeType === 'LEAD') {
    const lead = await prisma.lead.findUnique({
      where: { id: attendeeId },
      select: { parentName: true, email: true }
    })
    return lead ? { name: lead.parentName, email: lead.email } : null
  }
  if (attendeeType === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { id: attendeeId },
      select: { name: true, email: true }
    })
    return parent ? { name: parent.name ?? 'Parent', email: parent.email } : null
  }
  const user = await prisma.user.findUnique({
    where: { id: attendeeId },
    select: { name: true, email: true }
  })
  return user ? { name: user.name, email: user.email } : null
}

export async function sendEventInvite(
  event: EventLike,
  attendeeType: string,
  attendeeId: string
): Promise<void> {
  try {
    if (!process.env.ZEPTOMAIL_API_TOKEN) return
    const contact = await resolveAttendeeContact(attendeeType, attendeeId)
    if (!contact?.email || !contact.email.includes('@')) return

    const org = await orgName(event.orgId)
    const typeLabel = EVENT_TYPE_LABELS[event.type as EventType] ?? 'Event'

    await sendTransactionalEmail({
      to: contact.email,
      toName: contact.name,
      subject: `Invitation: ${event.title} — ${org}`,
      htmlBody: eventInviteTemplate({
        recipientName: esc(contact.name),
        orgName: esc(org),
        eventTitle: esc(event.title),
        eventType: typeLabel,
        startsAt: fmtIST(event.startsAt),
        endsAt: event.endsAt ? fmtIST(event.endsAt) : null,
        location: event.location ? esc(event.location) : null,
        meetingLink: event.meetingLink,
        description: event.description ? esc(event.description) : null
      }),
      textBody: `You're invited to ${event.title} by ${org} on ${fmtIST(event.startsAt)}${event.location ? ` at ${event.location}` : ''}.`
    })
  } catch (err) {
    console.error(`Failed to send event invite (event ${event.id}, ${attendeeType} ${attendeeId}):`, err)
  }
}

/** Notify every GOING/MAYBE attendee that the event was cancelled. */
export async function sendEventCancellationNotices(event: EventLike): Promise<void> {
  try {
    if (!process.env.ZEPTOMAIL_API_TOKEN) return
    const rsvps = await prisma.eventRsvp.findMany({
      where: { eventId: event.id, status: { in: ['GOING', 'MAYBE'] }, attendeeId: { not: null } },
      select: { attendeeType: true, attendeeId: true }
    })
    if (rsvps.length === 0) return

    const org = await orgName(event.orgId)

    // Org-customizable template; recipient name substituted per attendee
    const template = await resolveOrgEmail(event.orgId, 'EVENT_CANCELLED', {
      eventTitle: event.title,
      eventDate: fmtIST(event.startsAt),
      schoolName: org,
      recipientName: '{{recipientName}}'
    })

    await Promise.allSettled(
      rsvps.map(async (r) => {
        const contact = await resolveAttendeeContact(r.attendeeType, r.attendeeId!)
        if (!contact?.email || !contact.email.includes('@')) return
        const bodyText = replaceVars(template.bodyText, { recipientName: contact.name })
        await sendTransactionalEmail({
          to: contact.email,
          toName: contact.name,
          subject: replaceVars(template.subject, { recipientName: contact.name }),
          htmlBody: renderEmailHtml(bodyText),
          textBody: bodyText
        })
      })
    )
  } catch (err) {
    console.error(`Failed to send cancellation notices (event ${event.id}):`, err)
  }
}
