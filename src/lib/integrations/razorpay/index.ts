import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { gstBreakupPaise } from '@/lib/billing/money'
import { getRazorpayCredentials } from '@/lib/platform-config'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback_secret_32_characters_long_!!'

// Symmetric encryption helper to secure school payment keys
export function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts.shift() || '', 'hex')
  const encrypted = parts.join(':')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Platform Razorpay client, resolved from admin-managed config with env
// fallback (see src/lib/platform-config). Built lazily and cached by key_id so
// an admin credential change takes effect without a restart. When nothing is
// configured the resolver returns mock_key/mock_secret → same mock behaviour
// as before.
let rzCache: { keyId: string; client: Razorpay } | null = null
async function getRazorpay(): Promise<{ client: Razorpay; keyId: string; keySecret: string; isMock: boolean }> {
  const creds = await getRazorpayCredentials()
  if (!rzCache || rzCache.keyId !== creds.keyId) {
    rzCache = { keyId: creds.keyId, client: new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret }) }
  }
  return { client: rzCache.client, keyId: creds.keyId, keySecret: creds.keySecret, isMock: creds.keyId === 'mock_key' }
}

/**
 * Creates a subscription on the platform gateway
 */
export async function createSubscription(
  planId: string,
  totalCount: number,
  notes: any
): Promise<any> {
  const isDev = process.env.NODE_ENV === 'development'
  const { client: razorpay, isMock } = await getRazorpay()

  if (isMock && isDev) {
    console.log('[Razorpay Mock] Creating mock subscription for plan:', planId)
    return {
      id: 'sub_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
      status: 'active',
      plan_id: planId,
      total_count: totalCount,
      notes: notes || {}
    }
  }

  try {
    return await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      notes: notes || {},
      quantity: 1
    })
  } catch (error: any) {
    if (isDev && (error.statusCode === 401 || error.message?.includes('auth') || error.description?.includes('Authentication'))) {
      console.warn('[Razorpay] Auth failed. Falling back to mock subscription.')
      return {
        id: 'sub_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
        status: 'active',
        plan_id: planId,
        total_count: totalCount,
        notes: notes || {}
      }
    }
    console.error('[Razorpay] createSubscription error:', error)
    throw error
  }
}

/**
 * Creates an order on the platform gateway for one-time payments
 */
export async function createOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes: any
): Promise<any> {
  const isDev = process.env.NODE_ENV === 'development'
  const { client: razorpay, isMock } = await getRazorpay()

  if (isMock && isDev) {
    console.log('[Razorpay Mock] Creating mock order for amount:', amount)
    return {
      id: 'order_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
      amount,
      currency,
      receipt,
      notes: notes || {},
      status: 'created'
    }
  }

  try {
    return await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: notes || {}
    })
  } catch (error: any) {
    if (isDev && (error.statusCode === 401 || error.message?.includes('auth') || error.description?.includes('Authentication'))) {
      console.warn('[Razorpay] Auth failed. Falling back to mock order.')
      return {
        id: 'order_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
        amount,
        currency,
        receipt,
        notes: notes || {},
        status: 'created'
      }
    }
    console.error('[Razorpay] createOrder error:', error)
    throw error
  }
}

/**
 * Creates a Razorpay Invoice (GST invoice + underlying order for Checkout).
 * Amounts are in paise and EXCLUSIVE of GST — an 18% GST line (SAC 998314)
 * is added here. The returned invoice carries `order_id` (open standard
 * Checkout with it) and `short_url` (hosted invoice, downloadable after payment).
 */
