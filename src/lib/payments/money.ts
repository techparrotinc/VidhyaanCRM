import { Prisma } from '@prisma/client'

/**
 * Rupee (Decimal, as stored in crm/billing tables) ⇄ paise (integer, as sent
 * to gateways). The only place this conversion is allowed to happen.
 */

export class InvalidAmountError extends Error {}

/** Decimal rupees → integer paise. Rejects amounts finer than 1 paisa. */
export function toMinor(amount: Prisma.Decimal | number | string): number {
  const dec = new Prisma.Decimal(amount)
  if (!dec.isFinite()) {
    throw new InvalidAmountError('Amount is not a finite number')
  }
  if (dec.lte(0)) {
    throw new InvalidAmountError('Amount must be positive')
  }
  const minor = dec.mul(100)
  if (!minor.isInteger()) {
    throw new InvalidAmountError(`Amount ${dec.toString()} is not a whole paise value`)
  }
  const n = minor.toNumber()
  if (!Number.isSafeInteger(n)) {
    throw new InvalidAmountError('Amount exceeds safe integer range in paise')
  }
  return n
}

/** Integer paise → Decimal rupees. */
export function fromMinor(amountMinor: number): Prisma.Decimal {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new InvalidAmountError('Minor amount must be a non-negative integer')
  }
  return new Prisma.Decimal(amountMinor).div(100)
}
