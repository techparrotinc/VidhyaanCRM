'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AiSidebar } from './AiSidebar'
import { useAiChat } from './useAiChat'

/**
 * Floating AI button — bottom-right FAB opening the copilot sidebar.
 * Chat state lives HERE so minimize/close keeps the conversation; reopening
 * resumes where the user left off. Entitlement resolves on first open.
 */
export function AiLauncher() {
  const [open, setOpen] = useState(false)
  const chat = useAiChat()
  const hasConversation = chat.messages.length > 0

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Vidhyaan AI"
          aria-label="Open Vidhyaan AI copilot"
          className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-[#1565D8] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
        >
          <Sparkles className="h-5 w-5" />
          {hasConversation && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </button>
      )}
      <AiSidebar open={open} onClose={() => setOpen(false)} chat={chat} />
    </>
  )
}
