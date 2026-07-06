/**
 * Payment gateway abstraction layer — public surface.
 * Fee Management and API routes import from here only; concrete gateway SDKs
 * stay behind src/lib/payments/providers/*.
 * Design: docs/design/payment-gateway-integration.md
 */
export type {
  PaymentProvider,
  DecryptedCredentials,
  CreateOrderInput,
  CreateOrderResult,
  CheckoutSignatureInput,
  NormalizedGatewayEvent,
  NormalizedEventType,
  NormalizedPayment,
  CreateRefundInput,
  CreateRefundResult,
  FetchPaymentsInput,
  FetchPaymentsResult
} from './provider'
export { getProvider } from './registry'
export { encryptSecret, decryptSecret, currentKeyVersion, ciphertextKeyVersion, VaultError } from './vault'
export { toMinor, fromMinor, InvalidAmountError } from './money'
