import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { cleanPhoneNumber } from '@/lib/utils'

// Self-service account. Any authenticated user may read/update their OWN
// name + phone here — the Users admin screen deliberately blocks self-edits,
// so this is the sanctioned path. Email changes go through the OTP-verified
// flow in ./email (it's the login identity).
export const GET = route({
  handler: async ({ user }) => {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true },
    })
    if (!me) throw Errors.notFound('User')
    return ok(me)
  },
})

export const PATCH = route({
  handler: async ({ req, user }) => {
    const body = z.object({
      name: z.string().min(1).max(150).optional(),
      phone: z.preprocess(
        (v) => (v == null || v === '' ? v : cleanPhoneNumber(v)),
        z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().nullable(),
      ),
    }).parse(await req.json())

    // Phone is unique across users — block collisions.
    if (body.phone) {
      const clash = await prisma.user.findFirst({
        where: { phone: body.phone, id: { not: user.id }, deletedAt: null },
        select: { id: true },
      })
      if (clash) throw Errors.conflict('That phone number is already in use by another account')
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
      },
      select: { id: true, name: true, email: true, phone: true },
    })
    return ok(updated)
  },
})
