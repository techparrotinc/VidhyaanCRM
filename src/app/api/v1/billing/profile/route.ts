import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const profileSchema = z.object({
  gstin: z.string().trim().toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][A-Z][0-9A-Z]$/, 'Invalid GSTIN format')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('').transform(() => undefined))
})

/** Billing profile (Bill-To address + GSTIN) — printed on GST invoices. */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'ORG_ADMIN' || !session.user.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = profileSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    const { gstin, addressLine, city, state, pincode } = parsed.data

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: session.user.orgId },
      select: { settings: true }
    })
    const settings = (org.settings as any) || {}
    const billingAddress = {
      ...(settings.billingAddress || {}),
      ...(addressLine !== undefined ? { addressLine } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(state !== undefined ? { state } : {}),
      ...(pincode !== undefined ? { pincode } : {})
    }

    await prisma.organization.update({
      where: { id: session.user.orgId },
      data: {
        ...(gstin !== undefined ? { gstNumber: gstin } : {}),
        settings: { ...settings, billingAddress }
      }
    })

    return NextResponse.json({ success: true, billingAddress, gstin: gstin ?? undefined })
  } catch (error: any) {
    console.error('Billing profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
