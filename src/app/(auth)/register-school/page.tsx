'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function RegisterSchoolPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/register')
  }, [router])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin" />
      <span className="text-sm font-semibold text-slate-500 mt-3">
        Redirecting to registration...
      </span>
    </div>
  )
}
