import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useBranches() {
  const { data, isLoading, mutate } = useSWR(
    '/api/v1/branches',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )
  return {
    branches: data?.data || [],
    isLoading,
    mutate,
  }
}
