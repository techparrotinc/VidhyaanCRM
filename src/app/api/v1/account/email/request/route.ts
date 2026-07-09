import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { otpSendLimiter } from '@/lib/ratelimit'

// Step 1 of an email change: send a 4-digit code to the NEW address to prove
// the user controls it. Nothing changes until the code is verified.
export const POST = route({
  handler: async ({ req, user }) => {
    const { newEmail } = z.object({ newEmail: z.string().email().max(200) }).parse(await req.json())
    const email = newEmail.trim().toLowerCase()

    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } })
    if (me?.email?.toLowerCase() === email) {
      throw Errors.businessRule('That is already your email address')
    }

    const taken = await prisma.user.findFirst({
      where: { email, id: { not: user.id }, deletedAt: null },
      select: { id: true },
    })
    if (taken) throw Errors.conflict('That email is already in use by another account')

    const rl = await otpSendLimiter(`account_email_${user.id}`)
    if (!rl.success) throw Errors.rateLimited()

    const code = await createOTP(email, 'EMAIL', 'VERIFY_EMAIL')
    await sendOTP(email, code, 'EMAIL', 'VERIFY_EMAIL')

    return ok({ sent: true })
  },
})
