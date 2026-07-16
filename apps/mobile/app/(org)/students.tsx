import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Avatar, SearchBar, EmptyState } from '@/components/ui'
import { useStudentDirectory, useClassOptions, type StudentDirectoryEntry } from '@/lib/students'

function StudentRow({ student }: { student: StudentDirectoryEntry }) {
  const call = () => student.guardianPhone && Linking.openURL(`tel:${student.guardianPhone}`)
  const whatsapp = () => student.guardianPhone && Linking.openURL(`https://wa.me/91${student.guardianPhone}`)

  return (
    <Card className="mt-3 flex-row items-center gap-3">
      <Pressable
        onPress={() => router.push(`/(org)/students/${student.id}` as never)}
        className="flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <Avatar name={student.name} accent="brand" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{student.name}</Text>
          <Text className="text-xs text-ink-secondary">
            {[student.gradeLabel, student.section].filter(Boolean).join('-') || student.studentCode}
            {student.guardianName ? ` · ${student.guardianName}` : ''}
          </Text>
        </View>
      </Pressable>
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
  const [grade, setGrade] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useStudentDirectory(search, grade ?? undefined)
  const { data: classes } = useClassOptions()

  return (
    <Screen
      header={
        <GradientHeader
          title="Students"
          subtitle={data ? `${data.total} active` : undefined}
          accent="brand"
          right={
            <Pressable
              onPress={() => router.push('/(org)/enroll' as never)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
            >
              <Text className="text-2xl leading-none text-white">+</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, code, guardian phone…" />

        {classes && classes.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5" keyboardShouldPersistTaps="handled">
            <View className="flex-row gap-1.5 pr-4">
              <Pressable
                onPress={() => setGrade(null)}
                className={`rounded-full px-3 py-1.5 ${grade === null ? 'bg-brand' : 'border border-line bg-white'}`}
              >
                <Text className={`text-xs font-semibold ${grade === null ? 'text-white' : 'text-ink-secondary'}`}>All</Text>
              </Pressable>
              {classes.map((c) => (
                <Pressable
                  key={c.name}
                  onPress={() => setGrade(grade === c.name ? null : c.name)}
                  className={`rounded-full px-3 py-1.5 ${grade === c.name ? 'bg-brand' : 'border border-line bg-white'}`}
                >
                  <Text className={`text-xs font-semibold ${grade === c.name ? 'text-white' : 'text-ink-secondary'}`}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

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
