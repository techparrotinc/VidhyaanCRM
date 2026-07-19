'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Users, GraduationCap, Plus, X, ArrowRight } from 'lucide-react'
import { GRADE_OPTIONS } from '@/constants/grades'
import { useCounsellors } from '@/hooks/useCounsellors'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { DatePicker } from '@/components/ui/datetime-picker'

interface Option {
  value: 'LEADS' | 'STUDENTS' | 'BOTH'
  label: string
  description: string
  icon: any
}

// User Search Icon Helper (fallback for UserSearch)
function UserSearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="1em"
      height="1em"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
      <path d="M11 8v6" />
    </svg>
  )
}

const poolOptions: Option[] = [
  {
    value: 'LEADS',
    label: 'Leads Only',
    description: 'Target leads and enquiries in your CRM',
    icon: UserSearchIcon
  },
  {
    value: 'STUDENTS',
    label: 'Students Only',
    description: 'Target active students and their guardians',
    icon: GraduationCap
  },
  {
    value: 'BOTH',
    label: 'Leads & Students',
    description: 'Target both leads and active students',
    icon: Users
  }
]

interface StepTwoProps {
  institutionType: 'SCHOOL' | 'LEARNING_CENTER'
  audiencePool: 'LEADS' | 'STUDENTS' | 'BOTH' | null
  audienceFilters: Array<{ field: string; value: string }>
  recipientCount: number
  isCountLoading: boolean
  onPoolChange: (pool: 'LEADS' | 'STUDENTS' | 'BOTH' | null) => void
  onFiltersChange: (filters: Array<{ field: string; value: string }>) => void
  onNext: () => void
  onCountChange: (count: number) => void
  onCountLoadingChange: (loading: boolean) => void
}

