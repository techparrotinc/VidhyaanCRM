'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Page-level companion to the sidebar's module lock: the sidebar only greys
// out nav items, so any direct link (dashboard KPI cards, bookmarks, typed
// URLs) still rendered a locked module's full page. Wrap a section's
// layout.tsx in this gate to show an upgrade screen instead. The API routes
// stay the real enforcement (compose.ts module guard) — this is UX, so it
// fails open on fetch errors exactly like the sidebar does.

export default function ModuleGate({
  module,
  title,
  children
}: {
  module: string
  title: string
  children: React.ReactNode
}) {
  // null = still resolving; render nothing gated-looking to avoid flashes.
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/school-profile')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        const mods = json?.school?.enabledModules ?? json?.enabledModules
        // Mirror Sidebar.isModuleLocked: an absent/empty list fails open so a
        // profile hiccup never locks a paying org out of its own data.
        setAllowed(!Array.isArray(mods) || mods.length === 0 || mods.includes(module))
      })
      .catch(() => {
        if (!cancelled) setAllowed(true)
      })
    return () => {
      cancelled = true
    }
  }, [module])

  if (allowed === null) return null
  if (allowed) return <>{children}</>

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[70vh]">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
          <Lock className="w-6 h-6 text-amber-600" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title} is a premium feature</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-2">
          Your current plan doesn&rsquo;t include this module. Upgrade to unlock it — your existing data is
          kept safe and will be right here when you do.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link href="/settings/billing">
            <Button variant="outline" className="text-sm font-semibold px-4 h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
              See plans
            </Button>
          </Link>
          <Link href="/settings/billing/upgrade">
            <Button className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold px-4 h-9 rounded-lg flex items-center gap-1.5">
              <Crown className="w-4 h-4" strokeWidth={1.75} /> Upgrade
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
