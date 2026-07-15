import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireParentFromRequest, linkedStudentsWhere } from '@/lib/parent-portal'

/**
 * Published events from every org the parent's kids belong to. The parent
 * portal events tab — dual-mode auth (web session or mobile Bearer JWT).
 */
export async function GET(req: NextRequest) {
  try {
    const parent = await requireParentFromRequest(req)
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: { orgId: true }
    })
    const orgIds = [...new Set(students.map((s) => s.orgId))]
    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const events = await prisma.event.findMany({
      where: {
        orgId: { in: orgIds },
        status: 'PUBLISHED',
        deletedAt: null,
        startsAt: { gte: since }
      },
      orderBy: { startsAt: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        startsAt: true,
        endsAt: true,
        location: true,
        meetingLink: true,
        imageUrl: true,
        capacity: true,
        organization: { select: { name: true } },
        rsvps: {
          where: { attendeeType: 'PARENT', attendeeId: parent.id },
          select: { id: true, status: true }
        },
        _count: { select: { rsvps: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        ...e,
        orgName: e.organization.name,
        myRsvp: e.rsvps[0] ?? null,
        rsvps: undefined,
        organization: undefined
      }))
    })
  } catch (error: any) {
    console.error('Parent events error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load events' }, { status: 500 })
  }
}
