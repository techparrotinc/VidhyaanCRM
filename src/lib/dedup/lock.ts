import { normPhone } from './config'

/**
 * Serializes the "check dedup, then create" critical section for a given
 * org+phone so two near-simultaneous requests can't both pass a hard-match
 * block before either commits (findMatches has no DB-level constraint behind
 * it — this is the only thing standing between two concurrent duplicates and
 * a permanently split household). Must be called from inside the same
 * `client.$transaction(async (tx) => ...)` whose `tx` performs the dedup
 * check AND the eventual create — a Postgres advisory xact lock only
 * serializes callers sharing the same underlying connection, which
 * `$transaction` guarantees for its callback and nothing else does.
 *
 * No-op when there's no phone to key on: every hard-block rule
 * (exactApplication, sameChildSameYear) requires a phone match, so an
 * email-only or name-only collision was never hard-blockable in the first
 * place — nothing to protect there.
 */
export async function lockDedupPhone(
  tx: { $executeRaw: (query: any, ...values: any[]) => Promise<any> },
  orgId: string,
  phone: string | null | undefined
): Promise<void> {
  const pn = normPhone(phone)
  if (!pn) return
  const key = `${orgId}:${pn}`
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`
}
