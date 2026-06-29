import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useWhatsappTemplates() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/settings/whatsapp-templates',
    fetcher
  )
  return {
    templates: data?.data ?? [],
    isLoading,
    isError: !!error,
    mutate
  }
}
