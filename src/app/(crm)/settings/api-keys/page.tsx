'use client'

import React, { useEffect, useState } from 'react'
import { Key, Ban } from 'lucide-react'

export default function ApiKeysPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/v1/platform-flags')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setEnabled(j ? !!j.enablePublicApiAccess : true))
      .catch(() => setEnabled(true))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-base font-bold text-slate-800">API Access Keys</h3>
        <p className="text-xs text-slate-400">Generate and manage developer keys for external API integrations.</p>
      </div>

      {enabled === false ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 my-6">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
            <Ban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Developer API Disabled</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Public API access has been turned off by the platform administrator. Contact support if you need it enabled.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 my-6">
          <div className="w-12 h-12 bg-blue-50 text-[#1565D8] rounded-xl flex items-center justify-center mx-auto border border-blue-100">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Developer API Access</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              API key generation and webhooks are under development. Available in the next release.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
