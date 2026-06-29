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
  enrollments?: {
    id: string
    courseId: string
    status: string
    startDate: string
    endDate: string | null
    nextBillingDate: string | null
    createdAt: string
    course: {
      id: string
      name: string
      amount: number
      frequency: string
      billingDay: number
      category: string | null
    }
  }[]
  activities?: {
    id: string
    type: string
    summary: string
    note: string | null
    createdAt: string
    performedBy: {
      id: string
      name: string
    } | null
  }[]
}

interface StudentResponse {
  success: boolean
  data: StudentDetail
}

export function useStudent(id: string) {
  const key = id
    ? `/api/v1/students/${id}`
    : null

  const { data, error, isLoading, mutate } =
    useSWR<StudentResponse>(key, fetcher)

  return {
    student: data?.data ?? null,
    isLoading,
    error,
    mutate
  }
}
