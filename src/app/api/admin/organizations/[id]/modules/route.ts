import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { z } from 'zod'

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
      where: { id }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    const [allModules, orgModules] = await Promise.all([
      prisma.module.findMany(),
      prisma.organizationModule.findMany({
        where: { orgId: id }
      })
    ])

    const result = allModules.map((m) => {
      const enabledModule = orgModules.find((om) => om.moduleId === m.id)
      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description,
        enabled: enabledModule ? enabledModule.enabled : false
      }
    })

    return ok(result)

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

    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const { id } = await context.params

    const body = z.object({
      moduleSlug: z.string(),
      isEnabled: z.boolean()
    }).parse(await req.json())

    const org = await prisma.organization.findUnique({
      where: { id }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { slug: body.moduleSlug }
    })

    if (!moduleRecord) {
      throw Errors.notFound('Module')
    }

    const updated = await prisma.organizationModule.upsert({
      where: {
        orgId_moduleId: {
          orgId: id,
          moduleId: moduleRecord.id
        }
      },
      create: {
        orgId: id,
        moduleId: moduleRecord.id,
        enabled: body.isEnabled,
        enabledAt: body.isEnabled ? new Date() : null
      },
      update: {
        enabled: body.isEnabled,
        enabledAt: body.isEnabled ? new Date() : null
      }
    })

    // Log audit log for module toggle
    await prisma.auditLog.create({
      data: {
        orgId: id,
        userId: session.user.id,
        action: 'MODULE_TOGGLE',
        entityType: 'OrganizationModule',
        entityId: updated.id,
        after: { enabled: body.isEnabled, moduleSlug: body.moduleSlug }
      }
    })

    return ok(updated)

  } catch (error) {
    return errorResponse(error)
  }
}
