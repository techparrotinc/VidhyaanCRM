'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

interface StudentDetail {
  id: string
  studentCode: string
  name: string
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  gender: string | null
  dateOfBirth: string | null
  status: string
  rollNumber: string | null
  academicYearId: string | null
  createdAt: string
  updatedAt: string
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
  invoices: {
    id: string
    invoiceNumber: string
    totalAmount: number
    status: string
    dueDate: string | null
    createdAt: string
  }[]
}

export function useStudent(id: string) {
  const key = id
    ? `/api/v1/students/${id}`
    : null

  const { data, error, isLoading, mutate } =
    useSWR<StudentDetail>(key, fetcher)

  return {
    student: data ?? null,
    isLoading,
    error,
    mutate
  }
}
