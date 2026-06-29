'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useAcademicYears } from '@/hooks/useAcademicYears'

export default function TermsSettingsPage() {
  const { years, currentYear } = useAcademicYears()

  const [selectedYearId, setSelectedYearId] = useState('')
  const [terms, setTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTerm, setEditingTerm] = useState<any | null>(null)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    order: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentYear?.id && !selectedYearId) {
      setSelectedYearId(currentYear.id)
    }
  }, [currentYear, selectedYearId])

  const fetchTerms = useCallback(async () => {
    if (!selectedYearId) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/v1/settings/terms?academicYearId=${selectedYearId}`
      )
      const data = await res.json()
      setTerms(data.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedYearId])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setError('Name, start date and end date are required')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const url = editingTerm
        ? `/api/v1/settings/terms/${editingTerm.id}`
        : '/api/v1/settings/terms'
      const method = editingTerm ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          academicYearId: selectedYearId,
          order: editingTerm ? form.order : terms.length
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Failed to save')
      }

      await fetchTerms()
      setShowForm(false)
      setEditingTerm(null)
      setForm({
        name: '',
        startDate: '',
        endDate: '',
        order: 0
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (term: any) => {
    setEditingTerm(term)
    setForm({
      name: term.name,
      startDate: term.startDate.split('T')[0],
      endDate: term.endDate.split('T')[0],
      order: term.order
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this term? This cannot be undone.')) return
    await fetch(`/api/v1/settings/terms/${id}`, { method: 'DELETE' })
    await fetchTerms()
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Academic Terms</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define your school terms for fee invoice generation.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingTerm(null)
            setForm({
              name: '',
              startDate: '',
              endDate: '',
              order: 0
            })
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Term
        </button>
      </div>

      {/* ── ACADEMIC YEAR SELECTOR ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          Academic Year
        </label>
        <select
          value={selectedYearId}
          onChange={e => setSelectedYearId(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select academic year</option>
          {years?.map((y: any) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-2">
          3 default terms are created for you. Rename or adjust dates as needed. You can also add more terms.
        </p>
      </div>

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {editingTerm ? 'Edit Term' : 'Add New Term'}
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Term Name */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Term Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Term 1"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Start Date
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                End Date
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingTerm ? 'Update Term' : 'Save Term'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingTerm(null)
                setError(null)
              }}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── TERMS LIST ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading terms...
          </div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">
              No terms configured yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add terms to enable term-based fee generation
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Term
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term, i) => (
                <tr
                  key={term.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {term.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Term {term.order}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(term.startDate), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(term.endDate), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        term.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {term.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(term)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
