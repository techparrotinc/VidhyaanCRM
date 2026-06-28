'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MessageSquare, MessageCircle, CheckCircle, ArrowRight } from 'lucide-react'

interface StepOneProps {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | null
  campaignName: string
  hasWhatsappAddon: boolean
  onChannelChange: (channel: 'EMAIL' | 'SMS' | 'WHATSAPP') => void
  onNameChange: (name: string) => void
  onNext: () => void
}

export function StepOne({
  channel,
  campaignName,
  hasWhatsappAddon,
  onChannelChange,
  onNameChange,
  onNext
}: StepOneProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* CHANNEL CARDS */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {/* EMAIL */}
        <button
          type="button"
          onClick={() => onChannelChange('EMAIL')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            channel === 'EMAIL'
              ? 'border-[#1565D8] bg-[#1565D8]/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Email Campaign
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Rich content with subject line. Best for detailed messages.
              </p>
            </div>
            {channel === 'EMAIL' && (
              <CheckCircle className="w-5 h-5 text-[#1565D8] ml-auto flex-shrink-0" />
            )}
          </div>
        </button>

        {/* SMS */}
        <button
          type="button"
          onClick={() => onChannelChange('SMS')}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            channel === 'SMS'
              ? 'border-[#1565D8] bg-[#1565D8]/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                SMS Campaign
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Plain text up to 160 characters. Instant delivery to any phone.
              </p>
            </div>
            {channel === 'SMS' && (
              <CheckCircle className="w-5 h-5 text-[#1565D8] ml-auto flex-shrink-0" />
            )}
          </div>
        </button>

        {/* WHATSAPP */}
        {hasWhatsappAddon ? (
          <button
            type="button"
            onClick={() => onChannelChange('WHATSAPP')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              channel === 'WHATSAPP'
                ? 'border-[#1565D8] bg-[#1565D8]/5'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  WhatsApp Campaign
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Template-based. Highest open rates.
                </p>
              </div>
              {channel === 'WHATSAPP' && (
                <CheckCircle className="w-5 h-5 text-[#1565D8] ml-auto flex-shrink-0" />
              )}
            </div>
          </button>
        ) : (
          <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-400">
                    WhatsApp Campaign
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    ADDON
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Template-based. Highest open rates.
                </p>
                <p
                  className="text-xs text-[#1565D8] font-medium mt-1 cursor-pointer hover:underline"
                  onClick={() => router.push('/settings/billing')}
                >
                  Upgrade to unlock →
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CAMPAIGN NAME INPUT */}
      <div className="mt-6 bg-white p-4 border border-slate-200 rounded-xl">
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
          Campaign Name *
        </label>
        <input
          value={campaignName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Term 2 Fee Reminder"
          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
        />
      </div>

      {/* NEXT BUTTON */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!channel || !campaignName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1565D8] text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Select Audience
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
