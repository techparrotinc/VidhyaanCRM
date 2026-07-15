import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireParentFromRequest, linkedStudentsWhere } from '@/lib/parent-portal'
import { createNotification } from '@/lib/services/notifications'

const rsvpSchema = z.object({
  status: z.enum(['GOING', 'NOT_GOING'])
})

/** Parent RSVP to a published event of their kid's school. Dual-mode auth. */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const parent = await requireParentFromRequest(req)
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const body = rsvpSchema.parse(await req.json())

    // Event must belong to an org the parent is actually connected to
    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: { orgId: true }
    })
    const orgIds = [...new Set(students.map((s) => s.orgId))]

    const event = await prisma.event.findFirst({
      where: { id, orgId: { in: orgIds }, status: 'PUBLISHED', deletedAt: null }
    })
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }

    const existing = await prisma.eventRsvp.findFirst({
      where: { eventId: id, attendeeType: 'PARENT', attendeeId: parent.id }
    })

    if (body.status === 'GOING' && !existing && event.capacity) {
      const going = await prisma.eventRsvp.count({
        where: { eventId: id, status: { in: ['GOING', 'ATTENDED'] } }
      })
      if (going >= event.capacity) {
        return NextResponse.json({ success: false, error: 'This event is full.' }, { status: 409 })
      }
    }

    const rsvp = existing
      ? await prisma.eventRsvp.update({ where: { id: existing.id }, data: { status: body.status } })
      : await prisma.eventRsvp.create({
          data: {
            orgId: event.orgId,
            eventId: id,
            attendeeType: 'PARENT',
            attendeeId: parent.id,
            status: body.status
          }
        })

    // Alert the event creator about the RSVP (first response only per parent)
    if (!existing && event.createdById) {
      createNotification({
        orgId: event.orgId,
        recipientType: 'USER',
        recipientId: event.createdById,
        type: 'EVENT_RSVP_RECEIVED',
        title: 'New event RSVP',
        body: `${parent.name ?? 'A parent'} responded "${body.status === 'GOING' ? 'Going' : 'Not going'}" to ${event.title}.`,
        data: { eventId: id }
      }).catch((err) => console.error('RSVP notification failed:', err))
    }

    return NextResponse.json({ success: true, data: { id: rsvp.id, status: rsvp.status } })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Invalid RSVP status' }, { status: 422 })
    }
    console.error('Parent RSVP error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save RSVP' }, { status: 500 })
  }
}
