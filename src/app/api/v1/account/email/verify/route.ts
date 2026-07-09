import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'

// Step 2: verify the code sent to the new address, then switch the login
// email. Uniqueness is re-checked to close the request→verify race.
export const POST = route({
  handler: async ({ req, user }) => {
    const { newEmail, code } = z.object({
      newEmail: z.string().email().max(200),
      code: z.string().min(4).max(8),
    }).parse(await req.json())
    const email = newEmail.trim().toLowerCase()

    const otp = await prisma.otpCode.findFirst({
      where: { identifier: email, purpose: 'VERIFY_EMAIL', consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!otp) throw Errors.businessRule('Code expired or not found. Request a new one.')

    const attempts = otp.attempts + 1
    if (attempts > 5) {
      await prisma.otpCode.delete({ where: { id: otp.id } })
      throw Errors.businessRule('Too many attempts. Request a new code.')
    }
    const valid = await bcrypt.compare(code, otp.codeHash)
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts } })
      throw Errors.businessRule(`Incorrect code. ${5 - attempts} attempts left.`)
    }

    // Re-check uniqueness at commit time.
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: user.id }, deletedAt: null },
      select: { id: true },
    })
    if (taken) throw Errors.conflict('That email was just taken by another account')

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email },
      select: { id: true, name: true, email: true, phone: true },
    })
    return ok(updated)
  },
})
