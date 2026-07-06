'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { UserCheck, Loader2, Copy, Check, ShieldOff } from 'lucide-react'

type AccessData = {
  status: 'NOT_INVITED' | 'INVITED' | 'ACTIVE' | 'REVOKED'
  parentName: string | null
  parentPhone: string | null
  invitedAt: string | null
  activatedAt: string | null
  lastLoginAt: string | null
}

const STATUS_UI: Record<AccessData['status'], { label: string; classes: string }> = {
  NOT_INVITED: { label: 'Not invited', classes: 'bg-slate-100 text-slate-500' },
  INVITED: { label: 'Invited', classes: 'bg-amber-50 text-amber-700' },
  ACTIVE: { label: 'Active', classes: 'bg-emerald-50 text-emerald-700' },
  REVOKED: { label: 'Revoked', classes: 'bg-red-50 text-red-600' }
}

export default function ParentAccessCard({ studentId, guardianPhone }: { studentId: string; guardianPhone: string | null }) {
  const { data, mutate, isLoading } = useSWR<{ data: AccessData }>(
    `/api/v1/students/${studentId}/parent-access`,
    fetcher
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const access = data?.data
  const status = access?.status ?? 'NOT_INVITED'

  const invite = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/students/${studentId}/parent-access`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Could not enable access')
      setShareMessage(body.data.shareMessage)
      mutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!window.confirm('Revoke portal access? The parent will no longer see this student’s invoices.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/students/${studentId}/parent-access`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Could not revoke access')
      setShareMessage(null)
      mutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const copyShare = () => {
    if (!shareMessage) return
    navigator.clipboard.writeText(shareMessage).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Parent Portal Access
        </h2>
        {!isLoading && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_UI[status].classes}`}>
            {STATUS_UI[status].label}
          </span>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {status === 'ACTIVE' && access && (
        <p className="text-xs font-normal text-slate-500">
          {access.parentName ?? 'Parent'} ({access.parentPhone}) can view invoices and pay fees online.
          {access.lastLoginAt && <> Last login {new Date(access.lastLoginAt).toLocaleDateString('en-IN')}.</>}
        </p>
      )}
      {status === 'INVITED' && access && (
        <p className="text-xs font-normal text-slate-500">
          Invite sent{access.invitedAt ? ` on ${new Date(access.invitedAt).toLocaleDateString('en-IN')}` : ''}.
          Access activates on their first OTP login with {access.parentPhone}.
        </p>
      )}
      {status === 'NOT_INVITED' && (
        <p className="text-xs font-normal text-slate-500">
          {guardianPhone
            ? 'Give the guardian online access to invoices and fee payment.'
            : 'Add a guardian phone number to enable portal access.'}
        </p>
      )}
      {status === 'REVOKED' && (
        <p className="text-xs font-normal text-slate-500">Access was revoked. Re-invite to restore it.</p>
      )}

      {shareMessage && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
          <p className="flex-1 text-xs font-normal text-slate-600">{shareMessage}</p>
          <button onClick={copyShare} className="text-slate-400 hover:text-[#1565D8] shrink-0" title="Copy invite message">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {(status === 'NOT_INVITED' || status === 'REVOKED') && (
          <button
            onClick={invite}
            disabled={busy || !guardianPhone}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1565D8] text-white text-xs font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            {status === 'REVOKED' ? 'Re-invite parent' : 'Enable & invite'}
          </button>
        )}
        {status === 'INVITED' && (
          <button
            onClick={invite}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            Resend invite
          </button>
        )}
        {(status === 'INVITED' || status === 'ACTIVE') && (
          <button
            onClick={revoke}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 disabled:opacity-50"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Revoke
          </button>
        )}
      </div>
    </div>
  )
}
