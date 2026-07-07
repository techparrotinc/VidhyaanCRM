import { route } from '@/lib/api/compose'
import { paginated } from '@/lib/api/respond'
import { parseQuery, paginationShape } from '@/lib/api/query'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { parseChannel } from '@/lib/credits/channel'

/** GET — paginated credit movement history for a channel, newest first. */
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, user, params }) => {
    const channel = parseChannel((params as any)?.channel)
    const q = parseQuery(req.url, paginationShape)

    const where = { orgId: user.orgId, channel }
    const [entries, total] = await Promise.all([
      prisma.messageCreditLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit
      }),
      prisma.messageCreditLedger.count({ where })
    ])

    return paginated(entries, total, q.page, q.limit)
  }
})
