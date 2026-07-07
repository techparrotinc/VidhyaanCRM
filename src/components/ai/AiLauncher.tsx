'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AiSidebar } from './AiSidebar'

/**
 * Floating AI button — bottom-right FAB opening the copilot sidebar.
 * Entitlement resolves on first open (module-gated token mint); non-entitled
 * orgs see an in-drawer explainer rather than a dead button.
 */
export function AiLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Vidhyaan AI"
          aria-label="Open Vidhyaan AI copilot"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#1565D8] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}
      <AiSidebar open={open} onClose={() => setOpen(false)} />
    </>
  )
}
