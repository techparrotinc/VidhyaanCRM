'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Loader2, Plus, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'

type SubjectRow = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  slotCount: number
}

// Suggestions for schools starting fresh (same set the backfill seeds).
const SUGGESTIONS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer', 'Art', 'PE']

const label = 'text-[11px] font-bold uppercase tracking-widest text-slate-500'
const input =
  'h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30'

export default function SubjectsSettingsPage() {
  const confirm = useConfirm()
  const [subjects, setSubjects] = useState<SubjectRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/v1/settings/subjects')
      .then(r => r.json())
      .then(json => setSubjects(json?.data?.subjects ?? []))
      .catch(() => setSubjects([]))
  }, [])
  useEffect(load, [load])

  const existingNames = new Set((subjects ?? []).map(s => s.name.toLowerCase()))
  const suggestions = SUGGESTIONS.filter(s => !existingNames.has(s.toLowerCase()))

  const apiError = (json: any, fallback: string) => {
    const details = json?.details
    const firstDetail =
      details && typeof details === 'object'
        ? (Object.values(details).flat()[0] as string | undefined)
        : undefined
    return firstDetail || json?.error || fallback
  }

  const addSubject = async (name: string) => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/settings/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(apiError(json, 'Could not add subject'))
        return
      }
      setNewName('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const deleteSubject = async (row: SubjectRow) => {
    const okDelete = await confirm({
      title: `Remove "${row.name}"?`,
      message:
        row.slotCount > 0
          ? `${row.slotCount} timetable period${row.slotCount > 1 ? 's' : ''} still use this subject. Removing it only drops it from the dropdown — existing periods keep the name.`
          : 'This removes the subject from the dropdown. Existing periods keep their name.',
      confirmLabel: 'Remove',
      variant: 'danger'
    })
    if (!okDelete) return
    setBusyId(row.id)
    try {
      await fetch(`/api/v1/settings/subjects/${row.id}`, { method: 'DELETE' })
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subjects</h1>
        <p className="text-sm text-slate-500 mt-1">
          Subjects that power the timetable subject dropdown. Records store the subject name as text — this list only
          drives the picker, so removing a subject never changes existing periods.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Add subject */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <label className={label}>Add a subject</label>
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject(newName)}
              placeholder="e.g. Mathematics"
              className={`${input} flex-1`}
            />
            <Button
              onClick={() => addSubject(newName)}
              disabled={saving || !newName.trim()}
              className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-slate-400 mr-1">Quick add:</span>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => addSubject(s)}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:border-[#1565D8] hover:text-[#1565D8] transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {subjects === null ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No subjects yet. Add one above or use quick-add.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map(row => (
                <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{row.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {row.slotCount} timetable period{row.slotCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSubject(row)}
                    disabled={busyId === row.id}
                    className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition disabled:opacity-50"
                  >
                    {busyId === row.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
