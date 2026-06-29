import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useCampaignQuota() {
  const { data, error, isLoading } = useSWR(
    '/api/v1/campaigns/quota',
    fetcher
  )
  return {
    quota: data?.data ?? null,
    isLoading,
    isError: !!error
  }
}
