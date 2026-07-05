"use client"

import React, { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type ScheduleVisitModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolSlug: string
  schoolName?: string
  defaults?: { parentName?: string; phone?: string; email?: string }
}

const EMPTY = {
  parentName: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  numberOfVisitors: '1',
  notes: ''
}

export default function ScheduleVisitModal({
  open,
  onOpenChange,
  schoolSlug,
  schoolName,
  defaults,
}: ScheduleVisitModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (defaults) {
      setForm(prev => ({
        ...prev,
        parentName: defaults.parentName || prev.parentName,
        phone: defaults.phone || prev.phone,
        email: defaults.email || prev.email
      }))
    }
  }, [defaults?.parentName, defaults?.phone, defaults?.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/public/schools/${schoolSlug}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: form.parentName,
          phone: form.phone,
          email: form.email || undefined,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime || undefined,
          numberOfVisitors: form.numberOfVisitors ? parseInt(form.numberOfVisitors) : undefined,
          notes: form.notes || undefined
        })
      })
      const json = await res.json()
      if (json.success) {
        setSubmitted(true)
        setForm(prev => ({ ...prev, preferredDate: '', preferredTime: '', numberOfVisitors: '1', notes: '' }))
      } else {
        setError(json.error || 'Failed to schedule visit')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const close = () => {
    onOpenChange(false)
    setSubmitted(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSubmitted(false) }}>
      <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-805">
            Schedule Campus Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
            Request a physical campus tour at {schoolName}.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-250 mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">Visit Scheduled!</h4>
              <p className="text-xs text-slate-550 font-medium leading-relaxed max-w-xs mx-auto">
                The admissions representative from {schoolName} has been notified and will reach out to confirm your slot.
              </p>
            </div>
            <Button
              onClick={close}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto mx-auto shadow-md"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parent Name *</label>
                <input
                  type="text"
                  required
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  placeholder="Saran Kumar"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9]\d{9}"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  placeholder="9845000001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Date *</label>
                <input
                  type="date"
                  required
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Time</label>
                <input
                  type="time"
                  value={form.preferredTime}
                  onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  placeholder="parent@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Number of Visitors</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.numberOfVisitors}
                  onChange={(e) => setForm({ ...form, numberOfVisitors: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Message / Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any specific questions, classes to visit, etc."
                className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none resize-none focus:border-blue-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-bold text-xs h-auto px-4 py-2.5 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Confirm Visit'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
