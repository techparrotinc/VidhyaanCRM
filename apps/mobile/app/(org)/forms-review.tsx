import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip } from '@/components/ui'
import { useForms, useFormSubmissions, useReviewSubmission, type FormSummary, type FormSubmission } from '@/lib/forms-review'

function statusTone(status: string | null): 'neutral' | 'good' | 'bad' | 'warn' {
  if (status === 'ACCEPTED') return 'good'
  if (status === 'REJECTED') return 'bad'
  if (status === 'PENDING') return 'warn'
  return 'neutral'
}

function SubmissionRow({ formId, submission }: { formId: string; submission: FormSubmission }) {
  const review = useReviewSubmission()
  const pendingCount = submission.fieldStates?.pending?.length ?? 0
  const canReview = submission.reviewStatus === 'PENDING' || (pendingCount > 0 && !submission.reviewStatus)

  return (
    <Card className="mt-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{submission.targetLabel ?? submission.targetType}</Text>
          <Text className="text-xs text-ink-faint">
            {submission.submittedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            {pendingCount > 0 ? ` · ${pendingCount} field${pendingCount === 1 ? '' : 's'} pending` : ''}
          </Text>
        </View>
        <Chip label={submission.reviewStatus ?? 'NEW'} tone={statusTone(submission.reviewStatus)} />
      </View>

      {canReview ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => review.mutate({ formId, submissionId: submission.id, action: 'reject' })}
            disabled={review.isPending}
            className="flex-1 items-center rounded-xl border border-bad/40 py-2 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-bad">Reject</Text>
          </Pressable>
          <Pressable
            onPress={() => review.mutate({ formId, submissionId: submission.id, action: 'accept' })}
            disabled={review.isPending}
            className="flex-1 items-center rounded-xl bg-good py-2 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-white">{review.isPending ? 'Saving…' : 'Approve'}</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  )
}

function FormList({ onSelect }: { onSelect: (form: FormSummary) => void }) {
  const { data, isLoading, isError, refetch } = useForms()

  if (isLoading) {
    return (
      <View className="mt-8 items-center">
        <ActivityIndicator color="#1565D8" />
      </View>
    )
  }
  if (isError) {
    return (
      <Card className="mt-4">
        <Text className="text-sm text-bad">Couldn't load forms. Pull to retry.</Text>
        <Pressable onPress={() => refetch()} className="mt-2">
          <Text className="text-sm font-semibold text-brand">Retry</Text>
        </Pressable>
      </Card>
    )
  }
  if (!data || data.length === 0) {
    return (
      <Card className="mt-4">
        <Text className="text-sm text-ink-secondary">No forms set up for this org.</Text>
      </Card>
    )
  }
  return (
    <>
      {data.map((f) => (
        <Pressable key={f.id} onPress={() => onSelect(f)} className="active:opacity-70">
          <Card className="mt-3 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-ink">{f.name}</Text>
              <Text className="text-xs text-ink-faint">{f.purpose}</Text>
            </View>
            <Chip label={`${f._count.submissions} submitted`} tone="neutral" />
          </Card>
        </Pressable>
      ))}
    </>
  )
}

function SubmissionsList({ form, onBack }: { form: FormSummary; onBack: () => void }) {
  const { data, isLoading, isError, refetch } = useFormSubmissions(form.id)

  return (
    <>
      <Pressable onPress={onBack}>
        <Text className="text-sm font-semibold text-brand">← All forms</Text>
      </Pressable>
      {isLoading ? (
        <View className="mt-8 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : isError ? (
        <Card className="mt-4">
          <Text className="text-sm text-bad">Couldn't load submissions. Pull to retry.</Text>
          <Pressable onPress={() => refetch()} className="mt-2">
            <Text className="text-sm font-semibold text-brand">Retry</Text>
          </Pressable>
        </Card>
      ) : data && data.submissions.length > 0 ? (
        data.submissions.map((s) => <SubmissionRow key={s.id} formId={form.id} submission={s} />)
      ) : (
        <Card className="mt-4">
          <Text className="text-sm text-ink-secondary">No submissions yet.</Text>
        </Card>
      )}
    </>
  )
}

export default function FormsReview() {
  const [selected, setSelected] = useState<FormSummary | null>(null)

  return (
    <Screen
      header={
        <GradientHeader
          title={selected ? selected.name : 'Digital Forms'}
          subtitle="Review submissions"
          accent="brand"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {selected ? <SubmissionsList form={selected} onBack={() => setSelected(null)} /> : <FormList onSelect={setSelected} />}
      </ScrollView>
    </Screen>
  )
}
