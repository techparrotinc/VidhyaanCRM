'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, Copy, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { isLearningCentre } from '@/lib/institution'
import { DeviceIdentitiesDialog } from '@/components/attendance/DeviceIdentitiesDialog'

type AttendanceSettings = {
  workingDays: number[]
  absenceAlerts: { enabled: boolean; portal: boolean; whatsapp: boolean; sms: boolean }
  autoMarkOnline: boolean
}
type Holiday = { id: string; date: string; name: string; source?: string }
type Assignment = {
  id: string
  gradeLabel: string | null
  section: string | null
  teacher: { id: string; name: string }
  course: { id: string; name: string } | null
  batch: { id: string; name: string } | null
}
type Device = {
  id: string
  name: string
  vendor: string | null
  apiKeyPrefix: string
  isActive: boolean
  lastSeenAt: string | null
  _count: { identities: number }
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // ISO 1..7

const label = 'text-[11px] font-bold uppercase tracking-widest text-slate-500'
const input =
  'mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-[#1565D8]' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function AttendanceSettingsPage() {
  const confirm = useConfirm()
  const [isLC, setIsLC] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setIsLC(isLearningCentre(json?.data?.institutionType)))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-[#1565D8]" />
          Attendance
        </h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          Working days, holidays, teacher assignments, absence alerts and biometric devices.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="teachers">Teacher Assignments</TabsTrigger>
          <TabsTrigger value="devices">Biometric Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="holidays"><HolidaysTab confirm={confirm} /></TabsContent>
        <TabsContent value="teachers"><TeachersTab confirm={confirm} isLC={isLC} /></TabsContent>
        <TabsContent value="devices"><DevicesTab confirm={confirm} /></TabsContent>
      </Tabs>
    </div>
  )
}

