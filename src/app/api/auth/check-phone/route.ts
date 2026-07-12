import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Rate limiting: 10 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitKey = `ratelimit:check-phone:${ip}`
    const requests = await redis.incr(limitKey)
    if (requests === 1) {
      await redis.set(limitKey, '1', 'EX', 60)
    }
    if (requests > 10) {
      return NextResponse.json(
        { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Try again in 1 minute.' },
        { status: 429 }
      )
    }

    // Find a loginable user. INVITED team members are included: their first
    // OTP login accepts the invite (activated in the NextAuth authorize step),
    // mirroring the lazy INVITED→ACTIVE flip parents get in parent-access.ts.
    // Without this the login page reports "No account found" for anyone an
    // admin invited, stranding the entire team-invite feature.
    const user = await prisma.user.findFirst({
      where: { phone, status: { in: ['ACTIVE', 'INVITED'] }, deletedAt: null }
    })

    if (!user) {
      return NextResponse.json({ exists: false })
    }

    const resolvedRole = await resolveTargetUserRole(user.id)

    // Multi-role users (e.g. parent AND org admin) must pick a workspace
    // before signIn — OTP codes are single-use, so the client needs the
    // assignment list up front to send assignmentId with the credentials.
    let assignments:
      | { id: string; role: string; orgName: string | null; institutionType: string | null }[]
      | undefined
    const activeAssignments = await prisma.userRoleAssignment.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      select: { id: true, role: true, orgId: true }
    })
    const orgIds = [...new Set(activeAssignments.map(a => a.orgId).filter(Boolean))] as string[]
    const orgs = orgIds.length
      ? await prisma.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true, institutionType: true }
        })
      : []
    const orgById = new Map(orgs.map(o => [o.id, o]))
    if (activeAssignments.length > 1) {
      assignments = activeAssignments.map(a => ({
        id: a.id,
        role: a.role,
        orgName: a.orgId ? orgById.get(a.orgId)?.name ?? null : null,
        institutionType: a.orgId ? orgById.get(a.orgId)?.institutionType ?? null : null
      }))
    }

    // Single-org users get their institution type up front so the login
    // "role pill" can say "Learning Center Admin" instead of "School Admin".
    const singleInstitutionType =
      activeAssignments.length === 1 && activeAssignments[0].orgId
        ? orgById.get(activeAssignments[0].orgId)?.institutionType ?? null
        : null

    return NextResponse.json({
      exists: true,
      hasPin: user.pinHash !== null,
      name: user.name,
      role: resolvedRole,
      institutionType: singleInstitutionType,
      ...(assignments ? { assignments } : {})
    })

  } catch (error: any) {
    console.error('Check phone API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
