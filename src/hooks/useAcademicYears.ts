import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useAcademicYears() {
  const { data, isLoading } = useSWR(
    '/api/v1/settings/academic-year',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )
  return {
    years: data?.years || [],
    currentYear: data?.years?.find(
      (y: any) => y.status === 'ACTIVE' || y.isCurrent === true
    ),
    isLoading,
  }
}
