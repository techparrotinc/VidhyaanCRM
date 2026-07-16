import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card, Button, Chip, FormScrollView } from '@/components/ui'
import { useBatches, useCourses, useEnrollStudent, type EnrollCourse } from '@/lib/enroll'
import { useClassOptions } from '@/lib/students'

/** Enrol wizard (wireframes s-enroll-1..done): student & guardian →
 *  course & batch → fee preview → enrol (server creates first invoice). */

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const FREQUENCY_LABEL: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One-time'
}

export default function Enroll() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<string | null>(null)
  const [guardianName, setGuardianName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2
  const [course, setCourse] = useState<EnrollCourse | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ studentName: string } | null>(null)

  const { data: classes } = useClassOptions()
  const { data: courses, isLoading: coursesLoading } = useCourses()
  const { data: batches } = useBatches()
  const enroll = useEnrollStudent()

  const courseBatches = useMemo(
    () => (batches ?? []).filter((b) => !course || !b.course || b.course.id === course.id),
    [batches, course]
  )

  const startDate = new Date().toISOString().slice(0, 10)

  const submit = async () => {
    if (!course) return
    setError(null)
    try {
      const r = await enroll.mutateAsync({
        name: name.trim(),
        gradeLabel: grade ?? undefined,
        guardianName: guardianName.trim(),
        guardianPhone: phone,
        batchId: batchId ?? undefined,
        courseId: course.id,
        startDate
      })
      setResult({ studentName: r.studentName })
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrolment failed')
    }
  }

  const stepTitle =
    step === 1 ? 'Enrol student · 1 of 3' : step === 2 ? 'Course & batch · 2 of 3' : step === 3 ? 'Confirm · 3 of 3' : 'Enrolled'

  return (
    <Screen header={<DetailHeader title={stepTitle} onBack={() => (step > 1 && step < 4 ? setStep((s) => (s - 1) as never) : router.back())} />}>
      <FormScrollView>
        {step === 1 ? (
          <View className="mt-2 gap-3">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Student</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Student name" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" />
            {classes && classes.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5">
                {classes.map((c) => (
                  <Pressable key={c.name} onPress={() => setGrade(grade === c.name ? null : c.name)} className={`rounded-full px-3 py-1.5 ${grade === c.name ? 'bg-brand' : 'border border-line bg-white'}`}>
                    <Text className={`text-xs font-semibold ${grade === c.name ? 'text-white' : 'text-ink-secondary'}`}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text className="mt-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">Guardian</Text>
            <TextInput value={guardianName} onChangeText={setGuardianName} placeholder="Guardian name" className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" />
            <TextInput
              value={phone}
              onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              placeholder="Guardian phone (10 digits)"
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
            />
            <Button
              label="Continue"
              onPress={() => setStep(2)}
              disabled={name.trim().length < 2 || guardianName.trim().length < 2 || phone.length !== 10}
            />
            <Text className="text-center text-xs text-ink-faint">Duplicate check on phone number runs on save</Text>
          </View>
        ) : step === 2 ? (
          <View className="mt-2 gap-3">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Course</Text>
            {coursesLoading ? (
              <ActivityIndicator color="#1565D8" />
            ) : (courses ?? []).length === 0 ? (
              <Text className="text-sm text-ink-faint">No courses configured — add them on the web (Settings → Courses).</Text>
            ) : (
              (courses ?? []).map((c) => (
                <Pressable key={c.id} onPress={() => setCourse(c)} className="active:opacity-70">
                  <Card className={`flex-row items-center justify-between gap-2 ${course?.id === c.id ? 'border-brand' : ''}`}>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-ink">{c.name}</Text>
                      <Text className="text-xs text-ink-secondary">
                        {[c.durationMonths ? `${c.durationMonths} months` : null, `${inr(c.amount)}/${(FREQUENCY_LABEL[c.frequency] ?? c.frequency).toLowerCase()}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    {course?.id === c.id ? <Chip label="✓" tone="brand" selected /> : null}
                  </Card>
                </Pressable>
              ))
            )}
            {courseBatches.length > 0 ? (
              <>
                <Text className="mt-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">Batch (optional)</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {courseBatches.map((b) => (
                    <Pressable key={b.id} onPress={() => setBatchId(batchId === b.id ? null : b.id)} className={`rounded-full px-3 py-1.5 ${batchId === b.id ? 'bg-brand' : 'border border-line bg-white'}`}>
                      <Text className={`text-xs font-semibold ${batchId === b.id ? 'text-white' : 'text-ink-secondary'}`}>
                        {[b.name, b.startTime && b.endTime ? `${b.startTime}–${b.endTime}` : null].filter(Boolean).join(' · ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Button label="Continue" onPress={() => setStep(3)} disabled={!course} />
          </View>
        ) : step === 3 && course ? (
          <View className="mt-2 gap-3">
            <Card>
              <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">From course template</Text>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-sm text-ink-secondary">{FREQUENCY_LABEL[course.frequency] ?? course.frequency} fee</Text>
                <Text className="text-sm font-bold text-ink">{inr(course.amount)}</Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-sm text-ink-secondary">Bill on day</Text>
                <Text className="text-sm font-semibold text-ink">{course.billingDay}</Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-sm text-ink-secondary">Starts</Text>
                <Text className="text-sm font-semibold text-ink">Today</Text>
              </View>
            </Card>
            <Card className="border-brand bg-brand-soft/40">
              <Text className="text-sm font-bold text-ink">Preview</Text>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text className="text-sm text-ink-secondary">First invoice — created now</Text>
                <Text className="text-sm font-bold text-ink">{inr(course.amount)}</Text>
              </View>
              <Text className="mt-1 text-xs text-ink-faint">
                Then {(FREQUENCY_LABEL[course.frequency] ?? course.frequency).toLowerCase()} on day {course.billingDay} · {name} · {guardianName} ({phone})
              </Text>
            </Card>
            {error ? <Text className="text-sm text-bad">{error}</Text> : null}
            <Button label="Enrol & create first invoice" onPress={submit} loading={enroll.isPending} />
          </View>
        ) : (
          <View className="mt-10 items-center gap-3 px-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-good-bg">
              <Text className="text-3xl text-good">✓</Text>
            </View>
            <Text className="text-xl font-bold text-ink">{result?.studentName} enrolled</Text>
            <Text className="text-center text-sm text-ink-secondary">
              {course?.name} · first invoice {course ? inr(course.amount) : ''} created ·{' '}
              {(FREQUENCY_LABEL[course?.frequency ?? ''] ?? '').toLowerCase()} plan active
            </Text>
            <View className="mt-4 w-full gap-2">
              <Button label={`Collect ${course ? inr(course.amount) : ''} now`} onPress={() => router.replace('/(org)/fees' as never)} />
              <Button label="Done" variant="quiet" onPress={() => router.replace('/(org)/students' as never)} />
            </View>
          </View>
        )}
        <View className="h-6" />
      </FormScrollView>
    </Screen>
  )
}
