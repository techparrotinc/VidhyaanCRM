"use client"

import React, { useState, useEffect } from 'react'
import {
  CalendarDays,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AcademicYear {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
}

export default function AcademicYearSettingsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add year form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('ACADEMIC')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [adding, setAdding] = useState(false)

  // Toast notifier state
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/v1/settings/academic-year')
      if (!res.ok) throw new Error('Failed to fetch academic years')
      const json = await res.json()
      setYears(json.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error loading academic years')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchYears()
  }, [])

  const triggerToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 4000)
  }

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) return

    setAdding(true)
    try {
      const res = await fetch('/api/v1/settings/academic-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          startDate,
          endDate,
          isCurrent
        })
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed to create academic year')
      }

      triggerToast('Academic year created successfully')
      setName('')
      setType('ACADEMIC')
      setStartDate('')
      setEndDate('')
      setIsCurrent(false)
      setShowAddForm(false)
      await fetchYears()
    } catch (err: any) {
      alert(err.message || 'Could not create academic year')
    } finally {
      setAdding(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchYears} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Academic Years</h3>
          <p className="text-sm text-slate-500">Configure school terms, financial cycles, and current workspace periods.</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="space-y-3">
          {years.map((year) => {
            const isActive = year.status === 'ACTIVE'
            const isClosed = year.status === 'CLOSED'
            return (
              <div
                key={year.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-[#1565D8] rounded-lg shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {year.name}
                      {isActive && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          Current Active
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 uppercase font-semibold tracking-wider">
                      Type: {year.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-10 sm:ml-0">
                  <div className="text-xs font-medium text-slate-500 text-right">
                    <div>Start: {formatDate(year.startDate)}</div>
                    <div>End: {formatDate(year.endDate)}</div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                    isActive 
                      ? 'bg-green-100 text-green-700' 
                      : isClosed
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {year.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Form / Collapsible Section */}
        <div className="mt-6 border-t border-slate-200 pt-6">
          {showAddForm ? (
            <form onSubmit={handleAddYear} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-850">New Academic Year</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Year Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AY 2026-27"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-[#1565D8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-[#1565D8]"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="CALENDAR">CALENDAR</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-[#1565D8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-[#1565D8]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="setCurrent"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8]"
                />
                <label htmlFor="setCurrent" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  Set as current year (deactivates previous years)
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={adding || !name.trim() || !startDate || !endDate}
                  className={`bg-[#1565D8] text-white hover:bg-blue-700 disabled:opacity-50 ${adding ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {adding ? (
                    <>
                      <Loader2 className="animate-spin size-4 mr-2" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Academic Year</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="border border-slate-200 bg-white text-[#1565D8] hover:bg-blue-50 font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Academic Year
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
