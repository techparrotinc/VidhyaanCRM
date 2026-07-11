'use client'

import { appAlert } from '@/components/ui/app-alert'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { useCampaignQuota } from '@/hooks/useCampaignQuota'
import { StepOne } from './components/StepOne'
import { StepTwo } from './components/StepTwo'
import { StepThree } from './components/StepThree'

const steps = [
  { number: 1, label: 'Channel' },
  { number: 2, label: 'Audience' },
  { number: 3, label: 'Content & Schedule' }
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP' | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [audiencePool, setAudiencePool] = useState<'LEADS' | 'STUDENTS' | 'BOTH' | null>(null)
  const [audienceFilters, setAudienceFilters] = useState<Array<{ field: string; value: string }>>([])
  const [recipientCount, setRecipientCount] = useState(0)
  const [templateBody, setTemplateBody] = useState('')
  const [whatsappTemplateId, setWhatsappTemplateId] = useState('')
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [formTemplateId, setFormTemplateId] = useState('')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [sendNow, setSendNow] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { quota } = useCampaignQuota()
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')
  const [hasWhatsappAddon, setHasWhatsappAddon] = useState(false)
  const [isCountLoading, setIsCountLoading] = useState(false)

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
      // Step 1: Create campaign
      const createRes = await fetch('/api/v1/campaigns', {
        method: 'POST',
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
          whatsappTemplateId: channel === 'WHATSAPP' ? whatsappTemplateId || null : null,
          formTemplateId: formTemplateId || null,
          paramValues: channel === 'WHATSAPP' ? paramValues : null,
          scheduledAt: action === 'schedule' ? scheduledAt : null
        })
      })

      if (!createRes.ok) {
        const errJson = await createRes.json()
        appAlert(errJson.error || 'Failed to save campaign')
        return
      }

      const { data: campaign } = await createRes.json()
      const campaignId = campaign.id

      if (action === 'draft') {
        appAlert('Campaign saved as draft')
        router.push('/campaign-management')
        return
      }

      // Step 2: Send/Schedule campaign
      const sendRes = await fetch(`/api/v1/campaigns/${campaignId}/send`, {
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
          appAlert('Campaign sent successfully')
        } else {
          appAlert('Campaign scheduled successfully')
        }
        router.push('/campaign-management')
      } else {
        const errorJson = await sendRes.json()
        if (sendRes.status === 402) {
          appAlert(errorJson.error || 'Recipient quota exceeded. Please upgrade.')
        } else if (sendRes.status === 403) {
          appAlert(errorJson.error || 'WhatsApp addon required. Please upgrade.')
        } else {
          appAlert(errorJson.error || 'Failed to send campaign. Please try again.')
        }
      }
    } catch (e) {
      appAlert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            New Campaign
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
        {quota && (quota.limit === 0 || (quota.limit > 0 && quota.remaining === 0)) && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
            <span>
              {quota.limit === 0
                ? 'Your current plan does not include campaign sending — you can build and save this campaign as a draft, but sending requires a paid plan. '
                : 'Monthly recipient limit reached — you can save as a draft, but sending more this month requires an upgrade. '}
              <button onClick={() => router.push('/settings/billing/upgrade')} className="underline font-semibold cursor-pointer">
                Upgrade plan
              </button>
            </span>
          </div>
        )}
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
            whatsappTemplateId={whatsappTemplateId}
            paramValues={paramValues}
            onParamValuesChange={setParamValues}
            formTemplateId={formTemplateId}
            scheduledAt={scheduledAt}
            sendNow={sendNow}
            recipientCount={recipientCount}
            onBodyChange={setTemplateBody}
            onTemplateChange={setWhatsappTemplateId}
            onFormTemplateChange={setFormTemplateId}
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
