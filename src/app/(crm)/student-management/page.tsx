"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, GraduationCap, Users, Calendar, ArrowRight, UserCheck } from 'lucide-react'
import TableSkeleton from '@/components/shared/TableSkeleton'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'

interface Student {
  id: string
  studentCode: string
  name: string
  rollNumber: string | null
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'SUSPENDED'
}

export default function StudentListingPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (searchQuery) params.set('search', searchQuery)
      if (gradeFilter) params.set('class', gradeFilter)

      const res = await fetch(`/api/v1/students?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setStudents(json.data || [])
        setTotalPages(json.meta?.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, gradeFilter])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div className="p-6 space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans">Students Directory</h1>
          <p className="text-sm text-slate-500">View and manage enrolled student profiles, academic status, and billing.</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, code, or roll number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all"
          />
        </div>

        {/* Grade Filter */}
        <div className="w-full md:w-48">
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value)
              setPage(1)
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all"
          >
            <option value="">All Grades</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50">
            <GraduationCap className="h-12 w-12 text-slate-350 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Students Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">There are no student profiles matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Grade/Class</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Guardian</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => router.push(`/student-management/${student.id}`)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {student.studentCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{student.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {student.rollNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {getGradeLabel(student.gradeLabel || '') || student.gradeLabel || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{student.guardianName || '-'}</span>
                        {student.guardianPhone && (
                          <span className="text-xs text-slate-400">{student.guardianPhone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        student.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' :
                        student.status === 'ALUMNI' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/student-management/${student.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#1565D8] hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
