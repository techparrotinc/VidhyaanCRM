import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// Lightweight global admin search across organizations, schools/listings and parents.
// Read-only; SUPER_ADMIN / OPERATIONS_ADMIN only.
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ organizations: [], listings: [], parents: [] })
    }

    const contains = { contains: q, mode: 'insensitive' as const }

    const [organizations, listings, parents] = await Promise.all([
      prisma.organization.findMany({
        where: {
          deletedAt: null,
          OR: [{ name: contains }, { email: contains }, { slug: contains }, { phone: contains }],
        },
        select: { id: true, name: true, email: true, institutionType: true, status: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.school.findMany({
        where: { deletedAt: null, OR: [{ name: contains }, { slug: contains }] },
        select: { id: true, name: true, institutionType: true, verificationStatus: true, organization: { select: { id: true } } },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.parent.findMany({
        where: { deletedAt: null, OR: [{ name: contains }, { email: contains }, { phone: contains }] },
        select: { id: true, name: true, email: true, phone: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ organizations, listings, parents })
  } catch (error: any) {
    console.error('Admin search API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
