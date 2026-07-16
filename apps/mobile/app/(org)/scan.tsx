import { useState } from 'react'
import { Image, Pressable, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card, Button, FormScrollView } from '@/components/ui'
import { useCreateLead } from '@/lib/leads'
import { extractLeadFromImage } from '@/lib/ai-extract'

/**
 * Scan enquiry form (wireframe s-scan): capture the paper form / visiting
 * card, review the fields, create the lead. AI auto-extraction plugs in
 * here once the gateway exposes a vision endpoint — until then the photo
 * is the visual reference while staff key in the 3 fields.
 */
export default function ScanForm() {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<'idle' | 'done' | 'unavailable'>('idle')
  const createLead = useCreateLead()

  const capture = async (fromCamera: boolean) => {
    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) return
    }
    const result = await fn({ mediaTypes: ['images'], quality: 0.7 })
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      // Best-effort AI auto-fill; scan stays useful as manual entry when
      // the gateway's vision endpoint isn't available.
      setExtracting(true)
      setExtracted('idle')
      const fields = await extractLeadFromImage(uri)
      setExtracting(false)
      if (fields && (fields.name || fields.phone)) {
        if (fields.name) setName(fields.name)
        if (fields.phone) setPhone(fields.phone)
        if (fields.classOrCourse) setGrade(fields.classOrCourse)
        setExtracted('done')
      } else {
        setExtracted('unavailable')
      }
    }
  }

  const submit = async () => {
    setError(null)
    if (name.trim().length < 2) return setError('Name is required')
    if (phone.length !== 10) return setError('Phone must be 10 digits')
    try {
      await createLead.mutateAsync({
        parentName: name.trim(),
        phone,
        gradeSought: grade.trim() || undefined
      })
      router.replace('/(org)/leads' as never)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lead')
    }
  }

  return (
    <Screen header={<DetailHeader title="Scan enquiry form" onBack={() => router.back()} />}>
      <FormScrollView>
        <Pressable onPress={() => capture(true)} className="mt-2 active:opacity-80">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="h-56 w-full rounded-2xl" resizeMode="cover" />
          ) : (
            <View className="h-56 items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white">
              <Text className="text-4xl">📷</Text>
              <Text className="mt-2 text-sm font-semibold text-ink">Photograph the paper form</Text>
              <Text className="text-xs text-ink-faint">or visiting card</Text>
            </View>
          )}
        </Pressable>
        <View className="mt-2 flex-row gap-2">
          <View className="flex-1">
            <Button label="Camera" variant="quiet" onPress={() => capture(true)} />
          </View>
          <View className="flex-1">
            <Button label="Gallery" variant="quiet" onPress={() => capture(false)} />
          </View>
        </View>

        <Card className="mt-3 gap-2.5">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            {extracting ? 'Reading the form…' : extracted === 'done' ? 'Extracted — check & edit' : 'Check & edit'}
          </Text>
          <TextInput value={name} onChangeText={setName} placeholder="Parent name" className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink" />
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            placeholder="Phone (10 digits)"
            className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
          />
          <TextInput value={grade} onChangeText={setGrade} placeholder="Class / course (optional)" className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink" />
        </Card>
        {error ? <Text className="mt-2 text-sm text-bad">{error}</Text> : null}
        <View className="mt-3">
          <Button label="Create lead" onPress={submit} loading={createLead.isPending} />
        </View>
        <Text className="mt-2 text-center text-xs text-ink-faint">
          {extracted === 'done'
            ? 'AI filled the fields from the photo — review before saving.'
            : 'Fields stay editable — AI auto-fill runs when available.'}
        </Text>
        <View className="h-6" />
      </FormScrollView>
    </Screen>
  )
}
