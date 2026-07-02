import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { OrgStatus, AuditAction, UserStatus } from '@prisma/client'
import { redis } from '@/lib/redis'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true }
        },
        branches: {
          where: { deletedAt: null }
        },
        plan: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' }
        },
        organizationModules: true,
        schools: {
          where: { deletedAt: null }
        },
        _count: {
          select: {
            leads: true,
            admissions: true,
            students: true,
            invoices: true
          }
        }
      }
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const usersWithRoles = await Promise.all(
      org.users.map(async (u) => ({
        ...u,
        role: await resolveTargetUserRole(u.id, id)
      }))
    )

    const orgWithResolvedUsers = {
      ...org,
      users: usersWithRoles
    }

    // Health metrics calculation
    const totalLeads = org._count.leads
    const respondedLeads = await prisma.lead.count({
      where: { orgId: id, status: { not: 'NEW' }, deletedAt: null }
    })
    const convertedLeads = await prisma.lead.count({
      where: { orgId: id, status: 'CONVERTED', deletedAt: null }
    })

    const leadResponseRate = totalLeads > 0 ? Number(((respondedLeads / totalLeads) * 100).toFixed(2)) : 0
    const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0
    
    // Get profile completion from first school
    const firstSchool = org.schools[0]
    const profileCompletePct = firstSchool ? firstSchool.profileCompletion : 0

    // Trial and Subscription days left
    const now = new Date()
    let trialDaysLeft = 0
    if (org.trialEndsAt && org.trialEndsAt > now) {
      trialDaysLeft = Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    let subscriptionDaysLeft = 0
    const activeSub = org.subscriptions.find((s) => s.status === 'ACTIVE')
    if (activeSub && activeSub.currentPeriodEnd && activeSub.currentPeriodEnd > now) {
      subscriptionDaysLeft = Math.max(0, Math.ceil((activeSub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      organization: orgWithResolvedUsers,
      health: {
        leadResponseRate,
        conversionRate,
        profileCompletePct,
        trialDaysLeft,
        subscriptionDaysLeft
      }
    })

  } catch (error: any) {
    console.error('Single Org Detail API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, planId, leadCap, trialEndsAt, notes } = body

    // Find existing organization
    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null }
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const updateData: any = {}
    const auditLogsToCreate: any[] = []

    // 1. Status changes verification
    if (status !== undefined && status !== org.status) {
      const oldStatus = org.status
      const newStatus = status as OrgStatus

      // Verify allowed transitions
      // ACTIVE → SUSPENDED, ACTIVE → CANCELLED, SUSPENDED → ACTIVE, PENDING_VERIFICATION → ACTIVE, TRIAL → ACTIVE
      const isAllowed = 
        (oldStatus === 'ACTIVE' && (newStatus === 'SUSPENDED' || newStatus === 'CANCELLED')) ||
        (oldStatus === 'SUSPENDED' && newStatus === 'ACTIVE') ||
        (oldStatus === 'PENDING_VERIFICATION' && newStatus === 'ACTIVE') ||
        (oldStatus === 'TRIAL' && newStatus === 'ACTIVE')

      if (!isAllowed) {
        return NextResponse.json(
          { error: `Status transition from ${oldStatus} to ${newStatus} is not allowed.` },
          { status: 400 }
        )
      }

      updateData.status = newStatus
      auditLogsToCreate.push({ field: 'status', before: oldStatus, after: newStatus })

      // Handle user status modifications for suspension/reactivation
      if (newStatus === 'SUSPENDED') {
        await prisma.user.updateMany({
          where: { orgId: id, deletedAt: null },
          data: { status: UserStatus.SUSPENDED }
        })
      } else if (newStatus === 'ACTIVE' && oldStatus === 'SUSPENDED') {
        await prisma.user.updateMany({
          where: { orgId: id, deletedAt: null },
          data: { status: UserStatus.ACTIVE }
        })
      }
    }

    // 2. Plan update
    if (planId !== undefined && planId !== org.planId) {
      updateData.planId = planId
      auditLogsToCreate.push({ field: 'planId', before: org.planId, after: planId })
    }

    // 3. Lead cap update
    if (leadCap !== undefined && leadCap !== org.leadCap) {
      updateData.leadCap = parseInt(leadCap)
      auditLogsToCreate.push({ field: 'leadCap', before: org.leadCap, after: leadCap })
    }

    // 4. Trial ends update
    if (trialEndsAt !== undefined) {
      const parsedDate = trialEndsAt ? new Date(trialEndsAt) : null
      const oldDateStr = org.trialEndsAt ? org.trialEndsAt.toISOString() : null
      const newDateStr = parsedDate ? parsedDate.toISOString() : null

      if (oldDateStr !== newDateStr) {
        updateData.trialEndsAt = parsedDate
        auditLogsToCreate.push({ field: 'trialEndsAt', before: oldDateStr, after: newDateStr })
      }
    }

    // 5. Internal notes update (using settings JSON column)
    if (notes !== undefined) {
      const currentSettings = (org.settings as any) || {}
      const oldNotes = currentSettings.internalNotes || null
      if (oldNotes !== notes) {
        updateData.settings = {
          ...currentSettings,
          internalNotes: notes
        }
        auditLogsToCreate.push({ field: 'internalNotes', before: oldNotes, after: notes })
      }
    }

    // Perform DB update if changes exist
    let updatedOrg = org
    if (Object.keys(updateData).length > 0) {
      updatedOrg = await prisma.organization.update({
        where: { id },
        data: updateData
      })

      // Create audit logs for each changed field
      const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
      const userAgent = req.headers.get('user-agent') ?? undefined

      await Promise.all(
        auditLogsToCreate.map((change) =>
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              orgId: id,
              action: AuditAction.UPDATE,
              entityType: 'ORGANIZATION',
              entityId: id,
              before: { [change.field]: change.before },
              after: { [change.field]: change.after },
              ipAddress: ipAddress ?? null,
              userAgent: userAgent ?? null
            }
          })
        )
      ).catch((e) => console.error('Failed to save update audit logs:', e))
    }

    // Invalidate organization cache
    try {
      await redis.del(`org:${id}`)
    } catch (err) {
      console.error('Failed to invalidate organization cache:', err)
    }

    return NextResponse.json(updatedOrg)

  } catch (error: any) {
    console.error('Update Org API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
