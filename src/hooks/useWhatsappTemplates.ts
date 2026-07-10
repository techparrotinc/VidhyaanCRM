import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

// `enabled: false` skips the fetch entirely — the endpoint 403s for orgs
// without the WhatsApp add-on, so callers only enable it when relevant.
export function useWhatsappTemplates(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/v1/settings/whatsapp-templates' : null,
    fetcher
  )
  return {
    templates: data?.data ?? [],
    isLoading,
    isError: !!error,
    mutate
  }
}
