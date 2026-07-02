'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, MapPin, ExternalLink, HelpCircle } from 'lucide-react'
import {
  INSTITUTION_CONFIG,
  type InstitutionType,
} from '@/constants/institutionConfig'

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

const popularCities = ['Chennai', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Pune', 'Kolkata']

export default function OnboardingStep2() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // School info for search maps query fallback
  const [schoolName, setSchoolName] = useState('')
  const [institutionType, setInstitutionType] = useState('SCHOOL')
  const config = INSTITUTION_CONFIG[
    institutionType as InstitutionType
  ] ?? INSTITUTION_CONFIG['SCHOOL']

  // Form Fields
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('Chennai')
  const [state, setState] = useState('Tamil Nadu')
  const [pincode, setPincode] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  
  const [phone, setPhone] = useState('')
  const [phoneSecondary, setPhoneSecondary] = useState('')
  const [website, setWebsite] = useState('')
  const [officeHours, setOfficeHours] = useState('Mon-Fri: 8 AM to 4 PM')

  useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          const s = data.school
          setSchoolName(s.name || '')
          if (s.institutionType) {
            setInstitutionType(s.institutionType)
          }

          if (s.locations && s.locations.length > 0) {
            const loc = s.locations.find((l: any) => l.isPrimary) || s.locations[0]
            if (loc.addressLine) {
              const parts = loc.addressLine.split(', ')
              setAddress1(parts[0] || '')
              setAddress2(parts.slice(1).join(', ') || '')
            }
            setCity(loc.city || 'Chennai')
            setState(loc.state || 'Tamil Nadu')
            setPincode(loc.pincode || '')
          }

          if (s.contacts && s.contacts.length > 0) {
            const ph = s.contacts.find((c: any) => c.type === 'phone')
            const ph2 = s.contacts.find((c: any) => c.type === 'phone_secondary')
            const web = s.contacts.find((c: any) => c.type === 'website')
            const hrs = s.contacts.find((c: any) => c.type === 'office_hours')
            const map = s.contacts.find((c: any) => c.type === 'maps_link')

            if (ph) setPhone(ph.value)
            if (ph2) setPhoneSecondary(ph2.value)
            if (web) setWebsite(web.value)
            if (hrs) setOfficeHours(hrs.value)
            if (map) setMapsLink(map.value)
          }
        }
      })
      .catch((err) => console.error('Error pre-filling onboarding form:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!address1 || !city || !state || !pincode || !phone) {
      setError('Please fill in all required fields')
      return
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError('Pincode must be exactly 6 digits')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/v1/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          data: {
            address1,
            address2,
            city,
            state,
            pincode,
            mapsLink,
            phone,
            phoneSecondary,
            website,
            officeHours
          }
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save location details')
      }

      router.push('/onboarding/step/3')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getVerifyMapsUrl = () => {
    if (mapsLink) return mapsLink
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolName + ' ' + address1 + ' ' + city)}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Loading location...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800">{config.locationHeading}</h2>
          <p className="text-sm text-slate-500">Provide address and contact information for parents</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form id="step-2-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Address 1 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="Street address, building name"
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>

          {/* Address 2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Address Line 2 <span className="text-slate-400 font-medium">(Optional)</span>
            </label>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Area, locality or landmark"
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* City Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                City <span className="text-red-500">*</span>
              </label>
              <input
                list="cities"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                required
              />
              <datalist id="cities">
                {popularCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* State Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                required
              >
                {indianStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Pincode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit pincode"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Google Maps Link */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                Google Maps Link <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
            </div>
            <input
              type="url"
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
            />
            <span className="text-[10px] text-slate-400 font-medium block">
              Paste your Google Maps URL here to link it directly on your profile.
            </span>
          </div>

          {/* Location Preview Card */}
          {city && pincode.length === 6 && (
            <div className="bg-blue-50/30 rounded-2xl border border-blue-50 p-4 flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100/60 rounded-xl flex items-center justify-center text-[#1565D8] flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 text-xs sm:text-sm block">Location Preview Map</span>
                  <span className="text-slate-400 text-[11px] block">
                    Your location at {city} ({pincode}) will show on your profile map.
                  </span>
                </div>
              </div>
              <a
                href={getVerifyMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-1 select-none flex-shrink-0"
              >
                <span>Verify on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Contact Details Header */}
          <div className="border-t border-slate-100 pt-5 mt-5">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Institution Contact Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Primary Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500 font-semibold select-none text-sm border-r border-slate-200 pr-3">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="Primary contact phone"
                  className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Secondary Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Secondary Phone <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-500 font-semibold select-none text-sm border-r border-slate-200 pr-3">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="Secondary contact phone"
                  className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Website URL <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={`e.g. https://www.${config.genericLabel.toLowerCase()}.edu`}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              />
            </div>
          </div>

          {/* Office Hours */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Office / Operating Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              placeholder="e.g. Mon-Fri: 8 AM to 4 PM"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>
        </form>
      </div>

      {/* Bottom Nav Bar */}
      <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
        <button
          onClick={() => router.push('/onboarding/step/1')}
          type="button"
          className="px-5 py-2.5 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer select-none"
        >
          ← Back
        </button>

        <button
          type="submit"
          form="step-2-form"
          disabled={saving}
          className="px-6 py-2.5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save & Continue</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
