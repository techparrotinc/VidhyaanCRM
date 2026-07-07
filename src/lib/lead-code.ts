import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

/**
 * Next sequential lead code for an org, e.g. LD-2026-00042.
 *
 * Derived from the highest existing code for the year — NOT from count().
 * Counts undercount whenever leads are soft-deleted (deleted rows keep
 * their code under the [orgId, leadCode] unique constraint), which made
 * count()+1 collide. Queries the base client so soft-deleted rows are
 * included. `offset` supports retry loops on P2002 races.
 */
export async function nextLeadCode(orgId: string, offset = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `LD-${year}-`

  // Numeric max over strictly-formatted codes only. Some orgs carry
  // non-standard codes (e.g. seed data's LD-2026-SEED-00007) that sort
  // above every numeric code as strings, so string orderBy desc +
  // parseInt is not safe here.
  const rows = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(lead_code FROM ${prefix.length + 1}::int) AS INTEGER)) AS max
    FROM crm.leads
    WHERE org_id = ${orgId}
      AND lead_code ~ ${'^' + prefix + '[0-9]+$'}
  `
  const lastNum = Number(rows[0]?.max ?? 0)
  return prefix + String(lastNum + 1 + offset).padStart(5, '0')
}

/**
 * Run a lead create with a fresh code, retrying twice on a
 * [orgId, leadCode] P2002 race. `create` receives the candidate code and
 * must perform the insert.
 */
export async function createLeadWithUniqueCode<T>(
  orgId: string,
  create: (leadCode: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const leadCode = await nextLeadCode(orgId, attempt)
    try {
      return await create(leadCode)
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
      if (!isCodeCollision || attempt >= 2) throw err
    }
  }
}
