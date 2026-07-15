import crashlytics from '@react-native-firebase/crashlytics'

/**
 * Crash/error reporting via Firebase Crashlytics. Native crashes are
 * captured automatically once the config plugin is built in — this module
 * only needs to wire up JS-level errors and user context.
 *
 * Every call here is fire-and-forget and must never throw: a reporting
 * failure must never crash the thing it's trying to report on.
 */

let initialized = false

/** Installs the global JS error handler. Call once, at app startup. */
export function initCrashReporting(): void {
  if (initialized) return
  initialized = true

  try {
    void crashlytics().setCrashlyticsCollectionEnabled(true)
  } catch {
    // Crashlytics unavailable (e.g. Expo Go, no native module) — no-op.
  }

  const g: any = global as any
  const previousHandler = g.ErrorUtils?.getGlobalHandler?.()
  g.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    recordError(error, isFatal ? 'fatal-js-error' : 'js-error')
    previousHandler?.(error, isFatal)
  })
}

/** Record a non-fatal error with context. Never throws. */
export function recordError(error: unknown, context?: string): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error))
    if (context) void crashlytics().log(context)
    void crashlytics().recordError(err)
  } catch {
    // Swallow — reporting must never fail the caller.
  }
}

/** Associate crash reports with the signed-in user (id only, no PII). */
export function setCrashUser(userId: string | null): void {
  try {
    void crashlytics().setUserId(userId ?? '')
  } catch {
    // no-op
  }
}
