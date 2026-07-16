import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Screen, GradientHeader, Card, Chip, EmptyState } from '@/components/ui'
import { RegisterGrid } from '@/components/RegisterGrid'
import { ApiError } from '@/lib/api'
import { enqueueRegister, queuedCount, syncAttendanceQueue } from '@/lib/attendance-queue'
import {
  useInstitutionMode,
  useAttendanceOverview,
  useAttendanceSessions,
  useRegister,
  useSaveAttendance,
  type RegisterTarget,
  type AttendanceStatusValue
} from '@/lib/attendance'

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function todayStr(): string {
  return localDateStr(new Date())
}
function shiftedDateStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

export default function Attendance() {
  const mode = useInstitutionMode()
  const [date, setDate] = useState(todayStr())
  const [target, setTarget] = useState<RegisterTarget | null>(null)

  useEffect(() => setTarget(null), [date])

  const overview = useAttendanceOverview(date, mode === 'school' && !target)
  const sessions = useAttendanceSessions(date, mode === 'lc' && !target)
  const register = useRegister(target, date)
  const save = useSaveAttendance()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOffline, setSavedOffline] = useState(false)
  const [pending, setPending] = useState(0)

  const refreshPending = useCallback(() => {
    void queuedCount().then(setPending)
  }, [])

  useEffect(() => {
    refreshPending()
  }, [refreshPending])

  const syncNow = async () => {
    const { synced } = await syncAttendanceQueue()
    refreshPending()
    if (synced > 0) {
      overview.refetch()
      sessions.refetch()
    }
  }

  const submit = async (entries: Array<{ studentId: string; status: AttendanceStatusValue }>) => {
    setSaveError(null)
    setSavedOffline(false)
    const payload = {
      date,
      sessionId: target?.kind === 'session' ? target.sessionId : undefined,
      entries
    }
    try {
      await save.mutateAsync(payload)
      setTarget(null)
    } catch (e) {
      // A real rejection (validation/permission — 4xx) won't fix itself by
      // queuing; only connectivity failures and 5xx are worth retrying later.
      const permanent = e instanceof ApiError && e.status < 500
      if (permanent) {
        setSaveError(e.message)
        return
      }
      await enqueueRegister(payload)
      refreshPending()
      setSavedOffline(true)
      setTarget(null)
    }
  }

  return (
    <Screen
      header={
        <GradientHeader
          title={target ? target.label : 'Attendance'}
          subtitle={date === todayStr() ? 'Today' : date}
          accent="attend"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {pending > 0 ? (
          <Pressable onPress={syncNow} className="active:opacity-70">
            <Card className="mb-3 flex-row items-center justify-between border-warn/40 bg-warn-bg">
              <Text className="text-xs font-semibold text-warn">
                {pending} register{pending === 1 ? '' : 's'} saved offline — tap to sync
              </Text>
            </Card>
          </Pressable>
        ) : null}
        {savedOffline ? (
          <Card className="mb-3 border-attend/30 bg-attend-soft">
            <Text className="text-xs font-semibold text-attend">
              No connection — saved on this device. Will sync automatically when you're back online.
            </Text>
          </Card>
        ) : null}

        {target ? (
          <Pressable onPress={() => setTarget(null)}>
            <Text className="text-sm font-semibold text-brand">← Back</Text>
          </Pressable>
        ) : (
          <View className="flex-row gap-2">
            {(['yesterday', 'today', 'tomorrow'] as const).map((k) => {
              const value = k === 'yesterday' ? shiftedDateStr(-1) : k === 'today' ? todayStr() : shiftedDateStr(1)
              const active = date === value
              return (
                <Pressable
                  key={k}
                  onPress={() => setDate(value)}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-attend' : 'border border-line'}`}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-secondary'}`}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {mode === null ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : target ? (
          register.isLoading ? (
            <View className="mt-8 items-center">
              <ActivityIndicator color="#0D9488" />
            </View>
          ) : register.isError ? (
            <Card className="mt-4">
              <Text className="text-sm text-bad">Couldn't load the register.</Text>
            </Card>
          ) : register.data ? (
            register.data.holiday ? (
              <Card className="mt-4">
                <Text className="text-sm font-medium text-ink-secondary">
                  {register.data.holiday.name} — holiday, attendance isn't marked.
                </Text>
              </Card>
            ) : (
              <View className="mt-3">
                {saveError ? <Text className="mb-2 text-xs text-bad">{saveError}</Text> : null}
                <RegisterGrid
                  key={`${target.kind === 'class' ? `${target.gradeLabel}|${target.section}` : target.sessionId}|${date}`}
                  roster={register.data.roster}
                  marks={register.data.marks}
                  saving={save.isPending}
                  onSave={submit}
                />
              </View>
            )
          ) : null
        ) : mode === 'school' ? (
          overview.isLoading ? (
            <View className="mt-8 items-center">
              <ActivityIndicator color="#0D9488" />
            </View>
          ) : overview.isError ? (
            <Card className="mt-4">
              <Text className="text-sm text-bad">Couldn't load classes. Pull to retry.</Text>
              <Pressable onPress={() => overview.refetch()} className="mt-2">
                <Text className="text-sm font-semibold text-brand">Retry</Text>
              </Pressable>
            </Card>
          ) : overview.data && overview.data.length > 0 ? (
            overview.data.map((c) => {
              const label = `${c.gradeLabel}${c.section ? ` - ${c.section}` : ''}`
              const done = c.marked >= c.students && c.students > 0
              return (
                <Pressable
                  key={label}
                  onPress={() => setTarget({ kind: 'class', gradeLabel: c.gradeLabel, section: c.section, label })}
                  className="active:opacity-70"
                >
                  <Card className="mt-3 flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm font-semibold text-ink">{label}</Text>
                      <Text className="text-xs text-ink-faint">{c.students} students</Text>
                    </View>
                    <Chip
                      label={done ? 'Marked' : c.marked > 0 ? `${c.marked}/${c.students}` : 'Pending'}
                      tone={done ? 'good' : c.marked > 0 ? 'warn' : 'neutral'}
                    />
                  </Card>
                </Pressable>
              )
            })
          ) : (
            <EmptyState icon="calendar-outline" title="No classes assigned" subtitle="Nothing assigned to you yet." />
          )
        ) : sessions.isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : sessions.isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load sessions. Pull to retry.</Text>
            <Pressable onPress={() => sessions.refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : sessions.data && sessions.data.length > 0 ? (
          sessions.data.map((s) => {
            const label = s.title || s.course?.name || s.batch?.name || 'Session'
            return (
              <Pressable
                key={s.id}
                onPress={() => setTarget({ kind: 'session', sessionId: s.id, label })}
                className="active:opacity-70"
              >
                <Card className="mt-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-ink">{label}</Text>
                    {s.startsAt ? (
                      <Text className="text-xs text-ink-faint">
                        {s.startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    ) : null}
                  </View>
                  <Chip
                    label={s._count.records > 0 ? `${s._count.records} marked` : 'Pending'}
                    tone={s._count.records > 0 ? 'good' : 'neutral'}
                  />
                </Card>
              </Pressable>
            )
          })
        ) : (
          <EmptyState icon="calendar-outline" title="No sessions for this day" />
        )}
      </ScrollView>
    </Screen>
  )
}
