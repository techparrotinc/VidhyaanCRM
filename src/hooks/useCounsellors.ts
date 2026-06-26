import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useCounsellors() {
  const { data, isLoading } = useSWR(
    '/api/v1/users/counsellors',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )
  return {
    counsellors: data?.counsellors || [],
    isLoading,
  }
}
