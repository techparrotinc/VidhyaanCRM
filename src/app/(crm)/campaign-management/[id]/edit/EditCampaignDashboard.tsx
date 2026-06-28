'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { useCampaign } from '@/hooks/useCampaign'
import { StepOne } from '../../new/components/StepOne'
import { StepTwo } from '../../new/components/StepTwo'
import { StepThree } from '../../new/components/StepThree'

const steps = [
  { number: 1, label: 'Channel' },
  { number: 2, label: 'Audience' },
  { number: 3, label: 'Content & Schedule' }
]

export default function EditCampaignDashboard({ id }: { id: string }) {
  const router = useRouter()
  const { campaign, isLoading: isCampaignLoading } = useCampaign(id)

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP' | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [audiencePool, setAudiencePool] = useState<'LEADS' | 'STUDENTS' | 'BOTH' | null>(null)
  const [audienceFilters, setAudienceFilters] = useState<Array<{ field: string; value: string }>>([])
  const [recipientCount, setRecipientCount] = useState(0)
  const [templateBody, setTemplateBody] = useState('')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [sendNow, setSendNow] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')
  const [hasWhatsappAddon, setHasWhatsappAddon] = useState(false)
  const [isCountLoading, setIsCountLoading] = useState(false)

  // Populate state once campaign is fetched
  useEffect(() => {
    if (campaign) {
      setChannel(campaign.channel)
      setCampaignName(campaign.name)
      if (campaign.audienceFilter) {
        setAudiencePool(campaign.audienceFilter.pool)
        setAudienceFilters(campaign.audienceFilter.filters ?? [])
      }
      setTemplateBody(campaign.templateBody ?? '')
      if (campaign.scheduledAt) {
        // Convert to datetime-local format: YYYY-MM-DDTHH:MM
        const dateStr = new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        setScheduledAt(dateStr)
        setSendNow(false)
      } else {
        setScheduledAt(null)
        setSendNow(true)
      }
    }
  }, [campaign])

  // Fetch org metadata on mount
  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.data?.institutionType) {
            setInstitutionType(data.data.institutionType)
          }
          if (data.data?.isWhatsappActive !== undefined) {
            setHasWhatsappAddon(data.data.isWhatsappActive)
          }
        }
      })
      .catch((e) => console.error('Failed to fetch org config:', e))
  }, [])


  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/campaign-management')
    } else if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && channel && campaignName.trim()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && audiencePool) {
      setCurrentStep(3)
    }
  }

  const handleSubmit = async (action: 'draft' | 'send' | 'schedule') => {
    setIsSubmitting(true)
    try {
      // Step 1: Update campaign
      const updateRes = await fetch(`/api/v1/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: campaignName,
          channel,
          audienceFilter: {
            pool: audiencePool,
            filters: audienceFilters
          },
          templateBody,
          scheduledAt: action === 'schedule' ? scheduledAt : null
        })
      })

      if (!updateRes.ok) {
        const errJson = await updateRes.json()
        alert(errJson.error || 'Failed to update campaign')
        return
      }

      if (action === 'draft') {
        alert('Campaign updated')
        router.push('/campaign-management')
        return
      }

      // Step 2: Send/Schedule campaign
      const sendRes = await fetch(`/api/v1/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledAt: action === 'schedule' ? scheduledAt : null
        })
      })

      if (sendRes.ok) {
        if (action === 'send') {
          alert('Campaign sent successfully')
        } else {
          alert('Campaign scheduled successfully')
        }
        router.push('/campaign-management')
      } else {
        const errorJson = await sendRes.json()
        if (sendRes.status === 402) {
          alert(errorJson.error || 'Recipient quota exceeded. Please upgrade.')
        } else if (sendRes.status === 403) {
          alert(errorJson.error || 'WhatsApp addon required. Please upgrade.')
        } else {
          alert(errorJson.error || 'Failed to send campaign. Please try again.')
        }
      }
    } catch (e) {
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCampaignLoading) {
    return (
      <div className="p-4 lg:p-6 text-center animate-pulse space-y-4">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3 mx-auto" />
        <div className="h-60 bg-slate-200 rounded-xl max-w-2xl mx-auto" />
      </div>
    )
  }

  if (campaign && campaign.status !== 'DRAFT') {
    return (
      <div className="p-4 lg:p-6 max-w-md mx-auto text-center space-y-4 bg-white border border-slate-200 rounded-xl mt-10">
        <h2 className="text-lg font-semibold text-slate-800">Cannot edit campaign</h2>
        <p className="text-sm text-slate-500">
          This campaign has already been sent and cannot be edited.
        </p>
        <button
          onClick={() => router.push('/campaign-management')}
          className="px-4 py-2 bg-[#1565D8] text-white text-sm font-semibold rounded-lg"
        >
          Back to Campaigns
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* STEP INDICATOR */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">
            Edit Campaign
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-[#1565D8] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > step.number ? <Check className="w-3 h-3" /> : step.number}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    currentStep === step.number ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    currentStep > index + 1 ? 'bg-green-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        {currentStep === 1 && (
          <StepOne
            channel={channel}
            campaignName={campaignName}
            hasWhatsappAddon={hasWhatsappAddon}
            onChannelChange={setChannel}
            onNameChange={setCampaignName}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <StepTwo
            institutionType={institutionType}
            audiencePool={audiencePool}
            audienceFilters={audienceFilters}
            recipientCount={recipientCount}
            isCountLoading={isCountLoading}
            onPoolChange={setAudiencePool}
            onFiltersChange={setAudienceFilters}
            onNext={handleNext}
            onCountChange={setRecipientCount}
            onCountLoadingChange={setIsCountLoading}
          />
        )}
        {currentStep === 3 && (
          <StepThree
            channel={channel || 'EMAIL'}
            campaignName={campaignName}
            templateBody={templateBody}
            scheduledAt={scheduledAt}
            sendNow={sendNow}
            recipientCount={recipientCount}
            onBodyChange={setTemplateBody}
            onScheduleChange={setScheduledAt}
            onSendNowChange={setSendNow}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
