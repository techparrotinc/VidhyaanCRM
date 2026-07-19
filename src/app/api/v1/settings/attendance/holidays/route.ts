import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { parseQuery } from '@/lib/api/query'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { DATE_RE, toDbDate, dbDateToString } from '@/lib/attendance/dates'
import {
  resolveHolidaySettings,
  setNationalHolidaysEnabled
} from '@/lib/holidays/national'

const ADMIN_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user }) => {
    const q = parseQuery(req.url, {
      from: z.string().regex(DATE_RE).optional(),
      to: z.string().regex(DATE_RE).optional()
    })
    const [holidays, org] = await Promise.all([
      db.holiday.findMany({
        where:
          q.from && q.to
            ? { date: { gte: toDbDate(q.from), lte: toDbDate(q.to) } }
            : undefined,
        orderBy: { date: 'asc' },
        take: 500
      }),
      db.organization.findUnique({
        where: { id: user.orgId },
        select: { settings: true, institutionType: true }
      })
    ])
    const hs = org ? resolveHolidaySettings(org.settings, org.institutionType) : null
    return ok({
      holidays: holidays.map(h => ({ ...h, date: dbDateToString(h.date) })),
      nationalEnabled: hs?.nationalEnabled ?? false,
      greetingEnabled: hs?.greetingEnabled ?? true,
      greetingLeadDays: hs?.greetingLeadDays ?? 7
    })
  }
})

// Holiday preferences. nationalEnabled ON seeds current + next year, OFF
// removes future seeded rows (past NATIONAL rows stay — attendance history
// depends on them). greetingEnabled/greetingLeadDays drive the dashboard
// announcement banner.
const patchSchema = z
  .object({
    nationalEnabled: z.boolean().optional(),
    greetingEnabled: z.boolean().optional(),
    greetingLeadDays: z.number().int().min(1).max(60).optional()
  })
  .refine(v => Object.values(v).some(x => x !== undefined), {
    message: 'Nothing to update'
  })

export const PATCH = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = patchSchema.parse(await req.json())
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true, institutionType: true }
    })
    if (!org) throw Errors.notFound('Organization')

    // Merge greeting fields into settings first, so a combined request
    // survives the settings write done inside setNationalHolidaysEnabled.
    let settings = (org.settings as any) || {}
    const greetingPatch: Record<string, unknown> = {}
    if (body.greetingEnabled !== undefined) greetingPatch.greetingEnabled = body.greetingEnabled
    if (body.greetingLeadDays !== undefined) greetingPatch.greetingLeadDays = body.greetingLeadDays
    if (Object.keys(greetingPatch).length > 0) {
      settings = { ...settings, holidays: { ...(settings.holidays ?? {}), ...greetingPatch } }
    }

    if (body.nationalEnabled !== undefined) {
      await setNationalHolidaysEnabled(
        db,
        user.orgId,
        settings,
        org.institutionType,
        body.nationalEnabled
      )
    } else if (Object.keys(greetingPatch).length > 0) {
      await db.organization.update({
        where: { id: user.orgId },
        data: { settings }
      })
    }

    const resolved = resolveHolidaySettings(settings, org.institutionType)
    return ok({
      ...resolved,
      nationalEnabled: body.nationalEnabled ?? resolved.nationalEnabled
    })
  }
})

const postSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    message: z.string().trim().max(200).optional(),
    date: z.string().regex(DATE_RE).optional(),
    range: z
      .object({ from: z.string().regex(DATE_RE), to: z.string().regex(DATE_RE) })
      .optional()
  })
  .refine(v => !!v.date !== !!v.range, { message: 'Provide date or range' })

export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: ADMIN_ROLES,
  handler: async ({ req, db, user, academicYearId }) => {
    const body = postSchema.parse(await req.json())

    const dates: string[] = []
    if (body.date) {
      dates.push(body.date)
    } else if (body.range) {
      const from = toDbDate(body.range.from)
      const to = toDbDate(body.range.to)
      if (to < from) throw Errors.validation({ range: ['"to" is before "from"'] })
      const dayMs = 24 * 60 * 60 * 1000
      if ((to.getTime() - from.getTime()) / dayMs > 92) {
        throw Errors.validation({ range: ['Range too long (max ~3 months)'] })
      }
      for (let t = from.getTime(); t <= to.getTime(); t += dayMs) {
        dates.push(dbDateToString(new Date(t)))
      }
    }

    const result = await db.holiday.createMany({
      data: dates.map(d => ({
        orgId: user.orgId,
        date: toDbDate(d),
        name: body.name,
        message: body.message || null,
        academicYearId
      })),
      skipDuplicates: true
    })
    return created({ created: result.count })
  }
})
