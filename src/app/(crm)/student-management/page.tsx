'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Plus, Download, Search,
  Mail, MessageCircle, Phone,
  MoreVertical
} from 'lucide-react'
import { useStudents } from '@/hooks/useStudents'
import { GRADE_OPTIONS } from '@/constants/grades'
import { createPortal } from 'react-dom'

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    border: 'border-l-green-500',
    badge: 'bg-green-50 text-green-700'
  },
  ALUMNI: {
    label: 'Alumni',
    border: 'border-l-purple-500',
    badge: 'bg-purple-50 text-purple-700'
  },
  TRANSFERRED: {
    label: 'Transferred',
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700'
  },
  SUSPENDED: {
    label: 'Suspended',
    border: 'border-l-red-400',
    badge: 'bg-red-50 text-red-700'
  },
  DROPPED_OUT: {
    label: 'Dropped Out',
    border: 'border-l-slate-400',
    badge: 'bg-slate-100 text-slate-500'
  }
} as const

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ALUMNI', label: 'Alumni' },
  { key: 'TRANSFERRED', label: 'Transferred' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'DROPPED_OUT', label: 'Dropped Out' }
]

export default function StudentListingPage() {
  const [activeStatus, setActiveStatus] = useState('')
  const [search, setSearch] = useState('')
  const [gradeLabel, setGradeLabel] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const router = useRouter()

  const {
    students,
    total,
    totalPages,
    isLoading,
    mutate
  } = useStudents({
    page,
    search,
    status: activeStatus || undefined,
    gradeLabel: gradeLabel || undefined
  })

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUS_TABS.forEach(tab => {
      if (tab.key === '') {
        counts[''] = total
      } else {
        counts[tab.key] = students.filter(
          s => s.status === tab.key
        ).length
      }
    })
    return counts
  }, [students, total])

  const handleActionClick = useCallback((
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 160
    })
    setActionMenuId(prev => prev === id ? null : id)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(
        'Delete this student? ' +
        'This cannot be undone.'
      )) return
      await fetch(
        `/api/v1/students/${id}`,
        { method: 'DELETE' }
      )
      mutate()
      setActionMenuId(null)
    }, [mutate]
  )

  const handleExport = useCallback(() => {
    const params = new URLSearchParams()
    if (activeStatus)
      params.set('status', activeStatus)
    if (gradeLabel)
      params.set('gradeLabel', gradeLabel)
    window.open(
      `/api/v1/students/export?${params}`,
      '_blank'
    )
  }, [activeStatus, gradeLabel])

  const MIN_ROWS = 8
  const emptyRowCount = Math.max(
    0,
    MIN_ROWS - students.length
  )

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-6 pb-4">

        <h1 className="text-xl font-bold text-slate-900 flex-1 min-w-0">
          Student Management
        </h1>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* New Student button */}
          <button
            onClick={() => router.push('/student-management/create')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0">
            <Plus className="w-4 h-4" />
            New Student
          </button>
        </div>
      </div>

      {/* ── STATUS TABS ── */}
      <div className="px-4 sm:px-6">
        <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-1 border-b border-slate-200 min-w-max">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveStatus(tab.key)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                  activeStatus === tab.key
                    ? 'border-[#1565D8] text-[#1565D8]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {tab.label}
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeStatus === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.key === ''
                    ? total
                    : (statusCounts[tab.key] ?? 0)
                  }
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition placeholder:text-slate-400"
              />
            </div>

            {/* Grade filter */}
            <select
              value={gradeLabel}
              onChange={e => {
                setGradeLabel(e.target.value)
                setPage(1)
              }}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#1565D8] transition flex-shrink-0 min-w-[120px]"
            >
              <option value="">All Grades</option>
              {GRADE_OPTIONS.map(g => (
                <option key={g.value} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition flex-shrink-0"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="px-4 sm:px-6 pt-4 pb-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Table wrapper */}
          <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full min-w-[780px]">

              {/* Header */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === students.length &&
                        students.length > 0
                      }
                      onChange={e => {
                        setSelectedIds(
                          e.target.checked
                            ? students.map(s => s.id)
                            : []
                        )
                      }}
                      className="rounded border-slate-300" />
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Grade
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Connect
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Guardian
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  /* Loading rows */
                  Array.from({ length: 8 }).map(
                    (_, i) => (
                      <tr key={i} className="border-b border-slate-100 animate-pulse">
                        <td className="px-3 py-2.5" colSpan={8}>
                          <div className="h-8 bg-slate-100 rounded" />
                        </td>
                      </tr>
                    )
                  )
                ) : students.length === 0 ? (
                  /* Empty state */
                  <tr>
                    <td colSpan={8} className="px-3 py-16 text-center text-sm text-slate-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  <>
                    {students.map(student => {
                      const config =
                        STATUS_CONFIG[
                          student.status as keyof typeof STATUS_CONFIG
                        ] ?? STATUS_CONFIG.ACTIVE

                      /* Avatar initials */
                      const initials =
                        student.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()

                      /* Avatar color */
                      const colors = [
                        'bg-blue-500',
                        'bg-green-500',
                        'bg-purple-500',
                        'bg-amber-500',
                        'bg-red-500',
                        'bg-indigo-500'
                      ]
                      const colorIndex =
                        student.name.charCodeAt(0) % colors.length
                      const avatarColor = colors[colorIndex]

                      return (
                        <tr
                          key={student.id}
                          onClick={() => router.push(`/student-management/${student.id}`)}
                          className={`border-b border-slate-100 border-l-2 ${config.border} hover:bg-slate-50/80 transition-colors cursor-pointer`}>

                          {/* Checkbox */}
                          <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(student.id)}
                              onChange={e => {
                                e.stopPropagation()
                                setSelectedIds(prev =>
                                  e.target.checked
                                    ? [...prev, student.id]
                                    : prev.filter(id => id !== student.id)
                                )
                              }}
                              className="rounded border-slate-300" />
                          </td>

                          {/* Student */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {student.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                  {student.studentCode}
                                  {student.rollNumber && ` · Roll: ${student.rollNumber}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Grade */}
                          <td className="px-3 py-2.5">
                            {student.gradeLabel ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {student.gradeLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* Connect */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  if (student.guardianPhone)
                                    window.open(`mailto:${student.guardianPhone}`)
                                }}
                                className="text-slate-400 hover:text-blue-500 transition-colors">
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  if (student.guardianPhone)
                                    window.open(`https://wa.me/91${student.guardianPhone}`)
                                }}
                                className="text-slate-400 hover:text-green-500 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  if (student.guardianPhone)
                                    window.open(`tel:${student.guardianPhone}`)
                                }}
                                className="text-slate-400 hover:text-blue-500 transition-colors">
                                <Phone className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                              {config.label}
                            </span>
                          </td>

                          {/* Guardian */}
                          <td className="px-3 py-2.5">
                            <p className="text-sm text-slate-700 font-medium truncate max-w-[140px]">
                              {student.guardianName ?? '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {student.guardianPhone ?? ''}
                            </p>
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {format(new Date(student.createdAt), 'd MMM')}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => handleActionClick(e, student.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Empty placeholder rows */}
                    {Array.from({ length: emptyRowCount }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-slate-100 border-l-2 border-l-transparent">
                        <td colSpan={8} className="px-3 py-2.5 h-[52px]" />
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500 flex-shrink-0">
              {total === 0
                ? 'No students found'
                : `Showing ${(page - 1) * 25 + 1}–${Math.min(
                    page * 25,
                    total
                  )} of ${total} students`
              }
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Previous
              </button>
              <span className="w-8 h-8 flex items-center justify-center bg-[#1565D8] text-white text-sm font-semibold rounded-lg">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION PORTAL MENU ── */}
      {actionMenuId && typeof window !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActionMenuId(null)}
            />
            {/* Menu */}
            <div
              className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-40"
              style={{
                top: menuPosition.top,
                left: menuPosition.left
              }}>
              <button
                onClick={() => {
                  router.push(`/student-management/${actionMenuId}`)
                  setActionMenuId(null)
                }}
                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors">
                View
              </button>
              <button
                onClick={() => {
                  router.push(`/student-management/${actionMenuId}/edit`)
                  setActionMenuId(null)
                }}
                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors">
                Edit
              </button>
              <button
                onClick={() => handleDelete(actionMenuId)}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          </>,
          document.body
        )
      }

    </div>
  )
}
