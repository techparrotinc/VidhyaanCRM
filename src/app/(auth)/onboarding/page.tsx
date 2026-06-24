'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding/step/1')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center py-20 flex-1">
      <Loader2 className="w-10 h-10 text-[#1565D8] animate-spin mb-3" />
      <p className="text-slate-500 font-semibold">Redirecting to onboarding step 1...</p>
    </div>
  )
}
