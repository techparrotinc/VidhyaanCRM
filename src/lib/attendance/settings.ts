// Org attendance config, stored under Organization.settings.attendance
// (same JSON-merge pattern as settings.dedup).

export type AttendanceSettings = {
  /** ISO weekday numbers that are working days: 1=Mon .. 7=Sun. */
  workingDays: number[]
  absenceAlerts: {
    enabled: boolean
    portal: boolean
    whatsapp: boolean
    sms: boolean
  }
  /** Provision: auto-mark PRESENT for ONLINE sessions (LMS webhook, future). */
  autoMarkOnline: boolean
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
  absenceAlerts: { enabled: false, portal: true, whatsapp: false, sms: false },
  autoMarkOnline: false
}

export function resolveAttendanceSettings(orgSettings: unknown): AttendanceSettings {
  const raw = (orgSettings as any)?.attendance ?? {}
  const d = DEFAULT_ATTENDANCE_SETTINGS
  const workingDays = Array.isArray(raw.workingDays)
    ? raw.workingDays.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 7)
    : d.workingDays
  return {
    workingDays: workingDays.length > 0 ? workingDays : d.workingDays,
    absenceAlerts: {
      enabled: raw.absenceAlerts?.enabled ?? d.absenceAlerts.enabled,
      portal: raw.absenceAlerts?.portal ?? d.absenceAlerts.portal,
      whatsapp: raw.absenceAlerts?.whatsapp ?? d.absenceAlerts.whatsapp,
      sms: raw.absenceAlerts?.sms ?? d.absenceAlerts.sms
    },
    autoMarkOnline: raw.autoMarkOnline ?? d.autoMarkOnline
  }
}
