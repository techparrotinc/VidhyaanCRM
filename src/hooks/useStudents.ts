'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

interface UseStudentsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  gradeLabel?: string
  academicYearId?: string
}

interface Student {
  id: string
  studentCode: string
  name: string
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
  gender: string | null
  status: string
  rollNumber: string | null
  academicYearId: string | null
  createdAt: string
  branch: {
    id: string
    name: string
  } | null
  academicYear: {
    id: string
    name: string
  } | null
  admission: {
    id: string
    admissionCode: string
  } | null
}

interface StudentsResponse {
  success: boolean
  data: Student[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function useStudents(
  params: UseStudentsParams = {}
) {
  const {
    page = 1,
    limit = 25,
    search,
    status,
    gradeLabel,
    academicYearId
  } = params

  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (search) query.set('search', search)
  if (status) query.set('status', status)
  if (gradeLabel)
    query.set('gradeLabel', gradeLabel)
  if (academicYearId)
    query.set('academicYearId', academicYearId)

  const key = `/api/v1/students?${query}`

  const { data, error, isLoading, mutate } =
    useSWR<StudentsResponse>(key, fetcher)

  return {
    students: data?.data ?? [],
    total: data?.pagination?.total ?? 0,
    page: data?.pagination?.page ?? 1,
    limit: data?.pagination?.limit ?? 25,
    totalPages: data?.pagination?.totalPages ?? 0,
    isLoading,
    error,
    mutate
  }
}