export async function createGstInvoice(params: {
  customer: {
    name: string
    email?: string
    contact?: string
    gstin?: string
    billing_address?: {
      line1?: string
      city?: string
      state?: string
      zipcode?: string
      country?: string
    }
    shipping_address?: {
      line1?: string
      city?: string
      state?: string
      zipcode?: string
      country?: string
    }
  }
  lineItemName: string
  description?: string
  amountInPaise: number
  receipt: string
  notes?: any
  /** true → amountInPaise is the final price; GST is carved out of it.
   *  false (default) → 18% GST is added on top of amountInPaise. */
  gstInclusive?: boolean
  /** Seller identification block printed on the invoice (terms section). */
  sellerTerms?: string
  /** Bill-To block printed on the invoice (comment section). Razorpay dedupes
   *  customers by contact/email and then ignores inline billing_address, so
   *  the address must travel on the invoice itself to be visible. */
  billToText?: string
  /** Invoice issue date (defaults to now) — rendered as the invoice date. */
  issuedAt?: Date
  /** Payment-link expiry; doubles as the printed due date. */
  expireBy?: Date
}): Promise<{ id: string; order_id: string; short_url: string; amount: number }> {
  const isDev = process.env.NODE_ENV === 'development'
  const { client: razorpay, isMock } = await getRazorpay()

  const { basePaise: baseInPaise, gstPaise: gstInPaise, totalPaise: totalInPaise } =
    gstBreakupPaise(params.amountInPaise, !!params.gstInclusive)

  if (isMock && isDev) {
    console.log('[Razorpay Mock] Creating mock GST invoice, total:', totalInPaise)
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 14)
    return {
      id: 'inv_mock_' + suffix,
      order_id: 'order_mock_' + suffix,
      short_url: 'https://rzp.io/i/mock_' + suffix,
      amount: totalInPaise
    }
  }

  try {
    const invoice = await (razorpay as any).invoices.create({
      type: 'invoice',
      currency: 'INR',
      receipt: params.receipt,
      customer: params.customer,
      line_items: [
        {
          name: params.lineItemName,
          description: params.description || '',
          amount: baseInPaise,
          quantity: 1
        },
        // Intra/inter-state split shown explicitly (Razorpay's hosted invoice
        // has no native tax table): CGST + SGST at 9% each. Paise rounding:
        // SGST takes the remainder so the two always sum to the exact GST.
        {
          name: 'CGST @ 9%',
          amount: Math.floor(gstInPaise / 2),
          quantity: 1
        },
        {
          name: 'SGST @ 9% (SAC 998314)',
          amount: gstInPaise - Math.floor(gstInPaise / 2),
          quantity: 1
        }
      ],
      date: Math.floor((params.issuedAt ?? new Date()).getTime() / 1000),
      expire_by: params.expireBy ? Math.floor(params.expireBy.getTime() / 1000) : undefined,
      sms_notify: 0,
      email_notify: 0,
      terms: params.sellerTerms || undefined,
      comment: params.billToText || undefined,
      notes: params.notes || {}
    })

    // Best-effort: keep the deduped customer record's GSTIN current so future
    // invoices show it in customer_details too.
    if (params.customer.gstin && invoice.customer_details?.id) {
      await (razorpay as any).customers
        .edit(invoice.customer_details.id, { gstin: params.customer.gstin })
        .catch(() => {})
    }
    return {
      id: invoice.id,
      order_id: invoice.order_id,
      short_url: invoice.short_url,
      amount: invoice.amount
    }
  } catch (error: any) {
    if (isDev && (error.statusCode === 401 || error.message?.includes('auth') || error.description?.includes('Authentication'))) {
      console.warn('[Razorpay] Auth failed. Falling back to mock GST invoice.')
      const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      return {
        id: 'inv_mock_' + suffix,
        order_id: 'order_mock_' + suffix,
        short_url: 'https://rzp.io/i/mock_' + suffix,
        amount: totalInPaise
      }
    }
    console.error('[Razorpay] createGstInvoice error:', error)
    throw error
  }
}

/**
 * Fetches a payment from the Razorpay API — authenticated server-side check
 * used to verify invoice-backed Checkout payments, whose callback carries
 * invoice fields instead of an order signature.
 */
export async function fetchPayment(paymentId: string): Promise<{
  id: string
  status: string
  order_id: string | null
  invoice_id: string | null
  amount: number
} | null> {
  if (paymentId?.startsWith('pay_mock_') && process.env.NODE_ENV === 'development') {
    return { id: paymentId, status: 'captured', order_id: null, invoice_id: null, amount: 0 }
  }
  try {
    const { client: razorpay } = await getRazorpay()
    const payment: any = await razorpay.payments.fetch(paymentId)
    return {
      id: payment.id,
      status: payment.status,
      order_id: payment.order_id ?? null,
      invoice_id: payment.invoice_id ?? null,
      amount: Number(payment.amount)
    }
  } catch (error) {
    console.error('[Razorpay] fetchPayment error:', error)
    return null
  }
}

