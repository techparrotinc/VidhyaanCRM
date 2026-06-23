import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, paginated, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }

    const platformRoles = [
      'SUPER_ADMIN',
      'OPERATIONS_ADMIN',
      'SUPPORT_ADMIN'
    ]

    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)
    const status = searchParams.get('status') ?? undefined
    const search = searchParams.get('search') ?? undefined

    const skip = (page - 1) * limit
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              users: true,
              leads: true
            }
          }
        }
      }),
      prisma.organization.count({ where })
    ])

    return paginated(orgs, total, page, limit)

  } catch (error) {
    return errorResponse(error)
  }
}
