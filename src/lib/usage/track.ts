import { prisma } from '@/lib/db'

/**
 * Fire-and-forget feature-usage tracking.
 *
 * Writes one append-only row to platform.feature_usage_events. It is
 * intentionally NOT awaited by callers and never throws — analytics must never
 * slow down or break a real product request. Powers the per-org usage
 * dashboard in the admin portal.
 */
export function trackFeatureUsage(input: {
  orgId: string
  feature: string
  action: string
  userId?: string | null
  path?: string | null
}): void {
  if (!input.orgId || !input.feature) return
  prisma.featureUsageEvent
    .create({
      data: {
        orgId: input.orgId,
        userId: input.userId ?? null,
        feature: input.feature,
        action: input.action,
        path: input.path ?? null,
      },
    })
    .catch(() => {
      /* best-effort: swallow analytics write failures */
    })
}
