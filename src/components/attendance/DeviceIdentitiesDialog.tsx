"use client"

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

type Identity = {
  id: string
  deviceUserId: string
  student: { id: string; name: string; studentCode: string }
}
type Unmatched = { deviceUserId: string; events: number; lastEventAt: string | null }
type StudentHit = { id: string; name: string; studentCode: string }

/** Map device-enrolled user ids to CRM students; shows unmatched punches. */
export function DeviceIdentitiesDialog({
  deviceId,
  deviceName,
  open,
  onOpenChange
}: {
  deviceId: string
  deviceName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [identities, setIdentities] = useState<Identity[] | null>(null)
  const [unmatched, setUnmatched] = useState<Unmatched[]>([])
  const [deviceUserId, setDeviceUserId] = useState('')
  const [search, setSearch] = useState('')
  const [hits, setHits] = useState<StudentHit[]>([])
  const [studentId, setStudentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/v1/settings/attendance/devices/${deviceId}/identities`)
      .then(r => r.json())
      .then(json => {
        setIdentities(json?.data?.identities ?? [])
        setUnmatched(json?.data?.unmatched ?? [])
      })
      .catch(() => setIdentities([]))
  }, [deviceId])

  useEffect(() => {
    if (open) {
      setDeviceUserId('')
      setSearch('')
      setStudentId('')
      setHits([])
      setError(null)
      load()
    }
  }, [open, load])

  useEffect(() => {
    if (search.trim().length < 2) {
      setHits([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/v1/students?search=${encodeURIComponent(search)}&limit=8`)
        .then(r => r.json())
        .then(json => setHits(json?.data ?? []))
        .catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [search])

  const addMapping = async () => {
    if (!deviceUserId || !studentId) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/v1/settings/attendance/devices/${deviceId}/identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceUserId, studentId })
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to map')
      return
    }
    setDeviceUserId('')
    setSearch('')
    setStudentId('')
    setHits([])
    load()
  }

  const removeMapping = async (identityId: string) => {
    await fetch(`/api/v1/settings/attendance/devices/${deviceId}/identities`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityId })
    })
    load()
  }

  const selected = hits.find(h => h.id === studentId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deviceName} — student mappings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Add mapping</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={deviceUserId}
                onChange={e => setDeviceUserId(e.target.value)}
                placeholder="Device user ID"
                className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
              <input
                value={selected ? `${selected.name} (${selected.studentCode})` : search}
                onChange={e => {
                  setStudentId('')
                  setSearch(e.target.value)
                }}
                placeholder="Search student…"
                className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
            </div>
            {hits.length > 0 && !studentId && (
              <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
                {hits.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setStudentId(h.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    {h.name} <span className="text-slate-400 text-xs">{h.studentCode}</span>
                  </button>
                ))}
              </div>
            )}
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <Button
              onClick={addMapping}
              disabled={saving || !deviceUserId || !studentId}
              size="sm"
              className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Map student
            </Button>
          </div>

          {unmatched.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Unmatched device IDs
              </p>
              <div className="space-y-1">
                {unmatched.map(u => (
                  <button
                    key={u.deviceUserId}
                    type="button"
                    onClick={() => setDeviceUserId(u.deviceUserId)}
                    className="w-full flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100"
                  >
                    <span className="font-mono text-xs">{u.deviceUserId}</span>
                    <span className="text-xs font-normal text-amber-700">{u.events} punches — click to map</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Mapped</p>
            {identities === null ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : identities.length === 0 ? (
              <p className="text-sm font-normal leading-relaxed text-slate-500">
                No mappings yet. Enrol students on the device, then map each device user ID here.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {identities.map(i => (
                  <div key={i.id} className="py-2 flex items-center justify-between">
                    <p className="text-sm text-slate-900">
                      <span className="font-mono text-xs text-slate-500">{i.deviceUserId}</span>
                      {' → '}
                      {i.student.name}{' '}
                      <span className="text-xs text-slate-400">{i.student.studentCode}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => removeMapping(i.id)}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
