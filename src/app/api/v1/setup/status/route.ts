import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { evaluateSetupSteps, type SetupState } from '@/lib/setup/steps'

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ user }) => {
    const summary = await evaluateSetupSteps(user.orgId)
    return ok(summary)
  }
})

const patchSchema = z.object({
  skipStep: z.string().max(30).optional(),
  unskipStep: z.string().max(30).optional(),
  dismissBanner: z.boolean().optional()
})

export const PATCH = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const body = patchSchema.parse(await req.json())

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: user.orgId },
      select: { settings: true }
    })
    const settings = (org.settings as Record<string, unknown>) || {}
    const setup: SetupState = (settings.setup as SetupState) || {}
    const skipped = new Set(setup.skippedSteps ?? [])

    if (body.skipStep) skipped.add(body.skipStep)
    if (body.unskipStep) skipped.delete(body.unskipStep)
    if (body.dismissBanner !== undefined) setup.bannerDismissed = body.dismissBanner

    setup.skippedSteps = [...skipped]

    await prisma.organization.update({
      where: { id: user.orgId },
      data: { settings: { ...settings, setup } as object }
    })

    const summary = await evaluateSetupSteps(user.orgId)
    return ok(summary)
  }
})
