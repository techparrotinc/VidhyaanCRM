'use client'

import React, { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Link2, Loader2 } from 'lucide-react'

/**
 * "Connected accounts" section for the parent profile page: Google link
 * status, link (via the OAuth flow → complete-signup link mode) and unlink.
 */
export default function ConnectedAccountsCard() {
  const [loading, setLoading] = useState(true)
  const [linked, setLinked] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const load = async () => {
    try {
      const json = await fetch('/api/v1/parent/account/google').then((r) => r.json())
      if (json.success) {
        setLinked(json.data.linked)
        setEmail(json.data.email)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Show fresh state when returning from the link flow (?linked=1)
  }, [])

  const unlink = async () => {
    setBusy(true)
    try {
      await fetch('/api/v1/parent/account/google', { method: 'DELETE' })
      setLinked(false)
      setEmail(null)
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 pt-5 border-t border-slate-100">
      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" /> Connected Accounts
      </h4>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block">Google</span>
              <span className="text-[10px] text-slate-400 block truncate">
                {linked ? `Linked · ${email ?? ''}` : 'Sign in with one tap, no OTP needed'}
              </span>
            </div>
          </div>

          {linked ? (
            confirming ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={unlink}
                  disabled={busy}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Unlinking…' : 'Confirm unlink'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 hover:underline cursor-pointer shrink-0"
              >
                Unlink
              </button>
            )
          ) : (
            <button
              onClick={() => {
                setBusy(true)
                signIn('google', { redirectTo: '/parent/profile?linked=1' })
              }}
              disabled={busy}
              className="text-[11px] font-bold text-[#1565D8] hover:underline cursor-pointer shrink-0 disabled:opacity-50"
            >
              {busy ? 'Opening…' : 'Link account'}
            </button>
          )}
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
        Your phone number and OTP login always keep working — Google is just a faster way in.
      </p>
    </div>
  )
}
