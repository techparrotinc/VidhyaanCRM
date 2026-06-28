import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useCampaign(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/campaigns/${id}` : null,
    fetcher
  )
  return {
    campaign: data?.data ?? null,
    isLoading,
    isError: !!error,
    mutate
  }
}
