import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { forOrg } from '@/lib/db/tenant'
import { Errors } from './errors'
import { errorResponse } from './respond'
import { redis } from '@/lib/redis'
import { isUserRevoked, isAssignmentRevoked } from '@/lib/auth/roleRevocation'

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

type RouteConfig = {
  module?: string
  roles?: string[]
  allowPublic?: boolean
  handler: (ctx: RouteContext) => Promise<NextResponse>
}

type RouteContext = {
  req: NextRequest
  user: {
    id: string
    role: string
    orgId: string
    name: string
  }
  org: {
    id: string
    status: string
    leadCap: number
    planId: string | null
  }
  db: ReturnType<typeof forOrg>
  academicYearId: string | null
  params?: Record<string, string>
}

export function route(config: RouteConfig) {
  return async function handler(
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    try {
      // STEP 1: Get auth session
      const userId = req.headers.get('x-user-id')
      const userRole = req.headers.get('x-user-role')
      const orgId = req.headers.get('x-org-id')
      const userName = req.headers.get('x-user-name')

      let user: { id: string; role: string; orgId: string; name: string }
      let activeRoleAssignmentId: string | null | undefined

      if (userId && orgId && userRole) {
        user = {
          id: userId,
          role: userRole,
          orgId: orgId,
          name: userName ?? ''
        }
        const assignmentHeader = req.headers.get('x-active-role-assignment-id')
        activeRoleAssignmentId = assignmentHeader && assignmentHeader !== '' ? assignmentHeader : undefined
      } else {
        const session = await auth()
        if (!session?.user) {
          throw Errors.unauthenticated()
        }
        user = {
          id: session.user.id,
          role: session.user.role,
          orgId: session.user.orgId,
          name: session.user.name ?? ''
        }
        activeRoleAssignmentId = session.user.activeRoleAssignmentId
      }

      // Revocation checks
      const revoked = await isUserRevoked(user.id)
      if (revoked) {
        throw Errors.unauthenticated()
      }
      const assignmentRevoked = await isAssignmentRevoked(user.id, activeRoleAssignmentId)
      if (assignmentRevoked) {
        throw Errors.unauthenticated()
      }

      // STEP 2: Check role
      if (config.roles && !config.roles.includes(user.role)) {
        throw Errors.forbidden('Your role cannot perform this action')
      }

      // STEP 3: Get organization
      let org = null
      const orgCacheKey = `org:${user.orgId}`
      try {
        const cached = await redis.get(orgCacheKey)
        if (cached) {
          org = JSON.parse(cached)
        }
      } catch (err) {
        console.error('Org cache read:', err)
      }

      if (!org) {
        org = await prisma.organization.findFirst({
          where: {
            id: user.orgId,
            deletedAt: null
          },
          select: {
            id: true,
            status: true,
            leadCap: true,
            planId: true
          }
        })

        if (org) {
          try {
            await redis.set(orgCacheKey, JSON.stringify(org), 'EX', 300)
          } catch (err) {
            console.error('Org cache write:', err)
          }
        }
      }

      if (!org) {
        throw Errors.forbidden('Organization not found')
      }

      if ((org.status as string) === 'SUSPENDED') {
        throw Errors.forbidden('Your account has been suspended')
      }

      // STEP 4: Check module access
      if (config.module) {
        let moduleAccess = null
        const moduleCacheKey = `org:${user.orgId}:module:${config.module}`
        try {
          const cached = await redis.get(moduleCacheKey)
          if (cached) {
            moduleAccess = JSON.parse(cached)
          }
        } catch (err) {
          console.error('Module cache read:', err)
        }

        if (!moduleAccess) {
          moduleAccess = await prisma.organizationModule.findFirst({
            where: {
              orgId: user.orgId,
              module: {
                slug: config.module
              },
              enabled: true
            }
          })

          if (moduleAccess) {
            try {
              await redis.set(moduleCacheKey, JSON.stringify(moduleAccess), 'EX', 300)
            } catch (err) {
              console.error('Module cache write:', err)
            }
          }
        }

        if (!moduleAccess) {
          throw Errors.moduleLocked(config.module)
        }
      }

      // STEP 5: Check read-only state
      const isReadOnly =
        (org.status as string) === 'TRIAL_EXPIRED' ||
        (org.status as string) === 'PAST_DUE'

      if (isReadOnly && MUTATING_METHODS.includes(req.method)) {
        throw Errors.featureReadOnly()
      }

      // STEP 6: Create tenant DB client
      const db = forOrg(user.orgId)

      // STEP 7: Resolve academic year
      let activeYear = null
      const academicYearCacheKey = `org:${user.orgId}:academic-year:active`
      try {
        const cached = await redis.get(academicYearCacheKey)
        if (cached) {
          activeYear = JSON.parse(cached)
        }
      } catch (err) {
        console.error('AY cache read:', err)
      }

      if (!activeYear) {
        activeYear = await db.academicYear.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true, status: true }
        })

        if (activeYear) {
          try {
            await redis.set(academicYearCacheKey, JSON.stringify(activeYear), 'EX', 3600)
          } catch (err) {
            console.error('AY cache write:', err)
          }
        }
      }

      const academicYearId =
        req.headers.get('x-academic-year-id') ??
        activeYear?.id ??
        null

      // Check if year is closed
      if (
        academicYearId &&
        academicYearId !== activeYear?.id &&
        MUTATING_METHODS.includes(req.method)
      ) {
        throw Errors.businessRule(
          'Academic year is closed. Historical data is read-only.'
        )
      }

      // STEP 8: Run handler
      const ctx: RouteContext = {
        req,
        user,
        org: {
          id: org.id,
          status: org.status as string,
          leadCap: org.leadCap,
          planId: org.planId
        },
        db,
        academicYearId,
        params: context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
      }

      return await config.handler(ctx)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
