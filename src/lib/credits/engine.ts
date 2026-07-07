// Credit wallet engine — all reads/writes to MessageWallet and the
// append-only MessageCreditLedger. Uses the raw prisma client (billing
// schema, orgId always explicit in queries).

import { prisma } from '@/lib/db/client'
import type { MessageChannel, MessageWallet } from '@prisma/client'
import { needsMonthlyReset, startOfUtcMonth, computeSpendSplit } from './pure'

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly channel: MessageChannel,
    public readonly shortfall: number,
    public readonly available: number
  ) {
    super(`Insufficient ${channel} credits: short by ${shortfall}`)
    this.name = 'InsufficientCreditsError'
  }
}

const MAX_RETRIES = 3

/**
 * Ensures a wallet row exists and its free period is current (lazy monthly
 * reset). Race-safe: the reset uses a conditional updateMany so only one
 * concurrent caller wins; everyone re-reads after.
 */
export async function getOrCreateWallet(
  orgId: string,
  channel: MessageChannel
): Promise<MessageWallet> {
  let wallet = await prisma.messageWallet.findUnique({
    where: { orgId_channel: { orgId, channel } }
  })

  if (!wallet) {
    wallet = await prisma.messageWallet
      .create({ data: { orgId, channel, periodStart: startOfUtcMonth(new Date()) } })
      .catch(async err => {
        // Unique race: another request created it first
        const existing = await prisma.messageWallet.findUnique({
          where: { orgId_channel: { orgId, channel } }
        })
        if (existing) return existing
        throw err
      })
  }

  const now = new Date()
  if (needsMonthlyReset(wallet.periodStart, now)) {
    const reset = await prisma.messageWallet.updateMany({
      where: { id: wallet.id, periodStart: wallet.periodStart },
      data: { freeUsed: 0, periodStart: startOfUtcMonth(now) }
    })
    if (reset.count > 0) {
      await prisma.messageCreditLedger.create({
        data: {
          orgId,
          channel,
          delta: wallet.freeAllowance,
          reason: 'FREE_GRANT',
          freeBalanceAfter: wallet.freeAllowance,
          purchasedBalanceAfter: wallet.purchasedBalance,
          note: 'Monthly free credit reset'
        }
      })
    }
    wallet = (await prisma.messageWallet.findUnique({
      where: { id: wallet.id }
    }))!
  }

  return wallet
}

/**
 * Debits qty credits, free-first. Throws InsufficientCreditsError when the
 * balance can't cover qty (send must be blocked). Atomicity via optimistic
 * conditional update + bounded retry; the ledger row records the
 * free/purchased split so refunds can restore accurately.
 */
export async function spendCredits(
  orgId: string,
  channel: MessageChannel,
  qty: number,
  ref?: string
): Promise<{ fromFree: number; fromPurchased: number }> {
  if (qty <= 0) return { fromFree: 0, fromPurchased: 0 }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const wallet = await getOrCreateWallet(orgId, channel)
    const freeRemaining = wallet.freeAllowance - wallet.freeUsed
    const split = computeSpendSplit(freeRemaining, wallet.purchasedBalance, qty)

    if (!split.ok) {
      throw new InsufficientCreditsError(
        channel,
        split.shortfall,
        Math.max(0, freeRemaining) + wallet.purchasedBalance
      )
    }

    const updated = await prisma.messageWallet.updateMany({
      where: {
        id: wallet.id,
        freeUsed: wallet.freeUsed,
        purchasedBalance: wallet.purchasedBalance
      },
      data: {
        freeUsed: wallet.freeUsed + split.fromFree,
        purchasedBalance: wallet.purchasedBalance - split.fromPurchased
      }
    })
    if (updated.count === 0) continue // concurrent write — retry

    await prisma.messageCreditLedger.create({
      data: {
        orgId,
        channel,
        delta: -qty,
        reason: 'SEND',
        ref,
        freeBalanceAfter: freeRemaining - split.fromFree,
        purchasedBalanceAfter: wallet.purchasedBalance - split.fromPurchased,
        note: JSON.stringify({ fromFree: split.fromFree, fromPurchased: split.fromPurchased })
      }
    })
    return { fromFree: split.fromFree, fromPurchased: split.fromPurchased }
  }

  throw new Error(`Credit wallet contention for org ${orgId} ${channel} — retries exhausted`)
}

