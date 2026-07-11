import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'

// Org-wide OTP delivery channel for this org's user logins. Stored on
// organization.settings.otpChannel. WhatsApp delivery needs the platform
// otp_login AUTHENTICATION template approved; sends always fall back to SMS
// when WhatsApp fails, so a misconfigured template can never lock users out.

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user }) => {
    const org = await db.organization.findFirst({
      where: { id: user.orgId },
      select: { settings: true }
    })
    const pref = (org?.settings as any)?.otpChannel
    return ok({
      otpChannel: pref === 'WHATSAPP' || pref === 'BOTH' ? pref : 'SMS'
    })
  }
})

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z
      .object({ otpChannel: z.enum(['SMS', 'WHATSAPP', 'BOTH']) })
      .parse(await req.json())

    const org = await db.organization.findFirst({
      where: { id: user.orgId },
      select: { settings: true }
    })
    await db.organization.update({
      where: { id: user.orgId },
      data: {
        settings: { ...((org?.settings as object) ?? {}), otpChannel: body.otpChannel }
      }
    })
    return ok({ otpChannel: body.otpChannel })
  }
})
