import { useMemo, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen, DetailHeader, Card, Button, Chip, FormScrollView } from '@/components/ui'
import {
  scheduleSessionSchema,
  useCancelSession,
  useRemindSession,
  useRescheduleSession,
  type ScheduleSession
} from '@/lib/schedule'

/** Session detail + actions (wireframe s-session): remind / reschedule /
 *  cancel (admin), mark attendance. Session arrives serialized via params —
 *  the list endpoint is the source of truth, there's no per-session GET. */

const DURATIONS = [30, 45, 60, 90]

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function RescheduleForm({ s, onDone }: { s: ScheduleSession; onDone: () => void }) {
  const [dayOffset, setDayOffset] = useState(1)
  const [hour, setHour] = useState(s.startsAt.getHours())
  const [duration, setDuration] = useState(s.durationMin)
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reschedule = useRescheduleSession()

  const newDate = useMemo(() => {
    const d = new Date(s.startsAt.getTime() + dayOffset * 86_400_000)
    d.setHours(hour, s.startsAt.getMinutes(), 0, 0)
    return d
  }, [s.startsAt, dayOffset, hour])

  const submit = async () => {
    setError(null)
    try {
      await reschedule.mutateAsync({
        id: s.id,
        startsAt: newDate.toISOString(),
        durationMin: duration,
        notifyGuardians: notify
      })
      onDone()
      router.back()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule')
    }
  }

  return (
    <Card className="mt-3 gap-3 border-attend">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Reschedule</Text>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-xs text-ink-faint">Day:</Text>
        {[0, 1, 2, 3, 7].map((d) => (
          <Pressable key={d} onPress={() => setDayOffset(d)} className={`rounded-full px-2.5 py-1 ${dayOffset === d ? 'bg-attend' : 'border border-line'}`}>
            <Text className={`text-[11px] font-semibold ${dayOffset === d ? 'text-white' : 'text-ink-secondary'}`}>
              {d === 0 ? 'Same' : `+${d}d`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Text className="text-xs text-ink-faint">Time:</Text>
        {[8, 10, 12, 15, 16, 17, 18, 19].map((h) => (
          <Pressable key={h} onPress={() => setHour(h)} className={`rounded-full px-2.5 py-1 ${hour === h ? 'bg-attend' : 'border border-line'}`}>
            <Text className={`text-[11px] font-semibold ${hour === h ? 'text-white' : 'text-ink-secondary'}`}>
              {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-xs text-ink-faint">Length:</Text>
        {DURATIONS.map((m) => (
          <Pressable key={m} onPress={() => setDuration(m)} className={`rounded-full px-2.5 py-1 ${duration === m ? 'bg-attend' : 'border border-line'}`}>
            <Text className={`text-[11px] font-semibold ${duration === m ? 'text-white' : 'text-ink-secondary'}`}>
              {m % 60 === 0 ? `${m / 60} hr` : `${m}m`}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setNotify((v) => !v)} className="flex-row items-center justify-between active:opacity-70">
        <Text className="text-sm text-ink-secondary">Notify guardians on WhatsApp</Text>
        <Chip label={notify ? 'On' : 'Off'} tone={notify ? 'good' : 'neutral'} selected={notify} />
      </Pressable>
      <Text className="text-xs text-ink-faint">
        New: {newDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtTime(newDate)}
      </Text>
      {error ? <Text className="text-xs text-bad">{error}</Text> : null}
      <Button label="Confirm reschedule" onPress={submit} loading={reschedule.isPending} />
    </Card>
  )
}

export default function SessionDetail() {
  const { session: sessionJson } = useLocalSearchParams<{ session: string }>()
  const s = useMemo(() => {
    try {
      const raw = JSON.parse(sessionJson ?? '{}')
      return scheduleSessionSchema.parse({ ...raw, startsAt: raw.startsAt }) as ScheduleSession
    } catch {
      return null
    }
  }, [sessionJson])

  const [showReschedule, setShowReschedule] = useState(false)
  const [remindState, setRemindState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const remind = useRemindSession()
  const cancel = useCancelSession()

  if (!s) {
    return (
      <Screen header={<DetailHeader title="Session" onBack={() => router.back()} accent="attend" />}>
        <Text className="mt-6 text-center text-sm text-bad">Could not load this session.</Text>
      </Screen>
    )
  }

  const sendReminder = async () => {
    setRemindState('sending')
    try {
      await remind.mutateAsync(s.id)
      setRemindState('sent')
    } catch {
      setRemindState('failed')
    }
  }

  const confirmCancel = () => {
    Alert.prompt?.(
      'Cancel class',
      'Reason (guardians are notified on WhatsApp):',
      async (reason) => {
        if (!reason?.trim()) return
        try {
          await cancel.mutateAsync({ id: s.id, reason: reason.trim() })
          router.back()
        } catch (e) {
          Alert.alert('Could not cancel', e instanceof Error ? e.message : 'Try again')
        }
      }
    ) ??
      // Android has no Alert.prompt — fall back to a fixed reason confirm.
      Alert.alert('Cancel class', 'Guardians will be notified on WhatsApp.', [
        { text: 'Keep class', style: 'cancel' },
        {
          text: 'Cancel class',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel.mutateAsync({ id: s.id, reason: 'Cancelled from mobile app' })
              router.back()
            } catch (e) {
              Alert.alert('Could not cancel', e instanceof Error ? e.message : 'Try again')
            }
          }
        }
      ])
  }

  const title = s.course?.name ?? s.batch?.name ?? 'Session'

  return (
    <Screen header={<DetailHeader title={title} onBack={() => router.back()} accent="attend" />}>
      <FormScrollView>
        <Card className="mt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-ink-secondary">
              {s.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
            <Chip label={`${fmtTime(s.startsAt)} · ${s.durationMin % 60 === 0 ? `${s.durationMin / 60} hr` : `${s.durationMin} min`}`} tone="neutral" />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm text-ink-secondary">{s.batch?.name ?? '—'}</Text>
            <Text className="text-sm font-semibold text-ink">{s.teacher?.name ?? 'Unassigned'}</Text>
          </View>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-sm text-ink-secondary">Students</Text>
            <Text className="text-sm font-semibold text-ink">{s.batch?.enrolledCount ?? 0} enrolled</Text>
          </View>
          {s.meetingLink ? (
            <Pressable onPress={() => Linking.openURL(s.meetingLink!)} className="mt-1 flex-row items-center justify-between active:opacity-70">
              <Text className="text-sm text-ink-secondary">Meeting link</Text>
              <Text className="max-w-[60%] text-sm font-semibold text-brand" numberOfLines={1}>
                {s.meetingLink.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ) : null}
        </Card>

        <View className="mt-3">
          <Button
            label={
              remindState === 'sending'
                ? 'Sending…'
                : remindState === 'sent'
                  ? 'Reminder sent ✓'
                  : remindState === 'failed'
                    ? 'Failed — retry'
                    : `Send reminder on WhatsApp — ${s.batch?.enrolledCount ?? 0} guardians`
            }
            onPress={sendReminder}
            disabled={remindState === 'sending' || remindState === 'sent'}
          />
          <Text className="mt-1 text-center text-xs text-ink-faint">Includes time + meeting link · metered send</Text>
        </View>

        {s.canManage ? (
          <View className="mt-3 flex-row gap-2">
            <View className="flex-1">
              <Button label={showReschedule ? 'Hide reschedule' : 'Reschedule'} variant="quiet" onPress={() => setShowReschedule((v) => !v)} />
            </View>
            <View className="flex-1">
              <Button label="Cancel class" variant="danger" onPress={confirmCancel} loading={cancel.isPending} />
            </View>
          </View>
        ) : null}

        {showReschedule ? <RescheduleForm s={s} onDone={() => setShowReschedule(false)} /> : null}

        <View className="mt-3">
          <Button label="Mark attendance" variant="outline" onPress={() => router.push('/(org)/attendance' as never)} />
        </View>
        <View className="h-6" />
      </FormScrollView>
    </Screen>
  )
}
