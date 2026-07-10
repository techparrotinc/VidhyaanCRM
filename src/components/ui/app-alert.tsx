"use client"

import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

/**
 * App-level replacement for window.alert(): a centered, branded dialog.
 * <AppAlertHost /> is mounted once in the root layout; call sites just do:
 *
 *   appAlert('Operating hours updated successfully!')
 *   await appAlert('Could not save', { title: 'Save failed', variant: 'error' })
 *
 * Works from any code (not only components). If the host isn't mounted for
 * some reason, it falls back to the native alert so messages are never lost.
 */

export type AppAlertVariant = 'success' | 'error' | 'info'

export type AppAlertOptions = {
  title?: string
  variant?: AppAlertVariant
  okLabel?: string
}

type Pending = {
  message: string
  options: AppAlertOptions
  resolve: () => void
}

let enqueue: ((p: Pending) => void) | null = null

/** Infer icon/colour from the message when the caller doesn't say. */
function inferVariant(message: string): AppAlertVariant {
  if (/success|updated|saved|created|sent|added|deleted|copied|done/i.test(message)) return 'success'
  if (/fail|error|invalid|unable|could not|couldn't|denied|wrong|exceed|not allowed|missing/i.test(message)) return 'error'
  return 'info'
}

export function appAlert(message: string, options: AppAlertOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (enqueue) {
      enqueue({ message, options, resolve })
    } else {
      // Host not mounted — never swallow the message
      if (typeof window !== 'undefined') window.alert(message)
      resolve()
    }
  })
}

const VARIANT_STYLES: Record<AppAlertVariant, { badge: string; Icon: typeof Info; defaultTitle: string }> = {
  success: { badge: 'bg-emerald-50 text-emerald-600', Icon: CheckCircle2, defaultTitle: 'Success' },
  error: { badge: 'bg-red-50 text-red-600', Icon: AlertCircle, defaultTitle: 'Something went wrong' },
  info: { badge: 'bg-blue-50 text-[#1565D8]', Icon: Info, defaultTitle: 'Notice' },
}

export function AppAlertHost() {
  const [queue, setQueue] = useState<Pending[]>([])

  useEffect(() => {
    enqueue = (p) => setQueue((q) => [...q, p])
    return () => {
      enqueue = null
    }
  }, [])

  const current = queue[0]
  if (!current) return null

  const dismiss = () => {
    current.resolve()
    setQueue((q) => q.slice(1))
  }

  const variant = current.options.variant ?? inferVariant(current.message)
  const { badge, Icon, defaultTitle } = VARIANT_STYLES[variant]

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="app-alert-title"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in" onClick={dismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badge}`}>
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="app-alert-title"
              className="text-base font-bold text-slate-900"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {current.options.title ?? defaultTitle}
            </h2>
            <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-500 whitespace-pre-line">
              {current.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            autoFocus
            onClick={dismiss}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#1565D8] hover:bg-blue-700 transition cursor-pointer"
          >
            {current.options.okLabel ?? 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}
