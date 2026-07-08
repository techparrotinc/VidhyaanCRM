'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { FeedbackCategory } from './useAiChat'

const OPTIONS: { key: FeedbackCategory; label: string; placeholder: string }[] = [
  { key: 'didnt_answer', label: "Didn't answer my question", placeholder: 'What were you looking for?' },
  { key: 'inaccurate', label: 'Inaccurate statement', placeholder: 'What was wrong? What is correct?' },
  { key: 'irrelevant_citations', label: 'Irrelevant sources', placeholder: 'Which source felt off?' },
  { key: 'other', label: 'Something else', placeholder: 'Tell us more' }
]

/** Neon-style negative-feedback dialog: categories + free text. Feeds the
 *  backend improve-from-feedback loop, so specific comments directly improve
 *  future answers. */
export function AiFeedbackDialog({
  onSubmit,
  onClose
}: {
  onSubmit: (categories: FeedbackCategory[], comment: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<FeedbackCategory>>(new Set())
  const [notes, setNotes] = useState<Record<string, string>>({})

  const toggle = (key: FeedbackCategory) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const submit = () => {
    const comment = OPTIONS.filter((o) => selected.has(o.key) && notes[o.key]?.trim())
      .map((o) => `[${o.label}] ${notes[o.key].trim()}`)
      .join('\n')
    onSubmit([...selected], comment)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-10 flex items-end bg-slate-900/30" onClick={onClose}>
      <div
        className="max-h-[85%] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Help improve Vidhyaan AI</h3>
          <button onClick={onClose} aria-label="Close feedback" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <div key={o.key}>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.has(o.key)}
                  onChange={() => toggle(o.key)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#1565D8]"
                />
                {o.label}
              </label>
              {selected.has(o.key) && (
                <textarea
                  rows={2}
                  value={notes[o.key] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [o.key]: e.target.value }))}
                  placeholder={o.placeholder}
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-[#1565D8]"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="pr-3 text-xs font-normal text-slate-400">
            Specific comments teach the AI — it learns corrections for future answers.
          </p>
          <button
            onClick={submit}
            disabled={selected.size === 0}
            className="shrink-0 rounded-lg bg-[#1565D8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
