import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'

export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user }) => {
    const prefs = await db.notificationPreference.findMany({
      where: { userId: user.id }
    })

    // Map database properties to frontend shape
    const formatted = prefs.map(pref => ({
      eventType: pref.category,
      emailEnabled: pref.email,
      whatsappEnabled: pref.whatsapp,
      smsEnabled: pref.sms,
      inAppEnabled: pref.inApp
    }))

    return ok(formatted)
  }
})

export const PUT = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR
  ],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      preferences: z.array(z.object({
        eventType: z.string(),
        emailEnabled: z.boolean(),
        whatsappEnabled: z.boolean(),
        smsEnabled: z.boolean(),
        inAppEnabled: z.boolean()
      }))
    }).parse(await req.json())

    await Promise.all(
      body.preferences.map(pref =>
        db.notificationPreference.upsert({
          where: {
            userId_category: {
              userId: user.id,
              category: pref.eventType
            }
          },
          create: {
            orgId: user.orgId,
            userId: user.id,
            category: pref.eventType,
            email: pref.emailEnabled,
            whatsapp: pref.whatsappEnabled,
            sms: pref.smsEnabled,
            inApp: pref.inAppEnabled
          },
          update: {
            email: pref.emailEnabled,
            whatsapp: pref.whatsappEnabled,
            sms: pref.smsEnabled,
            inApp: pref.inAppEnabled
          }
        })
      )
    )

    return ok({
      updated: body.preferences.length,
      message: 'Preferences saved'
    })
  }
})
