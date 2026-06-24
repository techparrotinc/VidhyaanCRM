'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

interface SchoolMedia {
  id: string
  url: string
  caption: string
}

interface SchoolLocation {
  id: string
  city: string
  isPrimary: boolean
}

interface SchoolContact {
  id: string
  type: string
  value: string
}

interface SchoolAffiliation {
  id: string
  board: string
}

interface SchoolFeeRange {
  id: string
  gradeLabel: string
}

interface School {
  id: string
  name: string
  description: string | null
  monthlyFeeMin: number | null
  locations: SchoolLocation[]
  contacts: SchoolContact[]
  affiliations: SchoolAffiliation[]
  media: SchoolMedia[]
  feeRanges: SchoolFeeRange[]
}

export default function ProfileCompletionWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<School | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          setSchool(data.school)
        }
      })
      .catch((err) => console.error('Error fetching profile completion status:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!school) return

    let currentScore = 10 // Name is always registered / true (10 points)

    if (school.description && school.description.trim() !== '') {
      currentScore += 10
    }
    if (school.locations && school.locations.length > 0) {
      currentScore += 10
    }
    if (school.contacts && school.contacts.length > 0) {
      currentScore += 10
    }
    if (school.affiliations && school.affiliations.length > 0) {
      currentScore += 10
    }
    const hasFeeRange = (school.feeRanges && school.feeRanges.length > 0) || school.monthlyFeeMin !== null
    if (hasFeeRange) {
      currentScore += 10
    }
    const hasLogo = school.media && school.media.some((m) => m.caption === 'logo')
    if (hasLogo) {
      currentScore += 15
    }
    const hasCover = school.media && school.media.some((m) => m.caption === 'cover')
    if (hasCover) {
      currentScore += 15
    }
    const hasGallery = school.media && school.media.some((m) => m.caption === 'gallery')
    if (hasGallery) {
      currentScore += 10
    }

    setScore(currentScore)
  }, [school])

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-center min-h-[140px] shadow-sm">
        <Loader2 className="w-6 h-6 text-[#1565D8] animate-spin" />
        <span className="ml-2.5 text-xs font-bold text-slate-500">Calculating profile strength...</span>
      </div>
    )
  }

  if (!school) return null

  // Define checklist items
  const items = [
    {
      label: 'School / center name',
      done: true,
      points: 10,
      link: '/onboarding/step/1'
    },
    {
      label: 'Upload institution logo',
      done: school.media && school.media.some((m) => m.caption === 'logo'),
      points: 15,
      link: '/onboarding/step/4'
    },
    {
      label: 'Upload cover photo',
      done: school.media && school.media.some((m) => m.caption === 'cover'),
      points: 15,
      link: '/onboarding/step/4'
    },
    {
      label: 'Upload gallery photos',
      done: school.media && school.media.some((m) => m.caption === 'gallery'),
      points: 10,
      link: '/onboarding/step/4'
    },
    {
      label: 'Add profile description',
      done: !!(school.description && school.description.trim() !== ''),
      points: 10,
      link: '/onboarding/step/1'
    },
    {
      label: 'Set campus location address',
      done: school.locations && school.locations.length > 0,
      points: 10,
      link: '/onboarding/step/2'
    },
    {
      label: 'Add board / curriculum affiliations',
      done: school.affiliations && school.affiliations.length > 0,
      points: 10,
      link: '/onboarding/step/3'
    },
    {
      label: 'Add contact phone/email details',
      done: school.contacts && school.contacts.length > 0,
      points: 10,
      link: '/onboarding/step/2'
    },
    {
      label: 'Add school fee ranges',
      done: (school.feeRanges && school.feeRanges.length > 0) || school.monthlyFeeMin !== null,
      points: 10,
      link: '/onboarding/step/3'
    }
  ]

  const incompleteItems = items.filter((item) => !item.done)

  // Circular progress math
  const radius = 34
  const stroke = 6
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white border border-slate-205 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-stretch w-full mb-6">
      
      {/* Circle & Details Column */}
      <div className="flex items-center gap-5 md:w-[45%] shrink-0">
        <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-slate-100 fill-none"
              strokeWidth={stroke}
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className={`fill-none transition-all duration-500 ease-out ${
                score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
              }`}
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
            />
          </svg>
          <span className="absolute text-lg font-black text-slate-805 font-poppins">{score}%</span>
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-slate-905 text-base leading-tight">Profile Strength</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {score === 100
              ? 'Amazing! Your listing profile is 100% complete and fully optimized.'
              : score >= 80
              ? 'Looking great! Complete the last few tasks to maximize search visibility.'
              : 'Add missing details to attract more enquiries from parents.'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-slate-100 my-1 self-stretch shrink-0" />

      {/* Incomplete Checklist Column */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          {incompleteItems.length > 0 ? 'Remaining Profile Checklist' : 'Checklist Completed ✓'}
        </h5>

        {incompleteItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 max-h-[140px] overflow-y-auto pr-1">
            {incompleteItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-xs leading-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-600 truncate">{item.label}</span>
                </div>
                <button
                  onClick={() => router.push(item.link)}
                  className="text-[10px] font-black text-[#1565D8] hover:text-blue-705 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                >
                  <span>Complete</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-505 shrink-0" />
            <span>All done! Your profile is verified, fully configured and active on Vidhyaan.</span>
          </div>
        )}
      </div>

    </div>
  )
}
