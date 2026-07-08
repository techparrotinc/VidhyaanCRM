"use client"

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, ShieldAlert } from 'lucide-react'

function ImpersonateInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Missing impersonation token. Generate one from the org page in the admin console.')
      return
    }
    let cancelled = false
    const redeem = async () => {
      const res = await signIn('credentials', {
        impersonateToken: token,
        redirect: false
      })
      if (cancelled) return
      if (res?.error) {
        setError('Token invalid, expired, or already used. Impersonation tokens are single-use and valid for 15 minutes — generate a fresh one.')
        return
      }
      // Full navigation so middleware + layouts pick up the new session
      window.location.href = '/dashboard'
    }
    redeem()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900">Impersonation Failed</h1>
            <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push('/admin')}
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
            >
              Back to Admin Console
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-blue-600 mx-auto animate-spin" />
            <h1 className="text-lg font-bold text-slate-900">Starting impersonation session…</h1>
            <p className="text-sm text-slate-500">
              Validating token and switching to the organization workspace. Your admin session will be replaced.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ImpersonateInner />
    </Suspense>
  )
}
