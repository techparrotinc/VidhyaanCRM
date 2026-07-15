import { prisma } from '@/lib/db/client'

/**
 * Push notifications to the mobile app via Expo's push service — plain HTTPS,
 * no SDK dependency. Same contract as the WhatsApp emitters: ALWAYS
 * fire-and-forget from workflows; a push failure must never fail the caller.
 *
 * Usage: void sendPush([userId], { title, body, data: { url: '/fees/123' } })
 * The `data.url` is the in-app deep-link route the tap should open.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const CHUNK = 100 // Expo hard limit per request

export interface PushPayload {
  title: string
  body: string
  /** In-app route + optional extras; kept small (Expo caps message at 4 KiB). */
  data?: Record<string, string>
}

export async function sendPush(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return
  try {
    const devices = await prisma.mobileDevice.findMany({
      where: { userId: { in: userIds }, revokedAt: null, pushToken: { not: null } },
      select: { id: true, pushToken: true }
    })
    if (devices.length === 0) return

    const messages = devices.map((d) => ({
      to: d.pushToken as string,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default' as const,
      priority: 'high' as const
    }))

    const deadDeviceIds: string[] = []
    for (let i = 0; i < messages.length; i += CHUNK) {
      const chunk = messages.slice(i, i + CHUNK)
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chunk)
      })
      if (!res.ok) {
        console.error('Expo push send failed:', res.status, await res.text().catch(() => ''))
        continue
      }
      const json = (await res.json()) as { data?: Array<{ status: string; details?: { error?: string } }> }
      json.data?.forEach((ticket, idx) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          deadDeviceIds.push(devices[i + idx].id)
        }
      })
    }

    // Prune tokens Expo says are gone (app uninstalled / permission revoked).
    if (deadDeviceIds.length > 0) {
      await prisma.mobileDevice.updateMany({
        where: { id: { in: deadDeviceIds } },
        data: { pushToken: null }
      })
    }
  } catch (err) {
    console.error('sendPush error (swallowed):', err)
  }
}
