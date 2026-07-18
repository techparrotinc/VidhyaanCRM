import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// The Gallery tab's "Save Order" button previously showed a success toast
// with no API call behind it at all — reordering never persisted past a
// page reload. This is the actual endpoint for it.
const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100)
})

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }
    const { ids } = parsed.data

    const school = await prisma.school.findFirst({ where: { orgId: session.user.orgId } })
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Ownership check — every id must belong to this school, or the whole
    // reorder is rejected (no partial reorder mixing another org's rows in).
    const owned = await prisma.schoolMedia.count({
      where: { id: { in: ids }, schoolId: school.id, deletedAt: null }
    })
    if (owned !== ids.length) {
      return NextResponse.json({ error: 'One or more media items do not belong to this school' }, { status: 403 })
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.schoolMedia.update({ where: { id }, data: { sortOrder: index } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT school-profile media reorder error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
