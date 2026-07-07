"use client"

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

/**
 * App-level replacement for window.confirm(): a centered, branded
 * confirmation dialog. Wrap a layout with <ConfirmProvider> once, then:
 *
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete lead?', message: '...' })) { ... }
 */

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** danger = red destructive action (default), primary = blue */
  variant?: 'danger' | 'primary'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>')
  }
  return confirm
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const settle = (value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOptions(null)
  }

  const isDanger = (options?.variant ?? 'danger') === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in"
            onClick={() => settle(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#1565D8]'
                }`}
              >
                {isDanger ? (
                  <Trash2 className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-dialog-title"
                  className="text-base font-bold text-slate-900"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {options.title}
                </h2>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-500 whitespace-pre-line">
                  {options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                autoFocus
                onClick={() => settle(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={() => settle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition cursor-pointer ${
                  isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1565D8] hover:bg-blue-700'
                }`}
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
