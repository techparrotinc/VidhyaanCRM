'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Skeleton } from '@/components/ui/skeleton'
import UpsellState from '@/components/settings/payments/UpsellState'
import SetupWizard from '@/components/settings/payments/SetupWizard'
import GatewayOverview from '@/components/settings/payments/GatewayOverview'
import type { MaskedGatewayConfig } from '@/lib/payments/config'

type ConfigResponse = {
  data: {
    configs: MaskedGatewayConfig[]
    webhookUrl: string
  }
}

export default function PaymentsSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<ConfigResponse>(
    '/api/v1/payment-gateway/config',
    fetcher
  )
  const [wizardEnv, setWizardEnv] = useState<'TEST' | 'LIVE' | null>(null)

  const locked = (error as { status?: number } | undefined)?.status === 403
  const configs = data?.data.configs ?? []
  const showWizard = wizardEnv !== null || (!isLoading && !error && configs.length === 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-base font-bold text-slate-800">Payments</h3>
        <p className="text-xs text-slate-400">
          Collect fees online through your school&apos;s own payment gateway account.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {locked && <UpsellState />}

      {error && !locked && (
        <p className="text-sm font-medium text-red-600">
          Could not load payment settings. Refresh to try again.
        </p>
      )}

      {!isLoading && !error && showWizard && (
        <SetupWizard
          environment={wizardEnv ?? 'TEST'}
          onComplete={() => { setWizardEnv(null); mutate() }}
          onCancel={configs.length > 0 ? () => setWizardEnv(null) : undefined}
        />
      )}

      {!isLoading && !error && !showWizard && (
        <GatewayOverview
          configs={configs}
          webhookUrl={data!.data.webhookUrl}
          onMutate={() => mutate()}
          onRotate={env => setWizardEnv(env)}
        />
      )}
    </div>
  )
}
