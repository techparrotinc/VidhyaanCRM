/**
 * Maps a notification's `data` payload to a mobile route. Two shapes feed
 * this: the DB-stored Notification row (web `href`, e.g. `/parent/fees/123`
 * — src/lib/attendance/alerts.ts, parent-schedule.ts) and direct Expo push
 * payloads (mobile-native `url`, e.g. `/(parent)/attendance` — emitters.ts).
 * Used by both the in-app notifications feed and the push-tap handler so
 * they can't drift from each other.
 */
export function resolveNotificationRoute(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null

  const url = typeof data.url === 'string' ? data.url : null
  if (url) return url // already mobile-route-shaped at the source

  const href = typeof data.href === 'string' ? data.href : null
  if (href) {
    const path = href.replace(/^\/parent/, '') || '/'
    const feeMatch = path.match(/^\/fees\/([^/?#]+)/)
    if (feeMatch) return `/(parent)/fees/${feeMatch[1]}`
    const eventMatch = path.match(/^\/events\/([^/?#]+)/)
    if (eventMatch) return `/(parent)/events/${eventMatch[1]}`
    if (path.startsWith('/fees')) return '/(parent)/fees'
    if (path.startsWith('/events')) return '/(parent)/events'
    // No dedicated timetable tab on mobile — attendance is the closest
    // existing screen for a schedule-shaped notification.
    if (path.startsWith('/attendance') || path.startsWith('/timetable')) return '/(parent)/attendance'
  }

  if (typeof data.invoiceId === 'string') return `/(parent)/fees/${data.invoiceId}`
  return null
}
