import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { OrgStatus, AuditAction, UserStatus, InstitutionType } from '@prisma/client'
import { resolveAdminUser } from '@/lib/admin-auth'

const orgUpdateSchema = z.object({
  // Core profile fields
  name: z.string().trim().min(2).max(200).optional(),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  institutionType: z.nativeEnum(InstitutionType).optional(),
  // Ops / billing fields
  status: z.nativeEnum(OrgStatus).optional(),
  planId: z.string().max(60).nullable().optional(),
  leadCap: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  trialEndsAt: z.string().max(40).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  // Negotiated subscription discount, capped at 50% (floor-price guard)
  billingDiscountPct: z.coerce.number().int().min(0).max(50).nullable().optional()
})
import { redis } from '@/lib/redis'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'
import { remapOrgModulesToPlan } from '@/lib/billing/lifecycle'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await resolveAdminUser(req)
    if (!admin) {
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
    const admin = await resolveAdminUser(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const parsed = orgUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, email, phone, institutionType, status, planId, leadCap, trialEndsAt, notes, billingDiscountPct } = parsed.data

    // Find existing organization
    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null }
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const updateData: any = {}
    const auditLogsToCreate: any[] = []

    // 0. Core profile fields (name / email / phone / institutionType)
    if (name !== undefined && name !== org.name) {
      updateData.name = name
      auditLogsToCreate.push({ field: 'name', before: org.name, after: name })
    }
    if (email !== undefined && email !== org.email) {
      updateData.email = email
      auditLogsToCreate.push({ field: 'email', before: org.email, after: email })
    }
    if (phone !== undefined && phone !== org.phone) {
      updateData.phone = phone
      auditLogsToCreate.push({ field: 'phone', before: org.phone, after: phone })
    }
    if (institutionType !== undefined && institutionType !== org.institutionType) {
      updateData.institutionType = institutionType
      auditLogsToCreate.push({ field: 'institutionType', before: org.institutionType, after: institutionType })
    }

    // 1. Status changes verification
    if (status !== undefined && status !== org.status) {
      const oldStatus = org.status
      const newStatus = status as OrgStatus

      // Verify allowed transitions
      // ACTIVE → SUSPENDED, ACTIVE → CANCELLED, SUSPENDED → ACTIVE, PENDING_VERIFICATION → ACTIVE, TRIAL → ACTIVE
      // PENDING_VERIFICATION → SUSPENDED = reject (approvals queue "reject with note" —
      // the note lands in internalNotes via the `notes` field on this same request)
      const isAllowed =
        (oldStatus === 'ACTIVE' && (newStatus === 'SUSPENDED' || newStatus === 'CANCELLED')) ||
        (oldStatus === 'SUSPENDED' && newStatus === 'ACTIVE') ||
        (oldStatus === 'PENDING_VERIFICATION' && (newStatus === 'ACTIVE' || newStatus === 'SUSPENDED')) ||
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

    // 2. Plan update — keep the billing record consistent: a comped/manual
    // plan change gets a real subscription row (amount 0, 1-year period) so
    // the renewal cron and billing page see it, and modules follow the plan.
    if (planId !== undefined && planId !== org.planId) {
      updateData.planId = planId
      auditLogsToCreate.push({ field: 'planId', before: org.planId, after: planId })

      if (planId) {
        const targetPlan = await prisma.plan.findUnique({ where: { id: planId } })
        if (targetPlan && targetPlan.slug !== 'free') {
          const periodStart = new Date()
          const periodEnd = new Date()
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
          const existingSub = await prisma.subscription.findFirst({ where: { orgId: id } })
          const compData = {
            orgId: id,
            planId,
            status: 'ACTIVE' as const,
            billingCycle: 'ANNUAL' as const,
            amount: 0, // comped by platform admin
            startedAt: periodStart,
            currentPeriodEnd: periodEnd,
            trialEndsAt: null,
            cancelAtPeriodEnd: false,
            graceEndsAt: null,
            gatewaySubId: null
          }
          if (existingSub) {
            // Paid, still-running subscriptions keep their period; only the plan moves
            const stillPaid = existingSub.status === 'ACTIVE' && Number(existingSub.amount) > 0 &&
              existingSub.currentPeriodEnd && existingSub.currentPeriodEnd > new Date()
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: stillPaid ? { planId } : compData
            })
          } else {
            await prisma.subscription.create({ data: compData })
          }
        }
        await remapOrgModulesToPlan(id, planId)
      }
    }

    // 3. Lead cap update
    if (leadCap !== undefined && leadCap !== org.leadCap) {
      updateData.leadCap = leadCap
      auditLogsToCreate.push({ field: 'leadCap', before: org.leadCap, after: leadCap })
    }

    // 4. Trial ends update
    if (trialEndsAt !== undefined) {
      const parsedDate = trialEndsAt ? new Date(trialEndsAt) : null
      if (parsedDate && isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid trialEndsAt date' }, { status: 400 })
      }
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

    // 6. Negotiated billing discount (settings JSON; applied by pricing engine)
    if (billingDiscountPct !== undefined) {
      const currentSettings = (updateData.settings as any) || (org.settings as any) || {}
      const oldPct = currentSettings.billingDiscountPct ?? null
      if (oldPct !== billingDiscountPct) {
        updateData.settings = {
          ...currentSettings,
          billingDiscountPct: billingDiscountPct ?? undefined
        }
        auditLogsToCreate.push({ field: 'billingDiscountPct', before: oldPct, after: billingDiscountPct })
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
              userId: admin.id,
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
