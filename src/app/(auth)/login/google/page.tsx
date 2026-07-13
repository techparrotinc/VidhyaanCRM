'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, ShieldX } from 'lucide-react'

/**
 * Google login handoff: the NextAuth signIn callback redirected here with a
 * single-use challenge token; redeem it via the Credentials provider (the
 * only session-minting path) and land on the parent dashboard.
 */
function GoogleHandoff() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const ct = params.get('ct')
    if (!ct) {
      setError('Missing sign-in token')
      return
    }
    signIn('credentials', { challengeToken: ct, redirect: false }).then((res) => {
      if (res?.error) {
        setError('Sign-in link expired. Please try Google sign-in again.')
        return
      }
      window.location.href = '/parent/dashboard'
    })
  }, [params])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Sign-in failed</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signing you in…</p>
      </div>
    </div>
  )
}

export default function GoogleLoginPage() {
  return (
    <Suspense fallback={null}>
      <GoogleHandoff />
    </Suspense>
  )
}
