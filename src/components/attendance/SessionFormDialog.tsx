"use client"

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Loader2, AlertTriangle } from 'lucide-react'

type Option = { id: string; name: string }

export function SessionFormDialog({
  open,
  onOpenChange,
  date,
  onCreated
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string // YYYY-MM-DD
  onCreated: () => void
}) {
  const [targetType, setTargetType] = useState<'course' | 'batch'>('course')
  const [targetId, setTargetId] = useState('')
  const [courses, setCourses] = useState<Option[]>([])
  const [batches, setBatches] = useState<Option[]>([])
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTargetId('')
    setTitle('')
    setStartsAt('')
    setError(null)
    setConflict(null)
    Promise.all([
      fetch('/api/v1/attendance/options?source=courses').then(r => r.json()),
      fetch('/api/v1/attendance/options?source=batches').then(r => r.json())
    ]).then(([c, b]) => {
      setCourses(c?.data?.options ?? [])
      setBatches(b?.data?.options ?? [])
    })
  }, [open])

  const options = targetType === 'course' ? courses : batches

  const handleCreate = async (force = false) => {
    if (!targetId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          [targetType === 'course' ? 'courseId' : 'batchId']: targetId,
          title: title || undefined,
          startsAt: startsAt || undefined,
          deliveryMode,
          ...(force ? { force: true } : {})
        })
      })
      const json = await res.json()
      // Double-booking warning — let the user confirm before creating a second
      // session that would double-record attendance for the same students.
      if (res.status === 409 && json.code === 'CONFLICT') {
        setConflict(json.error || 'A session already exists for this date.')
        return
      }
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create session')
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">For</label>
              <Select
                value={targetType}
                onValueChange={v => {
                  setTargetType(v as 'course' | 'batch')
                  setTargetId('')
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Mode</label>
              <Select value={deliveryMode} onValueChange={v => setDeliveryMode(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                  <SelectItem value="IN_PERSON">In person</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {targetType === 'course' ? 'Course' : 'Batch'}
            </label>
            <Select
              value={targetId}
              onValueChange={v => {
                setTargetId(v)
                setConflict(null)
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`Select ${targetType}`} />
              </SelectTrigger>
              <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                {options.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Title (optional)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Evening batch — Algebra"
              className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Starts at (optional)</label>
            <div className="mt-1">
              <DateTimePicker value={startsAt} onChange={setStartsAt} placeholder="Pick start time" />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          {conflict && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="flex items-start gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{conflict}</span>
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          {conflict ? (
            <Button
              onClick={() => handleCreate(true)}
              disabled={saving || !targetId}
              className="bg-amber-600 hover:bg-amber-700 text-sm font-semibold"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create anyway
            </Button>
          ) : (
            <Button
              onClick={() => handleCreate(false)}
              disabled={saving || !targetId}
              className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
