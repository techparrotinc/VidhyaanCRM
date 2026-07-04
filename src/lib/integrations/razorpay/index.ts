import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
})

/**
 * Creates a subscription on the platform gateway
 */
export async function createSubscription(
  planId: string,
  totalCount: number,
  notes: any
): Promise<any> {
  const isDev = process.env.NODE_ENV === 'development'
  const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_key'

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
  const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_key'

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
 * Verifies the signature of a transaction response
 */
export function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (orderId?.startsWith('order_mock_') && process.env.NODE_ENV === 'development') {
    console.log('[Razorpay Mock] Automatically verifying mock payment:', paymentId)
    return true
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      // Fail closed: without the real key secret every signature would be
      // verifiable against a known fallback string.
      console.error('[Razorpay] RAZORPAY_KEY_SECRET not configured; rejecting payment verification')
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
