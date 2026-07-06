import type { GatewayProvider } from '@prisma/client'
import type { PaymentProvider } from './provider'
import { RazorpayProvider } from './providers/razorpay'
import { MockProvider } from './providers/mock'

const providers: Partial<Record<GatewayProvider, PaymentProvider>> = {
  RAZORPAY: new RazorpayProvider()
  // STRIPE / CASHFREE / PAYU: add implementation + entry here — nothing else changes.
}

const mockProvider = new MockProvider()

function mockEnabled(): boolean {
  // Hard production guard: the mock must never be reachable in prod, even if
  // the env var leaks into the deployment (legacy integration silently fell
  // back to mocks on auth failure — that class of bug ends here).
  return process.env.PAYMENT_PROVIDER_MOCK === '1' && process.env.NODE_ENV !== 'production'
}

export function getProvider(slug: GatewayProvider): PaymentProvider {
  if (mockEnabled()) {
    return mockProvider
  }
  const provider = providers[slug]
  if (!provider) {
    throw new Error(`Payment provider "${slug}" is not implemented`)
  }
  return provider
}
