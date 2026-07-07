import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { z } from 'zod'
import { getOrCreateWallet, getWalletSummary } from '@/lib/credits/engine'
import type { MessageChannel } from '@prisma/client'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }
    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const { id } = await context.params
    const wallets = await getWalletSummary(id)
    return ok({ wallets })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH — platform admins set an org's monthly free message allowance.
 * Schools see this value read-only; no org-side write endpoint exists.
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw Errors.unauthenticated()
    }
    const platformRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']
    if (!platformRoles.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const { id } = await context.params
    const body = z.object({
      channel: z.enum(['SMS', 'WHATSAPP']),
      freeAllowance: z.number().int().min(0).max(100000)
    }).parse(await req.json())

    const org = await prisma.organization.findUnique({ where: { id } })
    if (!org) {
      throw Errors.notFound('Organization')
    }

    const wallet = await getOrCreateWallet(id, body.channel as MessageChannel)
    const previous = wallet.freeAllowance

    const updated = await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeAllowance: body.freeAllowance }
    })

    await prisma.messageCreditLedger.create({
      data: {
        orgId: id,
        channel: body.channel as MessageChannel,
        delta: 0,
        reason: 'ADMIN_ADJUST',
        ref: session.user.id,
        freeBalanceAfter: Math.max(0, updated.freeAllowance - updated.freeUsed),
        purchasedBalanceAfter: updated.purchasedBalance,
        note: `Free allowance changed ${previous} → ${body.freeAllowance} by admin`
      }
    })

    await prisma.auditLog.create({
      data: {
        orgId: id,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'MessageWallet',
        entityId: updated.id,
        after: { channel: body.channel, freeAllowance: body.freeAllowance, previous }
      }
    })

    return ok({
      channel: body.channel,
      freeAllowance: updated.freeAllowance
    })
  } catch (error) {
    return errorResponse(error)
  }
}
