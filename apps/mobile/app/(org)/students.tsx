import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, GradientHeader, Card, Avatar, SearchBar, EmptyState } from '@/components/ui'
import { useStudentDirectory, type StudentDirectoryEntry } from '@/lib/students'

function StudentRow({ student }: { student: StudentDirectoryEntry }) {
  const call = () => student.guardianPhone && Linking.openURL(`tel:${student.guardianPhone}`)
  const whatsapp = () => student.guardianPhone && Linking.openURL(`https://wa.me/91${student.guardianPhone}`)

  return (
    <Card className="mt-3 flex-row items-center gap-3">
      <Avatar name={student.name} accent="brand" />
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
            <Ionicons name="call-outline" size={14} color="#1565D8" />
          </Pressable>
          <Pressable onPress={whatsapp} className="h-8 w-8 items-center justify-center rounded-full border border-line active:opacity-70">
            <Ionicons name="logo-whatsapp" size={14} color="#0D9488" />
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
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, code, guardian phone…" />

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
          <EmptyState icon="school-outline" title="No students found" subtitle="Try a different search." />
        )}
      </ScrollView>
    </Screen>
  )
}
