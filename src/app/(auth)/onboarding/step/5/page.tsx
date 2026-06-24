'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowRight, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'

export default function OnboardingStep5() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status state
  const [pct, setPct] = useState(0)
  const [school, setSchool] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState('UNCLAIMED')
  const [orgStatus, setOrgStatus] = useState('ACTIVE')

  useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPct(data.profileCompletePct || 0)
          setSchool(data.school)
          setVerificationStatus(data.verificationStatus || 'UNCLAIMED')
          setOrgStatus(data.orgStatus || 'ACTIVE')
        }
      })
      .catch((err) => console.error('Error prefilling step 5:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleLaunch = async (publish: boolean) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 5,
          data: { isPublished: publish }
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      // Store flag for first dashboard visit to show welcome banner
      localStorage.removeItem('vidhyaan_welcome_banner_dismissed')
      sessionStorage.setItem('vidhyaan_show_welcome_banner', 'true')

      // Go to CRM dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Preparing launch checklists...</p>
      </div>
    )
  }

  // Determine indicator color
  const getProgressColorClass = (percent: number) => {
    if (percent >= 80) return 'text-emerald-500 border-emerald-500'
    if (percent >= 50) return 'text-amber-500 border-amber-500'
    return 'text-red-500 border-red-500'
  }

  const getProgressBgClass = (percent: number) => {
    if (percent >= 80) return 'bg-emerald-500'
    if (percent >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Pre-calculate checklist item status
  const checklist = [
    {
      label: 'School name added',
      done: !!school?.name,
      step: 1
    },
    {
      label: 'Location added',
      done: school?.locations && school.locations.some((l: any) => l.isPrimary),
      step: 2
    },
    {
      label: 'Board/curriculum added',
      done: (school?.affiliations && school.affiliations.length > 0) || !!school?.monthlyFeeMin,
      step: 3
    },
    {
      label: 'Photos added',
      done: school?.media && school.media.some((m: any) => m.caption === 'logo'),
      step: 4
    },
    {
      label: 'Fee range added',
      done: (school?.feeRanges && school.feeRanges.length > 0) || !!school?.monthlyFeeMin,
      step: 3
    },
    {
      label: 'Contact details added',
      done: school?.contacts && school.contacts.some((c: any) => c.type === 'phone'),
      step: 2
    }
  ]

  const isUnderReview = orgStatus === 'PENDING_VERIFICATION' || verificationStatus === 'PENDING'
  const isVerified = verificationStatus === 'VERIFIED' || orgStatus === 'ACTIVE'

  const location = school?.locations?.[0]
  const board = school?.affiliations?.[0]?.board
  const isLearningCenter = school?.institutionType === 'LEARNING_CENTER' || school?.institutionType === 'COACHING_CENTER'
  const detailPath = isLearningCenter ? `/learning-centers/${school?.slug}` : `/schools/${school?.slug}`

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-slate-800">You're Almost Ready! 🎉</h2>
          <p className="text-sm text-slate-500">Review your profile completion checklist before launching</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Circular Progress & Checklist */}
          <div className="space-y-5">
            {/* PROFILE COMPLETION CARD */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 flex items-center gap-6">
              {/* Circular Indicator */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-200 fill-none"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`fill-none transition-all duration-500 ${
                      pct >= 80 ? 'stroke-emerald-500' : pct >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
                    }`}
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                  />
                </svg>
                <span className="absolute text-sm font-black text-slate-800">{pct}%</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Profile Strength</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {pct >= 80
                    ? 'Excellent! Your profile is rich in details and ready to impress parents.'
                    : 'Adding more details helps you rank higher in search results.'}
                </p>
              </div>
            </div>

            {/* COMPLETION CHECKLIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completion Checklist
              </h4>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{item.done ? '✅' : '⚠️'}</span>
                      <span className={`font-semibold ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                        {item.label}
                      </span>
                    </div>
                    {!item.done && (
                      <button
                        onClick={() => router.push(`/onboarding/step/${item.step}`)}
                        className="text-[10px] font-bold text-[#1565D8] hover:underline cursor-pointer select-none"
                      >
                        Complete Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Notice Column */}
          <div className="space-y-5">
            {/* PROFILE PREVIEW */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Profile Preview
              </h4>
              
              {school && (
                <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-800 text-sm block line-clamp-1">
                        {school.name || 'My Institution'}
                      </span>
                      <span className="text-slate-400 text-[11px] block line-clamp-1">
                        {location?.addressLine ? `${location.city || ''}` : 'Location pending'}
                      </span>
                    </div>
                    {school.admissionOpen && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase shrink-0">
                        Open
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {board || school.institutionType.toLowerCase().replace('_', ' ')}
                    </span>
                    <a
                      href={detailPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
                    >
                      <span>Preview Full Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* WHAT HAPPENS NEXT */}
            <div className="bg-white rounded-2xl border-l-4 border-l-[#1565D8] border border-slate-100 p-4 space-y-2.5 shadow-sm">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                After you go live
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#1565D8] font-bold select-none">•</span>
                  <span>Appears in parent directory search results</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#1565D8] font-bold select-none">•</span>
                  <span>Parents can contact or send admissions enquiries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#1565D8] font-bold select-none">•</span>
                  <span>Full CRM suite activated with 7-day free trial</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Verification Alert Boxes */}
        <div className="mt-6">
          {isUnderReview ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-xs leading-relaxed animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-800 block">Verification Under Review</span>
                <p className="text-amber-700">
                  Your claim details are being reviewed by our team. It will go live on search results within 24–48 hours, but you can still access and use the CRM immediately.
                </p>
              </div>
            </div>
          ) : isVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 text-xs leading-relaxed animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-800 block">Instant Verification Active</span>
                <p className="text-emerald-700">
                  Your school is fully verified via email/phone credentials. Launching will immediately publish your listing page to parents on the marketplace directory.
                </p>
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* Bottom Buttons */}
      <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => router.push('/onboarding/step/4')}
          type="button"
          className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer select-none"
        >
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleLaunch(false)}
            disabled={saving}
            className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl cursor-pointer select-none text-center"
          >
            Save & Finish Later
          </button>
          
          <button
            onClick={() => handleLaunch(true)}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl text-sm shadow-md shadow-[#1565D8]/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed select-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <span>🚀 Launch My Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
