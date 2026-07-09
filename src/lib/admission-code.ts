import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

/**
 * Next sequential admission code for an org, e.g. AT-2026-00042.
 *
 * Derived from the numeric max of existing codes for the given prefix — NOT
 * from count()+1. Soft-deleted/archived admissions keep their code under the
 * [orgId, admissionCode] unique constraint, so count()+1 undercounts and
 * collides. `offset` supports retry loops on P2002 races.
 */
export async function nextAdmissionCode(orgId: string, prefix: string, offset = 0): Promise<string> {
  const rows = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(admission_code FROM ${prefix.length + 1}::int) AS INTEGER)) AS max
    FROM crm.admissions
    WHERE org_id = ${orgId}
      AND admission_code ~ ${'^' + prefix + '[0-9]+$'}
  `
  const lastNum = Number(rows[0]?.max ?? 0)
  return prefix + String(lastNum + 1 + offset).padStart(5, '0')
}

/**
 * Run an admission create with a fresh code, retrying twice on a
 * [orgId, admissionCode] P2002 race.
 */
export async function createAdmissionWithUniqueCode<T>(
  orgId: string,
  prefix: string,
  create: (admissionCode: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const admissionCode = await nextAdmissionCode(orgId, prefix, attempt)
    try {
      return await create(admissionCode)
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
      if (!isCodeCollision || attempt >= 2) throw err
    }
  }
}
