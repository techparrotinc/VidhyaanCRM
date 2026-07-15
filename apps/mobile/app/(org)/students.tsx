import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Screen, GradientHeader, Card, IconCircle } from '@/components/ui'
import { useStudentDirectory, type StudentDirectoryEntry } from '@/lib/students'

function StudentRow({ student }: { student: StudentDirectoryEntry }) {
  const call = () => student.guardianPhone && Linking.openURL(`tel:${student.guardianPhone}`)
  const whatsapp = () => student.guardianPhone && Linking.openURL(`https://wa.me/91${student.guardianPhone}`)

  return (
    <Card className="mt-3 flex-row items-center gap-3">
      <IconCircle accent="brand" />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink">{student.name}</Text>
        <Text className="text-xs text-ink-secondary">
          {[student.gradeLabel, student.section].filter(Boolean).join('-') || student.studentCode}
          {student.guardianName ? ` · ${student.guardianName}` : ''}
        </Text>
      </View>
      {student.guardianPhone ? (
        <View className="flex-row gap-2">
          <Pressable onPress={call} className="h-8 w-8 items-center justify-center rounded-full border border-line active:opacity-70">
            <Text className="text-xs font-semibold text-brand">Call</Text>
          </Pressable>
          <Pressable onPress={whatsapp} className="h-8 w-8 items-center justify-center rounded-full border border-line active:opacity-70">
            <Text className="text-xs font-semibold text-attend">WA</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  )
}

export default function Students() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useStudentDirectory(search)

  return (
    <Screen
      header={<GradientHeader title="Students" subtitle={data ? `${data.total} active` : undefined} accent="brand" />}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, code, guardian phone…"
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
        />

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load students. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.students.length > 0 ? (
          data.students.map((s) => <StudentRow key={s.id} student={s} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No students found.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
