import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function usePipelineStages() {
  const { data, isLoading } = useSWR(
    '/api/v1/settings/pipeline',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )
  return {
    stages: data?.stages || [],
    isLoading,
  }
}
