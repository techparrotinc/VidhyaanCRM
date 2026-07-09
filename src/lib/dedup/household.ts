import { normPhone, normEmail, normName } from './config'

type DbClient = any

/**
 * Resolve (or create) the household for a guardian phone within an org.
 * Returns null when there's no usable phone — records without a phone simply
 * carry no household. Idempotent on the [orgId, phoneNormalized] unique key.
 */
export async function resolveHouseholdId(
  client: DbClient,
  args: { orgId: string; phone?: string | null; name?: string | null; email?: string | null }
): Promise<string | null> {
  const pn = normPhone(args.phone)
  if (!pn) return null

  const household = await client.household.upsert({
    where: { orgId_phoneNormalized: { orgId: args.orgId, phoneNormalized: pn } },
    create: {
      orgId: args.orgId,
      phoneNormalized: pn,
      primaryName: normName(args.name) ? args.name?.trim() : null,
      primaryEmail: normEmail(args.email),
    },
    update: {},
  })
  return household.id
}

/**
 * The dedup/identity columns to stamp on any new Lead/Admission/Student.
 * Keeps every create site consistent: normalized phone + resolved household.
 */
export async function dedupFields(
  client: DbClient,
  args: { orgId: string; phone?: string | null; name?: string | null; email?: string | null }
): Promise<{ phoneNormalized: string | null; householdId: string | null }> {
  const phoneNormalized = normPhone(args.phone)
  const householdId = await resolveHouseholdId(client, args)
  return { phoneNormalized, householdId }
}
