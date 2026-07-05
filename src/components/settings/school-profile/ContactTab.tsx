"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]'
const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500'

export type ContactValues = {
  address1: string
  address2: string
  city: string
  state: string
  pincode: string
  mapsLink: string
  phone: string
  phoneSecondary: string
  email: string
  website: string
}

type ContactTabProps = {
  values: ContactValues
  onChange: (field: keyof ContactValues, value: string) => void
  onSave: (e: React.FormEvent) => void
  saving: boolean
}

export default function ContactTab({ values, onChange, onSave, saving }: ContactTabProps) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Location & Contact Channels</h3>
        <p className="text-xs text-slate-400">Provide official address details and primary customer touchpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <label className={labelCls}>Address Line 1</label>
          <input type="text" required value={values.address1}
            onChange={(e) => onChange('address1', e.target.value)} placeholder="Door No, Street Name, Locality" className={inputCls} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className={labelCls}>Address Line 2 (Optional)</label>
          <input type="text" value={values.address2}
            onChange={(e) => onChange('address2', e.target.value)} placeholder="Area, Landmark" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>City</label>
          <input type="text" required value={values.city}
            onChange={(e) => onChange('city', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>State</label>
          <input type="text" required value={values.state}
            onChange={(e) => onChange('state', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Pincode</label>
          <input type="text" required value={values.pincode}
            onChange={(e) => onChange('pincode', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Google Maps Link</label>
          <input type="url" value={values.mapsLink}
            onChange={(e) => onChange('mapsLink', e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Primary Phone</label>
          <input type="tel" required value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)} placeholder="10-digit number" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Secondary Phone</label>
          <input type="tel" value={values.phoneSecondary}
            onChange={(e) => onChange('phoneSecondary', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className={labelCls}>Primary Email</label>
          <input type="email" required value={values.email}
            onChange={(e) => onChange('email', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <label className={labelCls}>Website URL</label>
          <input type="url" value={values.website}
            onChange={(e) => onChange('website', e.target.value)} placeholder="https://myschool.edu" className={inputCls} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Location & Contacts</span>
          )}
        </Button>
      </div>
    </form>
  )
}
