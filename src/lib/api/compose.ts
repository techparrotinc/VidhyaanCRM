import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { forOrg, type BranchContext } from '@/lib/db/tenant'
import { Errors } from './errors'
import { errorResponse } from './respond'
import { redis } from '@/lib/redis'
import { isUserRevoked, isAssignmentRevoked } from '@/lib/auth/roleRevocation'
import { trackFeatureUsage } from '@/lib/usage/track'
import { getFeatureFlags } from '@/lib/platform-config'

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'])

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Feature key for usage analytics: prefer the route's declared module, else the
// entity segment of the path (/api/v1/leads/123 → "leads").
function usageFeatureFor(module: string | undefined, pathname: string): string {
  if (module) return module
  const parts = pathname.split('/').filter(Boolean) // ["api","v1","leads",...]
  return parts[2] || 'other'
}

type RouteConfig = {
  module?: string
  roles?: string[]
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
  /** Resolved multi-branch scope (multi-branch-architecture.md §3.1).
   *  activeBranchId: the single branch the request is narrowed to (null = all
   *  accessible). allowedBranchIds: hard access boundary (null = whole org). */
  branch: BranchContext
  params?: Record<string, string>
}

// Roles whose data access is limited to their UserBranchAccess grants.
// Phase 1: BRANCH_ADMIN only; COUNSELLOR scoping arrives in Phase 2.
const BRANCH_RESTRICTED_ROLES = new Set(['BRANCH_ADMIN'])

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

      // STEP 1b: Fire every independent lookup in parallel. Revocation is
      // keyed on userId; org/module/academic-year caches are keyed on orgId —
      // all known from the request headers, none depends on another's result.
      // On the hot path (all cached) this is one round-trip instead of five
      // sequential Redis calls.
      const orgCacheKey = `org:${user.orgId}`
      const moduleCacheKey = config.module ? `org:${user.orgId}:module:${config.module}` : null
      const academicYearCacheKey = `org:${user.orgId}:academic-year:active`
      const orgBranchesCacheKey = `org:${user.orgId}:branch-ids`
      const userBranchesCacheKey = `user:${user.id}:branch-ids`
      const requestedBranchHeader = req.headers.get('x-branch-id')
      const requestedBranchId =
        requestedBranchHeader && requestedBranchHeader !== '' && requestedBranchHeader !== 'all'
          ? requestedBranchHeader
          : null
      const branchRestricted = BRANCH_RESTRICTED_ROLES.has(user.role)
      // Org branch list only needed to validate an explicit switch; the
      // restricted-role grant lookup is always needed for those roles.
      const needOrgBranches = requestedBranchId !== null
      const safeGet = (key: string) =>
        redis.get(key).catch((err) => {
          console.error('Cache read:', key, err)
          return null
        })

      const [revoked, assignmentRevoked, orgCached, moduleCached, ayCached, orgBranchesCached, userBranchesCached] = await Promise.all([
        isUserRevoked(user.id),
        isAssignmentRevoked(user.id, activeRoleAssignmentId),
        safeGet(orgCacheKey),
        moduleCacheKey ? safeGet(moduleCacheKey) : Promise.resolve(null),
        safeGet(academicYearCacheKey),
        needOrgBranches ? safeGet(orgBranchesCacheKey) : Promise.resolve(null),
        branchRestricted ? safeGet(userBranchesCacheKey) : Promise.resolve(null),
      ])

      // Revocation checks
      if (revoked) {
        throw Errors.unauthenticated()
      }
      if (assignmentRevoked) {
        throw Errors.unauthenticated()
      }

      // STEP 2: Check role
      if (config.roles && !config.roles.includes(user.role)) {
        throw Errors.forbidden('Your role cannot perform this action')
      }

      // STEP 3: Get organization
      let org = orgCached ? JSON.parse(orgCached) : null

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

      // STEP 3.5: Platform-wide feature gates (60s-cached resolver). Platform
      // roles are exempt so ops keep working during maintenance. Campaign/AI
      // are global kill-switches (default ON); turning one off disables that
      // capability for every org on top of per-org module licensing.
      if (!PLATFORM_ROLES.has(user.role)) {
        const flags = await getFeatureFlags()
        if (flags.maintenanceMode) {
          return NextResponse.json(
            { success: false, error: 'The platform is undergoing scheduled maintenance. Please try again shortly.' },
            { status: 503 }
          )
        }
        if (config.module === 'campaign_management' && !flags.enableCampaignModule) {
          return NextResponse.json(
            { success: false, error: 'The campaigns module is currently disabled by the platform administrator.' },
            { status: 403 }
          )
        }
        if (req.nextUrl.pathname.startsWith('/api/v1/ai') && !flags.enableAiFeatures) {
          return NextResponse.json(
            { success: false, error: 'AI features are currently disabled by the platform administrator.' },
            { status: 403 }
          )
        }
      }

      // STEP 4: Check module access
      if (config.module && moduleCacheKey) {
        let moduleAccess = moduleCached ? JSON.parse(moduleCached) : null

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

      // STEP 5b: Resolve branch scope (multi-branch-architecture.md §3.1).
      // The client-sent x-branch-id is a preference; this clamp is the
      // authority. Fail closed for branch-restricted roles.
      let allowedBranchIds: string[] | null = null
      if (branchRestricted) {
        let grants: string[] | null = userBranchesCached ? JSON.parse(userBranchesCached) : null
        if (!grants) {
          const rows = await prisma.userBranchAccess.findMany({
            where: { userId: user.id, branch: { orgId: user.orgId, deletedAt: null } },
            select: { branchId: true }
          })
          grants = rows.map(r => r.branchId)
          try {
            await redis.set(userBranchesCacheKey, JSON.stringify(grants), 'EX', 300)
          } catch (err) {
            console.error('User branches cache write:', err)
          }
        }
        allowedBranchIds = grants
      }

      let activeBranchId: string | null = null
      if (requestedBranchId) {
        if (allowedBranchIds) {
          // Restricted role: switch only within own grants; anything else is
          // ignored and the grant set stays the boundary.
          if (allowedBranchIds.includes(requestedBranchId)) {
            activeBranchId = requestedBranchId
          }
        } else {
          // Unrestricted role: validate the branch actually belongs to this
          // org; stale/foreign ids degrade to the all-branches view.
          let orgBranchIds: string[] | null = orgBranchesCached ? JSON.parse(orgBranchesCached) : null
          if (!orgBranchIds) {
            const rows = await prisma.branch.findMany({
              where: { orgId: user.orgId, deletedAt: null },
              select: { id: true }
            })
            orgBranchIds = rows.map(r => r.id)
            try {
              await redis.set(orgBranchesCacheKey, JSON.stringify(orgBranchIds), 'EX', 300)
            } catch (err) {
              console.error('Org branches cache write:', err)
            }
          }
          if (orgBranchIds.includes(requestedBranchId)) {
            activeBranchId = requestedBranchId
          }
        }
      }

      const branch: BranchContext = {
        branchIds: activeBranchId ? [activeBranchId] : allowedBranchIds,
        activeBranchId:
          activeBranchId ??
          (allowedBranchIds && allowedBranchIds.length === 1 ? allowedBranchIds[0] : null)
      }

      // STEP 6: Create tenant DB client
      const db = forOrg(user.orgId, branch)

      // STEP 7: Resolve academic year (cache read already batched above)
      let activeYear = ayCached ? JSON.parse(ayCached) : null

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
        branch,
        params: context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
      }

      const response = await config.handler(ctx)

      // Feature-usage analytics (fire-and-forget). Track meaningful actions —
      // mutating requests that ran without throwing — for the admin usage
      // dashboard. Never awaited; failures are swallowed inside the helper.
      if (MUTATING_METHODS.includes(req.method)) {
        trackFeatureUsage({
          orgId: user.orgId,
          userId: user.id,
          feature: usageFeatureFor(config.module, req.nextUrl.pathname),
          action: req.method,
          path: req.nextUrl.pathname,
        })
      }

      return response
    } catch (error) {
      return errorResponse(error)
    }
  }
}
