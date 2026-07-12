import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { resolveAttendanceSettings, DEFAULT_ATTENDANCE_SETTINGS } from '@/lib/attendance/settings'

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user }) => {
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true }
    })
    return ok({
      settings: resolveAttendanceSettings(org?.settings),
      defaults: DEFAULT_ATTENDANCE_SETTINGS
    })
  }
})

const putSchema = z.object({
  workingDays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  absenceAlerts: z.object({
    enabled: z.boolean(),
    portal: z.boolean(),
    whatsapp: z.boolean(),
    sms: z.boolean()
  }),
  autoMarkOnline: z.boolean()
})

export const PUT = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = putSchema.parse(await req.json())
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true }
    })
    const settings = (org?.settings as any) || {}
    await db.organization.update({
      where: { id: user.orgId },
      data: { settings: { ...settings, attendance: body } }
    })
    return ok({ settings: body })
  }
})
