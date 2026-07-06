import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Sequence-safe receipt numbers (RCP-YYYY-XXXXX). The number is derived from
 * the current max for the org+year and creation retries on the
 * (orgId, receiptNumber) unique violation — safe under concurrent payments,
 * unlike the count()+1 pattern it replaces.
 */

export class ReceiptNumberError extends Error {}

const MAX_ATTEMPTS = 5

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function nextReceiptNumber(orgId: string, attempt = 0): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RCP-${year}-`
  const last = await prisma.payment.findFirst({
    where: { orgId, receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true }
  })
  const lastSeq = last ? Number(last.receiptNumber.slice(prefix.length)) : 0
  const seq = (Number.isFinite(lastSeq) ? lastSeq : 0) + attempt + 1
  return prefix + String(seq).padStart(5, '0')
}

/**
 * Runs `create` with a fresh candidate receipt number, retrying on unique
 * collision (two payments landing in the same instant).
 */
export async function withReceiptNumber<T>(
  orgId: string,
  create: (receiptNumber: string) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const receiptNumber = await nextReceiptNumber(orgId, attempt)
    try {
      return await create(receiptNumber)
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_ATTEMPTS - 1) continue
      throw error
    }
  }
  throw new ReceiptNumberError('Could not allocate a receipt number')
}
