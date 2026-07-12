'use client'

import { useCallback, useEffect, useState } from 'react'
import { GraduationCap, Loader2, Plus, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { GRADE_LABEL_OPTIONS } from '@/constants/grades'

type SectionRow = { id: string; name: string; capacity: number | null; studentCount: number }
type ClassRow = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  studentCount: number
  sections: SectionRow[]
}

const label = 'text-[11px] font-bold uppercase tracking-widest text-slate-500'
const input =
  'h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30'

export default function ClassesSettingsPage() {
  const confirm = useConfirm()
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add-class form
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  // Per-class add-section input
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({})
  const [busyClassId, setBusyClassId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/v1/settings/classes')
      .then(r => r.json())
      .then(json => setClasses(json?.data?.classes ?? []))
      .catch(() => setClasses([]))
  }, [])
  useEffect(load, [load])

  const existingNames = new Set((classes ?? []).map(c => c.name.toLowerCase()))
  const suggestions = GRADE_LABEL_OPTIONS.filter(g => !existingNames.has(g.toLowerCase()))

  const apiError = async (res: Response, json: any, fallback: string) => {
    const details = json?.details
    const firstDetail =
      details && typeof details === 'object'
        ? (Object.values(details).flat()[0] as string | undefined)
        : undefined
    return firstDetail || json?.error || fallback
  }

  const addClass = async (name: string) => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/v1/settings/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(await apiError(res, json, 'Failed to add class'))
      return
    }
    setNewName('')
    load()
  }

  const addSection = async (cls: ClassRow) => {
    const draft = (sectionDrafts[cls.id] ?? '').trim()
    if (!draft) return
    setBusyClassId(cls.id)
    setError(null)
    const res = await fetch(`/api/v1/settings/classes/${cls.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addSections: [draft] })
    })
    const json = await res.json()
    setBusyClassId(null)
    if (!res.ok || !json.success) {
      setError(await apiError(res, json, 'Failed to add section'))
      return
    }
    setSectionDrafts(prev => ({ ...prev, [cls.id]: '' }))
    load()
  }

  const removeSection = async (cls: ClassRow, section: SectionRow) => {
    if (section.studentCount > 0) {
      setError(`Section ${section.name} has ${section.studentCount} student(s). Move them first.`)
      return
    }
    const okToRemove = await confirm({
      title: `Remove section ${section.name}?`,
      message: `${cls.name} — ${section.name} will no longer appear in dropdowns.`,
      confirmLabel: 'Remove'
    })
    if (!okToRemove) return
    setError(null)
    const res = await fetch(`/api/v1/settings/classes/${cls.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeSectionIds: [section.id] })
    })
    const json = await res.json()
    if (!res.ok || !json.success) setError(await apiError(res, json, 'Failed to remove section'))
    load()
  }

  const removeClass = async (cls: ClassRow) => {
    if (cls.studentCount > 0) {
      setError(`${cls.name} has ${cls.studentCount} active student(s). Move or promote them first.`)
      return
    }
    const okToRemove = await confirm({
      title: `Delete ${cls.name}?`,
      message: 'The class and its sections will no longer appear in dropdowns. Existing records are not affected.',
      confirmLabel: 'Delete'
    })
    if (!okToRemove) return
    setError(null)
    const res = await fetch(`/api/v1/settings/classes/${cls.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) setError(await apiError(res, json, 'Failed to delete class'))
    load()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-[#1565D8]" />
          Classes &amp; Sections
        </h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          The classes you define here power every class and section dropdown — leads, admissions,
          students, fee plans and attendance.
        </p>
      </div>

      {/* Add class */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className={label}>Add class</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addClass(newName) }}
              placeholder="e.g. Class 5 or custom name"
              className={`${input} w-64`}
            />
            <Button
              onClick={() => addClass(newName)}
              disabled={saving || !newName.trim()}
              className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 12).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => addClass(g)}
                  disabled={saving}
                  className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 hover:border-[#1565D8] hover:text-[#1565D8] transition-colors"
                >
                  + {g}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Class list */}
      {classes === null ? (
        <Skeleton className="h-64 w-full" />
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">No classes defined yet</p>
            <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
              Add the classes your school runs — use the quick suggestions above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => (
            <Card key={cls.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-bold text-slate-900">{cls.name}</p>
                    <p className="text-xs font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users className="h-3.5 w-3.5" />
                      {cls.studentCount} student{cls.studentCount === 1 ? '' : 's'}
                    </p>
                  </div>

                  {/* Section chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cls.sections.map(s => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1.5 py-1 text-xs font-semibold text-slate-700"
                        title={`${s.studentCount} student(s)`}
                      >
                        {s.name}
                        <span className="text-slate-400 font-normal">{s.studentCount}</span>
                        <button
                          type="button"
                          onClick={() => removeSection(cls, s)}
                          className="rounded-full p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={sectionDrafts[cls.id] ?? ''}
                      onChange={e => setSectionDrafts(prev => ({ ...prev, [cls.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addSection(cls) }}
                      placeholder="+ Section"
                      className="h-7 w-24 rounded-full border border-dashed border-slate-300 px-3 text-xs focus:outline-none focus:border-[#1565D8]"
                      disabled={busyClassId === cls.id}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeClass(cls)}
                    className="text-slate-300 hover:text-red-500 ml-auto sm:ml-0"
                    title="Delete class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs font-normal text-slate-400">
        Sections are optional — schools without sections can mark attendance and manage fees at
        class level. Student records keep their class as text, so renaming a class here does not
        rename existing students.
      </p>
    </div>
  )
}
