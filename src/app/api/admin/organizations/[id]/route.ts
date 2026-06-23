import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { z } from 'zod'
import { OrgStatus } from '@prisma/client'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }

    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const { id } = await context.params

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        plan: true,
        organizationModules: {
          include: {
            module: true
          }
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true
          }
        },
        leads: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            leadCode: true,
            parentName: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            users: true,
            leads: true,
            branches: true
          }
        }
      }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    return ok(org)

  } catch (error) {
    return errorResponse(error)
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }

    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const { id } = await context.params

    const body = z.object({
      status: z.enum([
        'PENDING_VERIFICATION', 'TRIAL', 'ACTIVE',
        'PAST_DUE', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED'
      ]).optional(),
      planId: z.string().nullable().optional(),
      leadCap: z.number().optional(),
      trialEndsAt: z.string().nullable().optional()
    }).parse(await req.json())

    const org = await prisma.organization.findUnique({
      where: { id }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status as OrgStatus
    if (body.planId !== undefined) updateData.planId = body.planId
    if (body.leadCap !== undefined) updateData.leadCap = body.leadCap
    if (body.trialEndsAt !== undefined) {
      updateData.trialEndsAt = body.trialEndsAt ? new Date(body.trialEndsAt) : null
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        plan: true
      }
    })

    return ok(updated)

  } catch (error) {
    return errorResponse(error)
  }
}
