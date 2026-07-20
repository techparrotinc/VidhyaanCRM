export type ScheduleSession = {
  id: string
  startsAt: string
  durationMin: number
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  meetingLink: string | null
  cancelReason: string | null
  rescheduledFromId: string | null
  attendanceSessionId: string | null
  course: { id: string; name: string } | null
  batch: { id: string; name: string; enrolledCount: number } | null
  student: { id: string; name: string | null } | null
  teacher: { id: string; name: string | null } | null
  markedCount: number | null
  canManage: boolean
}
