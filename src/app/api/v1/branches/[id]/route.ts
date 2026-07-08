import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db'
import { bustBranchCaches } from '@/lib/branches'
import { ROLES } from '@/constants/roles'

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().max(20).optional().nullable(),
  addressLine: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  isDefault: z.boolean().optional()
})

export const PATCH = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user, params }) => {
    const id = params?.id as string
    const body = updateSchema.parse(await req.json())

    const branch = await prisma.branch.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!branch) throw Errors.notFound('Branch not found')

    // isDefault moves, it never disappears: setting it here clears the flag
    // on every sibling in the same transaction.
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.branch.updateMany({
          where: { orgId: user.orgId, isDefault: true, NOT: { id } },
          data: { isDefault: false }
        })
      }
      const { isDefault, ...rest } = body
      return tx.branch.update({
        where: { id },
        data: { ...rest, ...(isDefault === true ? { isDefault: true } : {}) }
      })
    })

    await bustBranchCaches(user.orgId)
    return ok(updated)
  }
})

export const DELETE = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user, params }) => {
    const id = params?.id as string

    const branch = await prisma.branch.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null }
    })
    if (!branch) throw Errors.notFound('Branch not found')
    if (branch.isDefault) {
      throw Errors.businessRule('The default branch cannot be deactivated. Make another branch the default first.')
    }
    const remaining = await prisma.branch.count({
      where: { orgId: user.orgId, deletedAt: null }
    })
    if (remaining <= 1) {
      throw Errors.businessRule('An organization must keep at least one active branch.')
    }

    const deleted = await prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    await bustBranchCaches(user.orgId)
    return ok(deleted)
  }
})