/**
 * Credits back failed sends from a pre-debited batch. `split` is what the
 * matching spendCredits returned; refunds proportionally: purchased first
 * up to what was taken from purchased, remainder back to free.
 */
export async function refundCredits(
  orgId: string,
  channel: MessageChannel,
  qty: number,
  split: { fromFree: number; fromPurchased: number },
  ref?: string
): Promise<void> {
  if (qty <= 0) return
  const toPurchased = Math.min(qty, split.fromPurchased)
  const toFree = Math.min(qty - toPurchased, split.fromFree)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const wallet = await getOrCreateWallet(orgId, channel)
    const updated = await prisma.messageWallet.updateMany({
      where: {
        id: wallet.id,
        freeUsed: wallet.freeUsed,
        purchasedBalance: wallet.purchasedBalance
      },
      data: {
        freeUsed: Math.max(0, wallet.freeUsed - toFree),
        purchasedBalance: wallet.purchasedBalance + toPurchased
      }
    })
    if (updated.count === 0) continue

    await prisma.messageCreditLedger.create({
      data: {
        orgId,
        channel,
        delta: toFree + toPurchased,
        reason: 'SEND_REFUND',
        ref,
        freeBalanceAfter:
          wallet.freeAllowance - Math.max(0, wallet.freeUsed - toFree),
        purchasedBalanceAfter: wallet.purchasedBalance + toPurchased,
        note: `Refund for ${qty} failed sends`
      }
    })
    return
  }

  console.error(`Credit refund contention for org ${orgId} ${channel} — retries exhausted`)
}

/**
 * Grants purchased credits for a paid transaction. Idempotent on
 * transactionId — a PURCHASE ledger row with the same ref is a no-op
 * (protects against verify + webhook double-processing).
 */
export async function grantPurchasedCredits(
  orgId: string,
  channel: MessageChannel,
  credits: number,
  transactionId: string
): Promise<void> {
  const existing = await prisma.messageCreditLedger.findFirst({
    where: { ref: transactionId, reason: 'PURCHASE' }
  })
  if (existing) return

  const wallet = await getOrCreateWallet(orgId, channel)
  const updated = await prisma.messageWallet.update({
    where: { id: wallet.id },
    data: { purchasedBalance: { increment: credits } }
  })

  await prisma.messageCreditLedger.create({
    data: {
      orgId,
      channel,
      delta: credits,
      reason: 'PURCHASE',
      ref: transactionId,
      freeBalanceAfter: updated.freeAllowance - updated.freeUsed,
      purchasedBalanceAfter: updated.purchasedBalance,
      note: `Purchased ${credits} credits`
    }
  })
}

export interface WalletSummary {
  channel: MessageChannel
  freeAllowance: number
  freeUsed: number
  freeRemaining: number
  purchasedBalance: number
  totalAvailable: number
  periodStart: Date
}

export async function getWalletSummary(orgId: string): Promise<WalletSummary[]> {
  const channels: MessageChannel[] = ['SMS', 'WHATSAPP']
  return Promise.all(
    channels.map(async channel => {
      const w = await getOrCreateWallet(orgId, channel)
      const freeRemaining = Math.max(0, w.freeAllowance - w.freeUsed)
      return {
        channel,
        freeAllowance: w.freeAllowance,
        freeUsed: w.freeUsed,
        freeRemaining,
        purchasedBalance: w.purchasedBalance,
        totalAvailable: freeRemaining + w.purchasedBalance,
        periodStart: w.periodStart
      }
    })
  )
}
