'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkle } from 'lucide-react'
import { AiSidebar } from './AiSidebar'
import { useAiChat } from './useAiChat'

/**
 * Top-right AI launcher (Neon-style) — the trigger button is portaled into the
 * header slot (#ai-launcher-slot) so it sits in the top bar and never overlaps
 * floating page buttons. Chat state lives HERE so minimize/close keeps the
 * conversation; reopening resumes where the user left off.
 */
export function AiLauncher() {
  const [open, setOpen] = useState(false)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const chat = useAiChat()
  const hasConversation = chat.messages.length > 0

  // Header renders before this component in the tree; grab the slot after mount
  // (retry briefly in case of hydration ordering).
  useEffect(() => {
    let tries = 0
    const find = () => {
      const el = document.getElementById('ai-launcher-slot')
      if (el) return setSlot(el)
      if (tries++ < 20) setTimeout(find, 100)
    }
    find()
  }, [])

  const trigger = (
    <button
      onClick={() => setOpen(true)}
      title="Vidhyaan AI"
      aria-label="Open Vidhyaan AI copilot"
      className="relative flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#1565D8] hover:bg-blue-50/40"
    >
      <Sparkle className="h-4 w-4 fill-emerald-400 text-emerald-500" />
      <span>Ask AI</span>
      {hasConversation && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </button>
  )

  return (
    <>
      {slot ? createPortal(trigger, slot) : null}
      <AiSidebar open={open} onClose={() => setOpen(false)} chat={chat} />
    </>
  )
}
