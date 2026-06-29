import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

interface CampaignFilters {
  status?: string
  channel?: string
  from?: string
  to?: string
  q?: string
  page?: number
}

export function useCampaigns(filters: CampaignFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      params.set(k, String(v))
    }
  })
  const query = params.toString()

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/campaigns${query ? `?${query}` : ''}`,
    fetcher
  )
  return {
    campaigns: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isError: !!error,
    mutate
  }
}
