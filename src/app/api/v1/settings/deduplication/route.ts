import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import {
  RULE_META,
  DedupRuleKey,
  resolveDedupConfig,
  defaultDedupConfig,
} from '@/lib/dedup'

const RULE_KEYS = RULE_META.map(r => r.key) as [DedupRuleKey, ...DedupRuleKey[]]
const actionEnum = z.enum(['off', 'soft', 'hard'])

export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db, user }) => {
    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true, institutionType: true },
    })
    return ok({
      config: resolveDedupConfig(org?.settings, org?.institutionType),
      defaults: defaultDedupConfig(org?.institutionType),
      institutionType: org?.institutionType ?? null,
      rules: RULE_META,
    })
  },
})

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z
      .object({ rules: z.record(z.enum(RULE_KEYS), actionEnum) })
      .parse(await req.json())

    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true, institutionType: true },
    })
    const settings = (org?.settings as any) || {}
    const nextRules = { ...(settings.dedup?.rules || {}), ...body.rules }

    await db.organization.update({
      where: { id: user.orgId },
      data: { settings: { ...settings, dedup: { ...(settings.dedup || {}), rules: nextRules } } },
    })

    return ok({ config: resolveDedupConfig({ dedup: { rules: nextRules } }, org?.institutionType) })
  },
})
