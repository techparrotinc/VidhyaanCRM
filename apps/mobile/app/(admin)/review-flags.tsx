import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, EmptyState } from '@/components/ui'
import { useFlaggedReviews, useModerateReview, type FlaggedReview } from '@/lib/admin'

function confirmAsync(title: string, message: string, confirmLabel: string, destructive: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) }
    ])
  })
}

function ReviewRow({ review }: { review: FlaggedReview }) {
  const moderate = useModerateReview()
  const [showRemove, setShowRemove] = useState(false)
  const [reason, setReason] = useState('')

  const restore = async () => {
    const ok = await confirmAsync('Restore review?', 'This clears the flag and republishes it.', 'Restore', false)
    if (!ok) return
    await moderate.mutateAsync({ reviewId: review.id, status: 'PUBLISHED' })
  }

  const remove = async () => {
    const ok = await confirmAsync('Remove review?', 'The parent will be notified this review was removed.', 'Remove', true)
    if (!ok) return
    await moderate.mutateAsync({ reviewId: review.id, status: 'REMOVED', reason: reason.trim() || undefined })
    setShowRemove(false)
  }

  return (
    <Card className="mt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-ink">{review.school?.name ?? 'Unknown school'}</Text>
        <Text className="text-xs font-semibold text-warn">{review.rating}★</Text>
      </View>
      <Text className="text-xs text-ink-faint">by {review.parent?.name ?? 'Parent'}</Text>
      {review.title ? <Text className="mt-2 text-sm font-medium text-ink">{review.title}</Text> : null}
      {review.body ? (
        <Text className="mt-1 text-xs text-ink-secondary" numberOfLines={4}>
          {review.body}
        </Text>
      ) : null}
      {review.flagReason ? (
        <Card className="mt-2 border-bad/30 bg-bad-bg">
          <Text className="text-[11px] font-semibold text-bad">Flagged: {review.flagReason}</Text>
        </Card>
      ) : null}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => setShowRemove((v) => !v)}
          className="flex-1 items-center rounded-xl border border-bad/40 py-2 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-bad">{showRemove ? 'Cancel' : 'Remove'}</Text>
        </Pressable>
        <Pressable onPress={restore} disabled={moderate.isPending} className="flex-1 items-center rounded-xl bg-good py-2 active:opacity-70">
          <Text className="text-xs font-semibold text-white">Restore</Text>
        </Pressable>
      </View>

      {showRemove ? (
        <View className="mt-3 gap-2 border-t border-line pt-3">
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason (optional, shown to parent)"
            className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
          />
          <Pressable onPress={remove} disabled={moderate.isPending} className="items-center rounded-xl bg-bad py-2.5 active:opacity-70">
            <Text className="text-sm font-semibold text-white">{moderate.isPending ? 'Removing…' : 'Confirm remove'}</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  )
}

export default function ReviewFlags() {
  const { data, isLoading, isError, refetch } = useFlaggedReviews()

  return (
    <Screen
      header={
        <GradientHeader
          title="Flagged Reviews"
          subtitle={data ? `${data.total} pending` : undefined}
          accent="events"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#EA580C" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load flagged reviews. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.reviews.length > 0 ? (
          data.reviews.map((r) => <ReviewRow key={r.id} review={r} />)
        ) : (
          <EmptyState icon="checkmark-circle-outline" title="All clear" subtitle="No flagged reviews." />
        )}
      </ScrollView>
    </Screen>
  )
}