function GeneralTab() {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/attendance')
      .then(r => r.json())
      .then(json => setSettings(json?.data?.settings ?? null))
      .catch(() => {})
  }, [])

  if (!settings) return <Skeleton className="h-64 w-full mt-4" />

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/v1/settings/attendance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const toggleDay = (day: number) => {
    setSettings(s =>
      s
        ? {
            ...s,
            workingDays: s.workingDays.includes(day)
              ? s.workingDays.filter(d => d !== day)
              : [...s.workingDays, day].sort()
          }
        : s
    )
  }

  const alerts = settings.absenceAlerts

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className={label}>Working days</p>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAY_LABELS.map((name, i) => {
              const day = i + 1
              const active = settings.workingDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-10 px-4 rounded-lg border text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#1565D8] text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
          <p className="text-xs font-normal text-slate-400">
            Non-working days show a notice on the register but can still be marked.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Absence alerts to guardians</p>
              <p className="text-sm font-normal leading-relaxed text-slate-500">
                When a student is marked absent for today, notify their guardian automatically.
              </p>
            </div>
            <Toggle
              checked={alerts.enabled}
              onChange={v => setSettings({ ...settings, absenceAlerts: { ...alerts, enabled: v } })}
            />
          </div>
          {alerts.enabled && (
            <div className="space-y-3 pl-1 border-l-2 border-slate-100 ml-1">
              {(
                [
                  ['portal', 'Parent portal + email notification', 'Free'],
                  ['whatsapp', 'WhatsApp message', 'Uses messaging credits; needs an approved Attendance template'],
                  ['sms', 'SMS', 'Uses messaging credits']
                ] as const
              ).map(([key, title, help]) => (
                <div key={key} className="flex items-center justify-between pl-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{title}</p>
                    <p className="text-xs font-normal text-slate-400">{help}</p>
                  </div>
                  <Toggle
                    checked={alerts[key]}
                    onChange={v => setSettings({ ...settings, absenceAlerts: { ...alerts, [key]: v } })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Auto-mark online sessions</p>
            <p className="text-sm font-normal leading-relaxed text-slate-500">
              Provision for online-class integrations: students who join an online session get marked present automatically.
            </p>
          </div>
          <Toggle
            checked={settings.autoMarkOnline}
            onChange={v => setSettings({ ...settings, autoMarkOnline: v })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end items-center gap-3">
        {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
        <Button onClick={save} disabled={saving} className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save settings
        </Button>
      </div>
    </div>
  )
}

function HolidaysTab({ confirm }: { confirm: ReturnType<typeof useConfirm> }) {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nationalEnabled, setNationalEnabled] = useState<boolean | null>(null)
  const [togglingNational, setTogglingNational] = useState(false)

  const load = useCallback(() => {
    fetch('/api/v1/settings/attendance/holidays')
      .then(r => r.json())
      .then(json => {
        setHolidays(json?.data?.holidays ?? [])
        setNationalEnabled(json?.data?.nationalEnabled ?? false)
      })
      .catch(() => setHolidays([]))
  }, [])
  useEffect(load, [load])

  const toggleNational = async () => {
    if (nationalEnabled === null || togglingNational) return
    const target = !nationalEnabled
    if (!target) {
      const okToDisable = await confirm({
        title: 'Turn off national holidays?',
        message: 'Upcoming national holidays (Republic Day, Independence Day, Gandhi Jayanti, Christmas) will be removed from the holiday calendar. Past dates are kept.',
        confirmLabel: 'Turn off'
      })
      if (!okToDisable) return
    }
    setTogglingNational(true)
    const res = await fetch('/api/v1/settings/attendance/holidays', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalEnabled: target })
    })
    setTogglingNational(false)
    if (res.ok) {
      setNationalEnabled(target)
      load()
    }
  }

  const add = async () => {
    if (!name || !from) return
    setSaving(true)
    setError(null)
    const fromDate = from.slice(0, 10)
    const toDate = to ? to.slice(0, 10) : ''
    const body =
      toDate && toDate !== fromDate
        ? { name, range: { from: fromDate, to: toDate } }
        : { name, date: fromDate }
    const res = await fetch('/api/v1/settings/attendance/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to add holiday')
      return
    }
    setName('')
    setFrom('')
    setTo('')
    load()
  }

  const remove = async (h: Holiday) => {
    const okToDelete = await confirm({
      title: 'Remove holiday?',
      message: `${h.name} on ${h.date} will no longer block attendance marking.`,
      confirmLabel: 'Remove'
    })
    if (!okToDelete) return
    await fetch(`/api/v1/settings/attendance/holidays/${h.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">National holidays</p>
            <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
              Auto-adds Republic Day, Independence Day, Gandhi Jayanti and Christmas each year.
              Festival holidays (Diwali, Holi, Eid…) vary by date — add them below.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!nationalEnabled}
            onClick={toggleNational}
            disabled={nationalEnabled === null || togglingNational}
            className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              nationalEnabled ? 'bg-[#1565D8]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                nationalEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-44">
              <label className={label}>Holiday name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali" className={input} />
            </div>
            <div className="w-48">
              <label className={label}>Date / from</label>
              <div className="mt-1">
                <DateTimePicker value={from} onChange={setFrom} dateOnly placeholder="Pick date" />
              </div>
            </div>
            <div className="w-48">
              <label className={label}>To (optional)</label>
              <div className="mt-1">
                <DateTimePicker value={to} onChange={setTo} dateOnly placeholder="Same day" />
              </div>
            </div>
            <Button onClick={add} disabled={saving || !name || !from} className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </div>
          {error && <p className="text-sm font-medium text-red-600 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {holidays === null ? (
        <Skeleton className="h-40 w-full" />
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm font-normal leading-relaxed text-slate-500">
            No holidays configured yet. Holidays block attendance marking and are excluded from attendance percentages.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="divide-y divide-slate-100">
              {holidays.map(h => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      {h.name}
                      {h.source === 'NATIONAL' && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#1565D8]">
                          National
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-normal text-slate-400">
                      {new Date(`${h.date}T00:00:00`).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button type="button" onClick={() => remove(h)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TeachersTab({ confirm, isLC }: { confirm: ReturnType<typeof useConfirm>; isLC: boolean }) {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([])

  const [teacherId, setTeacherId] = useState('')
  const [targetType, setTargetType] = useState<'grade' | 'course' | 'batch'>(isLC ? 'course' : 'grade')
  const [grade, setGrade] = useState('')
  const [section, setSection] = useState('')
  const [targetId, setTargetId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setTargetType(isLC ? 'course' : 'grade'), [isLC])

  const load = useCallback(() => {
    fetch('/api/v1/settings/attendance/teacher-assignments')
      .then(r => r.json())
      .then(json => setAssignments(json?.data?.assignments ?? []))
      .catch(() => setAssignments([]))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    fetch('/api/v1/users')
      .then(r => r.json())
      .then(json => {
        const users = json?.data ?? []
        setTeachers(users.filter((u: any) => u.role === 'TEACHER' && u.status === 'ACTIVE'))
      })
      .catch(() => {})
    fetch('/api/v1/attendance/options?source=grades')
      .then(r => r.json())
      .then(json => setGrades(json?.data?.options ?? []))
      .catch(() => {})
    fetch('/api/v1/attendance/options?source=courses')
      .then(r => r.json())
      .then(json => setCourses(json?.data?.options ?? []))
      .catch(() => {})
    fetch('/api/v1/attendance/options?source=batches')
      .then(r => r.json())
      .then(json => setBatches(json?.data?.options ?? []))
      .catch(() => {})
  }, [])

  const add = async () => {
    setSaving(true)
    setError(null)
    const body: any = { teacherId }
    if (targetType === 'grade') {
      body.gradeLabel = grade
      if (section) body.section = section
    } else if (targetType === 'course') {
      body.courseId = targetId
    } else {
      body.batchId = targetId
    }
    const res = await fetch('/api/v1/settings/attendance/teacher-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to add assignment')
      return
    }
    setGrade('')
    setSection('')
    setTargetId('')
    load()
  }

  const remove = async (a: Assignment) => {
    const okToDelete = await confirm({
      title: 'Remove assignment?',
      message: `${a.teacher.name} will no longer be able to mark this class.`,
      confirmLabel: 'Remove'
    })
    if (!okToDelete) return
    await fetch(`/api/v1/settings/attendance/teacher-assignments/${a.id}`, { method: 'DELETE' })
    load()
  }

  const canAdd =
    !!teacherId && (targetType === 'grade' ? !!grade : !!targetId)

  const targetLabel = (a: Assignment) =>
    a.course?.name ??
    a.batch?.name ??
    `${a.gradeLabel}${a.section ? ` — ${a.section}` : ' (all sections)'}`

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56">
              <label className={label}>Teacher</label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className={label}>Assign to</label>
              <Select value={targetType} onValueChange={v => { setTargetType(v as any); setTargetId(''); setGrade(''); setSection('') }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                  {!isLC && <SelectItem value="grade">Class</SelectItem>}
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType === 'grade' ? (
              <>
                <div className="w-44">
                  <label className={label}>Class</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                      {grades.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-36">
                  <label className={label}>Section (optional)</label>
                  <input value={section} onChange={e => setSection(e.target.value)} placeholder="All sections" className={input} />
                </div>
              </>
            ) : (
              <div className="w-56">
                <label className={label}>{targetType === 'course' ? 'Course' : 'Batch'}</label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Select ${targetType}`} />
                  </SelectTrigger>
                  <SelectContent usePortal className="!w-max !min-w-[12rem] max-w-[320px]">
                    {(targetType === 'course' ? courses : batches).map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={add} disabled={saving || !canAdd} className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Assign
            </Button>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <p className="text-xs font-normal text-slate-400">
            Teachers can mark attendance only for their assigned classes. Admins can always mark any class.
          </p>
        </CardContent>
      </Card>

      {assignments === null ? (
        <Skeleton className="h-40 w-full" />
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm font-normal leading-relaxed text-slate-500">
            No teacher assignments yet. Until a teacher is assigned, only admins can mark attendance.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="divide-y divide-slate-100">
              {assignments.map(a => (
                <div key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.teacher.name}</p>
                    <p className="text-xs font-normal text-slate-400">{targetLabel(a)}</p>
                  </div>
                  <button type="button" onClick={() => remove(a)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DevicesTab({ confirm }: { confirm: ReturnType<typeof useConfirm> }) {
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [name, setName] = useState('')
  const [vendor, setVendor] = useState('')
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mappingDevice, setMappingDevice] = useState<Device | null>(null)

  const load = useCallback(() => {
    fetch('/api/v1/settings/attendance/devices')
      .then(r => r.json())
      .then(json => setDevices(json?.data?.devices ?? []))
      .catch(() => setDevices([]))
  }, [])
  useEffect(load, [load])

  const add = async () => {
    if (!name) return
    setSaving(true)
    const res = await fetch('/api/v1/settings/attendance/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, vendor: vendor || undefined })
    })
    const json = await res.json()
    setSaving(false)
    if (res.ok && json.success) {
      setNewKey(json.data.deviceKey)
      setName('')
      setVendor('')
      load()
    }
  }

  const toggleActive = async (d: Device) => {
    await fetch(`/api/v1/settings/attendance/devices/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !d.isActive })
    })
    load()
  }

  const remove = async (d: Device) => {
    const okToDelete = await confirm({
      title: 'Delete device?',
      message: `${d.name} will stop accepting punches immediately. Its identity mappings are removed too.`,
      confirmLabel: 'Delete'
    })
    if (!okToDelete) return
    await fetch(`/api/v1/settings/attendance/devices/${d.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-44">
              <label className={label}>Device name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main gate scanner" className={input} />
            </div>
            <div className="w-44">
              <label className={label}>Vendor (optional)</label>
              <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="ESSL / Realtime / …" className={input} />
            </div>
            <Button onClick={add} disabled={saving || !name} className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Register device
            </Button>
          </div>
          <p className="text-xs font-normal text-slate-400">
            Devices push punches to <code className="font-mono">/api/v1/attendance/biometric/ingest</code> with their key in
            the <code className="font-mono">x-device-key</code> header. First punch of the day marks the student present;
            manually marked statuses are never overwritten.
          </p>
        </CardContent>
      </Card>

      {devices === null ? (
        <Skeleton className="h-40 w-full" />
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm font-normal leading-relaxed text-slate-500">
            No biometric devices registered. Register a device to get its API key, then map enrolled device user IDs to students.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="divide-y divide-slate-100">
              {devices.map(d => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {d.name}
                      {!d.isActive && (
                        <span className="ml-2 text-[11px] font-semibold text-red-600">disabled</span>
                      )}
                    </p>
                    <p className="text-xs font-normal text-slate-400">
                      {d.vendor ? `${d.vendor} · ` : ''}key {d.apiKeyPrefix}… · {d._count.identities} mapped ·{' '}
                      {d.lastSeenAt
                        ? `last seen ${new Date(d.lastSeenAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
                        : 'never seen'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setMappingDevice(d)}>
                      Mappings
                    </Button>
                    <Toggle checked={d.isActive} onChange={() => toggleActive(d)} />
                    <button type="button" onClick={() => remove(d)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mappingDevice && (
        <DeviceIdentitiesDialog
          deviceId={mappingDevice.id}
          deviceName={mappingDevice.name}
          open={!!mappingDevice}
          onOpenChange={open => {
            if (!open) {
              setMappingDevice(null)
              load()
            }
          }}
        />
      )}

      <Dialog open={!!newKey} onOpenChange={open => !open && setNewKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device key created</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            Copy this key now — it is shown only once. Configure your device (or its push middleware) to send it in the{' '}
            <code className="font-mono">x-device-key</code> header.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <code className="text-xs font-mono break-all flex-1">{newKey}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newKey) navigator.clipboard.writeText(newKey)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              <Copy className="h-4 w-4 mr-1.5" />
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKey(null)} className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