/**
 * Fetches all payments made against an order — used to reconcile pending
 * transactions when the Checkout callback never reached us (redirect flows).
 */
export async function fetchOrderPayments(orderId: string): Promise<
  { id: string; status: string; amount: number }[]
> {
  if (orderId?.startsWith('order_mock_')) return []
  try {
    const { client: razorpay } = await getRazorpay()
    const res: any = await razorpay.orders.fetchPayments(orderId)
    return (res.items || []).map((p: any) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount)
    }))
  } catch (error) {
    console.error('[Razorpay] fetchOrderPayments error:', error)
    return []
  }
}

/**
 * Verifies the signature of a transaction response
 */
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  if (orderId?.startsWith('order_mock_') && process.env.NODE_ENV === 'development') {
    console.log('[Razorpay Mock] Automatically verifying mock payment:', paymentId)
    return true
  }

  try {
    const { keySecret: secret, isMock } = await getRazorpay()
    if (!secret || isMock) {
      // Fail closed: without a real key secret every signature would be
      // verifiable against a known fallback string.
      console.error('[Razorpay] key secret not configured; rejecting payment verification')
      return false
    }
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    const a = Buffer.from(generatedSignature, 'hex')
    const b = Buffer.from(signature, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch (error) {
    console.error('[Razorpay] verifyPayment error:', error)
    return false
  }
}

/**
 * Creates a school order using the school's own decrypted keys
 */
export async function createSchoolOrder(params: {
  schoolId: string
  amount: number
  currency: string
  receipt: string
  notes?: any
}): Promise<any> {
  const isDev = process.env.NODE_ENV === 'development'
  try {
    // 1. Fetch school & linked organization
    const school = await prisma.school.findFirst({
      where: { id: params.schoolId, deletedAt: null },
      include: { organization: true }
    })

    if (!school) {
      throw new Error(`School ${params.schoolId} not found`)
    }

    if (!school.orgId || !school.organization) {
      throw new Error(`School ${params.schoolId} has no linked organization`)
    }

    // 2. Fetch and decrypt Razorpay keys from organization settings
    const settings = school.organization.settings as any
    const encryptedKeyId = settings?.razorpayKeyIdEncrypted || settings?.razorpay_key_id
    const encryptedKeySecret = settings?.razorpayKeySecretEncrypted || settings?.razorpay_key_secret

    if (!encryptedKeyId || !encryptedKeySecret) {
      throw new Error('School Razorpay credentials are not configured')
    }

    let keyId = encryptedKeyId
    let keySecret = encryptedKeySecret

    // Decrypt if it has a ':' indicating encryption output format
    if (encryptedKeyId.includes(':')) {
      keyId = decrypt(encryptedKeyId)
    }
    if (encryptedKeySecret.includes(':')) {
      keySecret = decrypt(encryptedKeySecret)
    }

    // 3. Initialize school-specific client
    const schoolRazorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })

    // 4. Create the order
    return await schoolRazorpay.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {}
    })
  } catch (error: any) {
    if (isDev && (error.statusCode === 401 || error.message?.includes('auth') || error.description?.includes('Authentication'))) {
      console.warn('[Razorpay] School client Auth failed. Falling back to mock school order.')
      return {
        id: 'order_mock_school_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes || {},
        status: 'created'
      }
    }
    console.error('[Razorpay] createSchoolOrder error:', error)
    throw error
  }
}

/**
 * Cancels a subscription immediately or at the end of the billing period
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtEnd: boolean
): Promise<any> {
  const isDev = process.env.NODE_ENV === 'development'
  if (subscriptionId?.startsWith('sub_mock_') && isDev) {
    console.log('[Razorpay Mock] Cancelling mock subscription:', subscriptionId)
    return {
      id: subscriptionId,
      status: 'cancelled'
    }
  }

  try {
    const { client: razorpay } = await getRazorpay()
    return await razorpay.subscriptions.cancel(subscriptionId, cancelAtEnd)
  } catch (error: any) {
    if (isDev && (error.statusCode === 401 || error.message?.includes('auth') || error.description?.includes('Authentication'))) {
      console.warn('[Razorpay] Auth failed. Falling back to mock cancellation.')
      return {
        id: subscriptionId,
        status: 'cancelled'
      }
    }
    console.error('[Razorpay] cancelSubscription error:', error)
    throw error
  }
}
