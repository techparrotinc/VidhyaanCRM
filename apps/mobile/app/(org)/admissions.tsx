import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Screen, GradientHeader, Card, Chip } from '@/components/ui'
import {
  useAdmissionStages,
  useAdmissions,
  useMoveAdmissionStage,
  useUploadAdmissionDocument,
  type Admission
} from '@/lib/admissions'

function StagePicker({ admission, onClose }: { admission: Admission; onClose: () => void }) {
  const { data: stages } = useAdmissionStages()
  const move = useMoveAdmissionStage()

  return (
    <View className="mt-3 border-t border-line pt-3">
      <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ink-faint">Move to stage</Text>
      <View className="flex-row flex-wrap gap-2">
        {(stages ?? []).map((s) => (
          <Pressable
            key={s.id}
            disabled={move.isPending || s.id === admission.stageId}
            onPress={async () => {
              await move.mutateAsync({ admissionId: admission.id, stageId: s.id })
              onClose()
            }}
            className={`rounded-full px-3 py-1.5 ${s.id === admission.stageId ? 'bg-brand' : 'border border-line'}`}
          >
            <Text className={`text-xs font-semibold ${s.id === admission.stageId ? 'text-white' : 'text-ink-secondary'}`}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function DocCaptureButton({ admission }: { admission: Admission }) {
  const upload = useUploadAdmissionDocument()
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'failed'>('idle')

  const capture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 })
    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    setStatus('uploading')
    try {
      await upload.mutateAsync({
        admissionId: admission.id,
        uri: asset.uri,
        fileName: asset.fileName ?? `document-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        docName: `Document — ${new Date().toLocaleDateString('en-IN')}`
      })
      setStatus('done')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <Pressable onPress={capture} disabled={status === 'uploading'} className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70">
      <Text className="text-xs font-semibold text-ink-secondary">
        {status === 'uploading' ? 'Uploading…' : status === 'done' ? 'Uploaded ✓' : status === 'failed' ? 'Failed — retry' : 'Add doc'}
      </Text>
    </Pressable>
  )
}

function AdmissionRow({ admission }: { admission: Admission }) {
  const [showPicker, setShowPicker] = useState(false)
  const call = () => Linking.openURL(`tel:${admission.phone}`)
  const whatsapp = () => Linking.openURL(`https://wa.me/91${admission.phone}`)

  return (
    <Card className="mt-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{admission.applicantName}</Text>
          <Text className="text-xs text-ink-secondary">
            {[admission.parentName, admission.gradeSought].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {admission.stage ? <Chip label={admission.stage.name} tone="neutral" /> : null}
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable onPress={call} className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70">
          <Text className="text-xs font-semibold text-brand">Call</Text>
        </Pressable>
        <Pressable onPress={whatsapp} className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70">
          <Text className="text-xs font-semibold text-attend">WhatsApp</Text>
        </Pressable>
        <DocCaptureButton admission={admission} />
      </View>
      <View className="mt-2">
        <Pressable
          onPress={() => setShowPicker((v) => !v)}
          className="items-center rounded-xl bg-brand py-2 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-white">{showPicker ? 'Close' : 'Move stage'}</Text>
        </Pressable>
      </View>

      {showPicker ? <StagePicker admission={admission} onClose={() => setShowPicker(false)} /> : null}
    </Card>
  )
}

export default function Admissions() {
  const [stageId, setStageId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const stages = useAdmissionStages()
  const { data, isLoading, isError, refetch } = useAdmissions(stageId, search)

  return (
    <Screen
      header={
        <GradientHeader
          title="Admissions"
          subtitle={data ? `${data.total} in pipeline` : undefined}
          accent="brand"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search applicant, parent, code…"
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-2">
            <Pressable onPress={() => setStageId(null)} className={`rounded-full px-3 py-1.5 ${stageId === null ? 'bg-brand' : 'border border-line'}`}>
              <Text className={`text-xs font-semibold ${stageId === null ? 'text-white' : 'text-ink-secondary'}`}>All</Text>
            </Pressable>
            {(stages.data ?? []).map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setStageId(s.id)}
                className={`rounded-full px-3 py-1.5 ${stageId === s.id ? 'bg-brand' : 'border border-line'}`}
              >
                <Text className={`text-xs font-semibold ${stageId === s.id ? 'text-white' : 'text-ink-secondary'}`}>
                  {s.label} ({s.count})
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load admissions. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.admissions.length > 0 ? (
          data.admissions.map((a) => <AdmissionRow key={a.id} admission={a} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No admissions found.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
