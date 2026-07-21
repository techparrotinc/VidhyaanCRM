/**
 * Activity-log retention policy. Stored per-org at
 * `organization.settings.activityLog.retentionDays`.
 *
 *  - A positive integer = auto-delete audit rows older than that many days.
 *  - 0 (or null/unset) = keep forever (no pruning).
 *
 * The nightly `/api/cron/audit-prune` job enforces this.
 */
export const DEFAULT_RETENTION_DAYS = 365
export const MIN_RETENTION_DAYS = 30
export const MAX_RETENTION_DAYS = 3650 // 10 years

/** Preset choices surfaced in the settings UI. 0 = keep forever. */
export const RETENTION_PRESETS = [30, 60, 90, 180, 365, 730, 0] as const

/** Read the effective retention (days) from an org settings JSON blob. */
export function resolveRetentionDays(settings: unknown): number {
  const s = settings as { activityLog?: { retentionDays?: unknown } } | null | undefined
  const raw = s?.activityLog?.retentionDays
  if (raw === 0) return 0
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.min(MAX_RETENTION_DAYS, Math.max(MIN_RETENTION_DAYS, Math.trunc(raw)))
  }
  return DEFAULT_RETENTION_DAYS
}

/** Validate + normalise an incoming retention value (0 = forever). */
export function normaliseRetentionDays(input: number): number {
  if (input === 0) return 0
  if (!Number.isFinite(input)) return DEFAULT_RETENTION_DAYS
  return Math.min(MAX_RETENTION_DAYS, Math.max(MIN_RETENTION_DAYS, Math.trunc(input)))
}
