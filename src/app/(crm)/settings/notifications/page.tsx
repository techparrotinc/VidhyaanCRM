"use client"

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  CheckCircle2,
  Save,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Preference {
  eventType: string
  emailEnabled: boolean
  whatsappEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
}

const EVENTS = [
  { type: 'LEAD_RECEIVED', label: 'New lead received', category: 'leads' },
  { type: 'LEAD_FOLLOWUP_DUE', label: 'Follow-up due', category: 'leads' },
  { type: 'LEAD_CONVERTED', label: 'Lead converted to admission', category: 'leads' },
  { type: 'ADMISSION_STAGE_CHANGED', label: 'Stage changed', category: 'admissions' },
  { type: 'DOCUMENT_UPLOADED', label: 'Document uploaded', category: 'admissions' },
  { type: 'INTERVIEW_REMINDER', label: 'Interview reminder', category: 'admissions' },
  { type: 'FEE_PAYMENT_RECEIVED', label: 'Payment received', category: 'fees' },
  { type: 'FEE_OVERDUE', label: 'Fee overdue', category: 'fees' },
  { type: 'FEE_REMINDER', label: 'Fee reminder', category: 'fees' },
  { type: 'EVENT_RSVP_RECEIVED', label: 'Event RSVP received', category: 'events' },
  { type: 'EVENT_CANCELLED', label: 'Event cancelled', category: 'events' },
  { type: 'PROFILE_APPROVED', label: 'Profile approved', category: 'system' },
  { type: 'TRIAL_ENDING', label: 'Trial ending', category: 'system' },
  { type: 'PAYMENT_FAILED', label: 'Payment failed', category: 'system' }
]

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [whatsappModuleEnabled, setWhatsappModuleEnabled] = useState(true) // assume enabled during trial

  // Toast notifier state
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false })

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/v1/settings/notifications')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      const json = await res.json()
      
      const dbPrefs = json.data ?? []
      
      // Initialize full list of events with database values or defaults
      const mergedPrefs = EVENTS.map((evt) => {
        const existing = dbPrefs.find((p: any) => p.eventType === evt.type)
        return {
          eventType: evt.type,
          emailEnabled: existing ? existing.emailEnabled : true,
          whatsappEnabled: existing ? existing.whatsappEnabled : false,
          smsEnabled: existing ? existing.smsEnabled : false,
          inAppEnabled: existing ? existing.inAppEnabled : true
        }
      })
      
      setPreferences(mergedPrefs)
    } catch (err: any) {
      setError(err.message || 'Error loading preferences')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  const triggerToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: '', show: false }), 4000)
  }

  const handleToggle = (type: string, channel: keyof Preference) => {
    setPreferences(prev =>
      prev.map(pref => {
        if (pref.eventType === type) {
          return {
            ...pref,
            [channel]: !pref[channel]
          }
        }
        return pref
      })
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })

      if (!res.ok) throw new Error('Failed to save preferences')
      
      triggerToast('Preferences saved successfully')
      await fetchPreferences()
    } catch (err: any) {
      alert(err.message || 'Could not save preferences')
    } finally {
      setSaving(false)
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
        <Button onClick={fetchPreferences} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
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
          <h3 className="text-lg font-bold text-slate-950">Notification Preferences</h3>
          <p className="text-sm text-slate-500">Configure alert channels for leads, admissions, fees, and trial changes.</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 pl-2">Notification Event</th>
                <th className="pb-3 text-center">Email</th>
                <th className="pb-3 text-center">WhatsApp</th>
                <th className="pb-3 text-center">In-App</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((evt) => {
                const pref = preferences.find(p => p.eventType === evt.type)
                if (!pref) return null

                return (
                  <tr key={evt.type} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pl-2 font-medium text-slate-800">
                      <div>{evt.label}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{evt.category}</div>
                    </td>
                    
                    {/* Email Toggle */}
                    <td className="py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.emailEnabled}
                        onChange={() => handleToggle(evt.type, 'emailEnabled')}
                        className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer"
                      />
                    </td>

                    {/* WhatsApp Toggle */}
                    <td className="py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.whatsappEnabled}
                        onChange={() => handleToggle(evt.type, 'whatsappEnabled')}
                        disabled={!whatsappModuleEnabled}
                        className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={!whatsappModuleEnabled ? 'WhatsApp module is disabled' : undefined}
                      />
                    </td>

                    {/* In-App Toggle */}
                    <td className="py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.inAppEnabled}
                        onChange={() => handleToggle(evt.type, 'inAppEnabled')}
                        className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold flex items-center gap-2 rounded-lg text-sm px-6 py-2.5 h-auto shadow-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
