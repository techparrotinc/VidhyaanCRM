import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Card, Button } from '@/components/ui'
import type { RosterStudent, ExistingMark, AttendanceStatusValue } from '@/lib/attendance'

const TOGGLE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'] as const satisfies readonly AttendanceStatusValue[]

const STATUS_META: Record<(typeof TOGGLE_STATUSES)[number], { label: string; on: string; off: string }> = {
  PRESENT: { label: 'P', on: 'bg-good text-white', off: 'border border-line text-ink-faint' },
  ABSENT: { label: 'A', on: 'bg-bad text-white', off: 'border border-line text-ink-faint' },
  HALF_DAY: { label: 'H', on: 'bg-warn text-white', off: 'border border-line text-ink-faint' },
  LEAVE: { label: 'L', on: 'bg-ink-faint text-white', off: 'border border-line text-ink-faint' }
}

export function RegisterGrid({
  roster,
  marks,
  disabled,
  onSave,
  saving
}: {
  roster: RosterStudent[]
  marks: ExistingMark[]
  disabled?: boolean
  onSave: (entries: Array<{ studentId: string; status: AttendanceStatusValue }>) => void
  saving?: boolean
}) {
  // Caller remounts this component (via a `key` on target+date) whenever the
  // register changes, so lazy-init here is correct without an effect sync.
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatusValue>>(() => {
    const byStudent = new Map(marks.map((m) => [m.studentId, m.status]))
    const init: Record<string, AttendanceStatusValue> = {}
    roster.forEach((s) => {
      init[s.id] = byStudent.get(s.id) ?? 'PRESENT'
    })
    return init
  })

  const markedCount = Object.values(statuses).filter((s) => s !== undefined).length
  const presentCount = Object.values(statuses).filter((s) => s === 'PRESENT' || s === 'HALF_DAY').length

  return (
    <View>
      <Card className="flex-row items-center justify-between">
        <Text className="text-xs text-ink-secondary">
          {presentCount}/{roster.length} present
        </Text>
        <Pressable
          disabled={disabled}
          onPress={() => setStatuses(Object.fromEntries(roster.map((s) => [s.id, 'PRESENT' as const])))}
        >
          <Text className="text-xs font-semibold text-brand">Mark all present</Text>
        </Pressable>
      </Card>

      {roster.map((student) => (
        <Card key={student.id} className="mt-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{student.name}</Text>
              <Text className="text-xs text-ink-faint">
                {student.rollNumber ? `Roll ${student.rollNumber}` : student.studentCode}
              </Text>
            </View>
            <View className="flex-row gap-1.5">
              {TOGGLE_STATUSES.map((status) => {
                const meta = STATUS_META[status]
                const on = statuses[student.id] === status
                return (
                  <Pressable
                    key={status}
                    disabled={disabled}
                    onPress={() => setStatuses((prev) => ({ ...prev, [student.id]: status }))}
                    className={`h-8 w-8 items-center justify-center rounded-lg ${on ? meta.on : meta.off}`}
                  >
                    <Text className={`text-xs font-bold ${on ? 'text-white' : 'text-ink-faint'}`}>{meta.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </Card>
      ))}

      <View className="mt-4">
        <Button
          label={saving ? 'Saving…' : `Submit (${markedCount}/${roster.length})`}
          disabled={disabled}
          loading={saving}
          onPress={() => onSave(roster.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? 'PRESENT' })))}
        />
      </View>
    </View>
  )
}