export function StepTwo({
  institutionType,
  audiencePool,
  audienceFilters,
  recipientCount,
  isCountLoading,
  onPoolChange,
  onFiltersChange,
  onNext,
  onCountChange,
  onCountLoadingChange
}: StepTwoProps) {
  const { counsellors } = useCounsellors()
  const { years } = useAcademicYears()
  const [courses, setCourses] = useState<any[]>([])

  // Fetch courses for learning center enrolled course filter
  useEffect(() => {
    fetch('/api/v1/settings/courses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCourses(data.data ?? [])
        }
      })
      .catch((e) => console.error('Failed to fetch courses:', e))
  }, [])

  // Fetch recipient count when pool or filters change
  useEffect(() => {
    if (!audiencePool) {
      onCountChange(0)
      return
    }

    onCountLoadingChange(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        params.set('pool', audiencePool)
        if (audienceFilters.length > 0) {
          params.set('filters', JSON.stringify(audienceFilters))
        }
        const url = `/api/v1/campaigns/audience-count?${params}`
        const res = await fetch(url)
        if (res.ok) {
          const result = await res.json()
          const count = result.data?.total ?? 0
          onCountChange(count)
        }
      } catch (e) {
        console.error('Error fetching recipient count:', e)
      } finally {
        onCountLoadingChange(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiencePool, JSON.stringify(audienceFilters)])

  const handleAddFilter = () => {
    onFiltersChange([...audienceFilters, { field: '', value: '' }])
  }

  const handleRemoveFilter = (index: number) => {
    const nextFilters = [...audienceFilters]
    nextFilters.splice(index, 1)
    onFiltersChange(nextFilters)
  }

  const handleFilterChange = (index: number, key: 'field' | 'value', val: string) => {
    const nextFilters = [...audienceFilters]
    nextFilters[index] = {
      ...nextFilters[index],
      [key]: val
    }
    // If field changes, reset value to empty
    if (key === 'field') {
      nextFilters[index].value = ''
    }
    onFiltersChange(nextFilters)
  }

  // Filter fields configuration based on pool and school/LC type
  const getFilterFields = (pool: string, type: string) => {
    const fields: Array<{ value: string; label: string }> = []
    const isSchool = type === 'SCHOOL'

    if (pool === 'LEADS') {
      fields.push({ value: 'status', label: 'Lead Status' })
      if (isSchool) {
        fields.push({ value: 'gradeSought', label: 'Grade Sought' })
      }
      fields.push({ value: 'source', label: 'Lead Source' })
      fields.push({ value: 'assignedToId', label: 'Assigned Counsellor' })
      fields.push({ value: 'dateFrom', label: 'Enquiry Date From' })
      fields.push({ value: 'dateTo', label: 'Enquiry Date To' })
    } else if (pool === 'STUDENTS') {
      if (isSchool) {
        fields.push({ value: 'gradeLabel', label: 'Grade' })
      } else {
        fields.push({ value: 'courseId', label: 'Enrolled Course' })
      }
      fields.push({ value: 'status', label: 'Student Status' })
      fields.push({ value: 'academicYearId', label: 'Academic Year' })
    } else if (pool === 'BOTH') {
      if (isSchool) {
        fields.push({ value: 'gradeLabel', label: 'Grade / Grade Sought' })
      } else {
        fields.push({ value: 'status', label: 'Status' })
      }
    }
    return fields
  }

  const renderFilterValueInput = (filter: { field: string; value: string }, index: number) => {
    if (!filter.field) {
      return (
        <input
          disabled
          placeholder="Select field first..."
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed focus:outline-none"
        />
      )
    }

    // Lead Status
    if (filter.field === 'status' && (audiencePool === 'LEADS')) {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select status...</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="FOLLOW_UP">Follow Up</option>
          <option value="CONVERTED">Converted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      )
    }

    // Student Status (or BOTH status)
    if (filter.field === 'status' && (audiencePool === 'STUDENTS' || audiencePool === 'BOTH')) {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select status...</option>
          <option value="ACTIVE">Active</option>
          <option value="ALUMNI">Alumni</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DROPPED_OUT">Dropped Out</option>
        </select>
      )
    }

    // Grades
    if (filter.field === 'gradeSought' || filter.field === 'gradeLabel') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select grade...</option>
          {GRADE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      )
    }

    // Source
    if (filter.field === 'source') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select source...</option>
          <option value="WALK_IN">Walk In</option>
          <option value="PHONE">Phone</option>
          <option value="WEBSITE">Website</option>
          <option value="REFERRAL">Referral</option>
          <option value="SOCIAL_MEDIA">Social Media</option>
          <option value="VIDHYAAN">Vidhyaan</option>
          <option value="OTHER">Other</option>
        </select>
      )
    }

    // Assigned Counsellor
    if (filter.field === 'assignedToId') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select counsellor...</option>
          {counsellors.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )
    }

    // Academic Year
    if (filter.field === 'academicYearId') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select year...</option>
          {years.map((y: any) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      )
    }

    // Course ID
    if (filter.field === 'courseId') {
      return (
        <select
          value={filter.value}
          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
          className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
        >
          <option value="">Select course...</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )
    }

    // Date From / To
    if (filter.field === 'dateFrom' || filter.field === 'dateTo') {
      return (
        <div className="flex-1 min-w-0">
          <DatePicker
            value={filter.value}
            onChange={(ymd) => handleFilterChange(index, 'value', ymd)}
            placeholder="Pick a date"
          />
        </div>
      )
    }

    return (
      <input
        value={filter.value}
        onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
        placeholder="Enter value..."
        className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
      />
    )
  }

  const poolLabel =
    audiencePool === 'LEADS'
      ? 'leads'
      : audiencePool === 'STUDENTS'
      ? 'students'
      : 'leads and students'

  const showLiveCount = audiencePool !== null

  return (
    <div className="space-y-6">
      {/* AUDIENCE POOL SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Who do you want to reach?
        </p>
        <div className="grid grid-cols-1 gap-2">
          {poolOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onPoolChange(option.value)
                onFiltersChange([])
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                audiencePool === option.value
                  ? 'border-[#1565D8] bg-[#1565D8]/5'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  audiencePool === option.value ? 'bg-[#1565D8]/10' : 'bg-slate-100'
                }`}
              >
                <option.icon
                  className={`w-4 h-4 ${
                    audiencePool === option.value ? 'text-[#1565D8]' : 'text-slate-500'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    audiencePool === option.value ? 'text-[#1565D8]' : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-xs text-slate-400">
                  {option.description}
                </p>
              </div>
              {audiencePool === option.value && (
                <CheckCircle className="w-4 h-4 text-[#1565D8] ml-auto flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BUILDER */}
      {audiencePool && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">
              Narrow your audience{' '}
              <span className="text-slate-400 font-normal ml-1">
                (optional)
              </span>
            </p>
            <button
              type="button"
              onClick={handleAddFilter}
              className="flex items-center gap-1 text-xs font-medium text-[#1565D8] hover:underline"
            >
              <Plus className="w-3 h-3" />
              Add Filter
            </button>
          </div>

          {audienceFilters.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No filters applied — campaign will reach all {poolLabel} in your CRM
            </p>
          ) : (
            <div className="space-y-2">
              {audienceFilters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  {/* Field dropdown */}
                  <select
                    value={filter.field}
                    onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                    className="flex-1 h-9 px-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]"
                  >
                    <option value="">Select field...</option>
                    {getFilterFields(audiencePool, institutionType).map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Value Input */}
                  {renderFilterValueInput(filter, index)}

                  {/* Remove filter button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIVE RECIPIENT COUNT */}
      {showLiveCount && (
        <div
          className={`flex items-center gap-2 p-3 border rounded-xl mb-6 ${
            !isCountLoading && recipientCount === 0
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-[#1565D8]/5 border-[#1565D8]/20 text-[#1565D8]'
          }`}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-semibold">
            {isCountLoading
              ? 'Calculating...'
              : recipientCount === 0
              ? 'No recipients match the selected filters'
              : `This campaign will reach ${recipientCount} recipient${
                  recipientCount !== 1 ? 's' : ''
                }`}
          </p>
        </div>
      )}

      {/* NEXT BUTTON */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!audiencePool}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1565D8] text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Content & Schedule
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
