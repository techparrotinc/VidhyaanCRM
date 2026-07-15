import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/mobile/v1/org/wallet. */

export const walletBalanceSchema = z.object({
  channel: z.string(),
  remaining: z.number(),
  lowBalance: z.boolean()
})
export type WalletBalance = z.infer<typeof walletBalanceSchema>

const walletResponseSchema = z.object({
  success: z.literal(true),
  balances: z.array(walletBalanceSchema)
})

export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const json = await api<unknown>('/api/mobile/v1/org/wallet')
      return walletResponseSchema.parse(json).balances
    }
  })
}
