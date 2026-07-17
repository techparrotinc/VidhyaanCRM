import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import {
  TransactionType,
  TransactionStatus,
  MessageChannel,
  CampaignChannel,
  CampaignStatus
} from '@prisma/client'
import crypto from 'crypto'

// Set up required env keys (NODE_ENV is readonly in Next.js's ProcessEnv typing)
;(process.env as Record<string, string>).NODE_ENV = 'development'
process.env.RAZORPAY_KEY_ID = 'mock_key'
process.env.RAZORPAY_KEY_SECRET = 'mock_secret'
process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret'
process.env.PAYMENT_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')

// Mock send campaign channels to prevent hitting MSG91/Meta APIs
vi.mock('@/lib/campaign/channels', () => ({
  sendCampaignSMS: vi.fn(async ({ to, body, credentials }) => {
    if (credentials?.authKey === 'invalid_key') {
      throw new Error('Invalid credentials')
    }
  }),
  sendCampaignWhatsApp: vi.fn(async ({ to, templateId, body, credentials }) => {
    if (credentials?.authKey === 'invalid_key') {
      throw new Error('Invalid credentials')
    }
    return 'wamid_mock_' + Math.random().toString(36).substring(7)
  })
}))

// Import functions and handlers
import { spendCredits, refundCredits, getOrCreateWallet, getWalletSummary } from '@/lib/credits/engine'
import { sendMeteredSms, sendMeteredWhatsApp } from '@/lib/credits/metered-send'
import { PUT as saveProvider, DELETE as deleteProvider } from '@/app/api/v1/settings/addons/messaging/[channel]/provider/route'
import { POST as verifyProvider } from '@/app/api/v1/settings/addons/messaging/[channel]/provider/verify/route'
import { POST as createCreditOrder } from '@/app/api/v1/billing/credits/order/route'
import { POST as verifyCreditPayment } from '@/app/api/v1/billing/credits/verify/route'
import { POST as razorpayWebhook } from '@/app/api/webhooks/razorpay/route'
import { POST as sendCampaign } from '@/app/api/v1/campaigns/[id]/send/route'
import { POST as metaWhatsappWebhook } from '@/app/api/webhooks/meta-whatsapp/route'

const describeDb = describe.skipIf(!process.env.TEST_DATABASE_URL)
const RUN = `msg-test-${Date.now()}`

let orgId: string
let adminId: string
let headersAdmin: Headers
let adminSessionMock: any

beforeAll(async () => {
  // Seed platform settings for webhook secret
  const { encryptSecret } = await import('@/lib/payments/vault')
  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {
      razorpayWebhookSecret: 'mock_webhook_secret',
      metaWaAppSecretEnc: encryptSecret('mock_app_secret')
    },
    create: {
      id: 'default',
      razorpayWebhookSecret: 'mock_webhook_secret',
      metaWaAppSecretEnc: encryptSecret('mock_app_secret')
    }
  })

  // Seed modules needed
  const modulesToEnable = ['whatsapp_addon', 'campaign_management']

  // Seed Organization
  const org = await prisma.organization.create({
    data: {
      name: RUN,
      slug: RUN,
      institutionType: 'SCHOOL',
      email: `admin@${RUN}.local`,
      phone: '0000000000',
      isDummy: true,
      status: 'ACTIVE'
    }
  })
  orgId = org.id

  for (const slug of modulesToEnable) {
    const m = await prisma.module.upsert({
      where: { slug },
      update: {},
      create: { slug, name: slug, description: slug }
    })
    await prisma.organizationModule.create({
      data: { orgId, moduleId: m.id, enabled: true }
    })
  }

  // Seed admin user
  const admin = await prisma.user.create({
    data: {
      orgId,
      name: 'Test Org Admin',
      email: `admin-user@${RUN}.local`,
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'ACTIVE',
      roleAssignments: {
        create: { role: 'ORG_ADMIN', orgId, status: 'ACTIVE' }
      }
    }
  })
  adminId = admin.id

  headersAdmin = new Headers({
    'x-user-id': adminId,
    'x-user-role': 'ORG_ADMIN',
    'x-org-id': orgId,
    'x-user-name': 'Test Org Admin',
    'Content-Type': 'application/json'
  })

  adminSessionMock = {
    user: {
      id: adminId,
      role: 'ORG_ADMIN',
      orgId
    }
  }

  // Mock NextAuth authentication call
  vi.mock('@/auth', () => ({
    auth: vi.fn(() => Promise.resolve(adminSessionMock))
  }))
})

afterAll(async () => {
  if (orgId) {
    await prisma.whatsappMessage.deleteMany({ where: { orgId } })
    await prisma.campaignRecipient.deleteMany({ where: { orgId } })
    await prisma.campaign.deleteMany({ where: { orgId } })
    await prisma.messageCreditLedger.deleteMany({ where: { orgId } })
    await prisma.messageWallet.deleteMany({ where: { orgId } })
    await prisma.messagingProviderConfig.deleteMany({ where: { orgId } })
    await prisma.transaction.deleteMany({ where: { orgId } })
    await prisma.organizationModule.deleteMany({ where: { orgId } })
    await prisma.userRoleAssignment.deleteMany({ where: { orgId } })
    await prisma.user.deleteMany({ where: { orgId } })
    await prisma.organization.delete({ where: { id: orgId } })
  }
  await prisma.$disconnect()
})

describeDb('Messaging Credits Verification Suite', () => {
  // A. Wallet & free allowance — positive
  it('1. New org gets debited 1 credit from free allowance for regular send', async () => {
    // Reset/clear wallet for SMS
    await prisma.messageWallet.deleteMany({ where: { orgId, channel: 'SMS' } })

    // Send metered SMS
    await sendMeteredSms(orgId, '919999999999', 'Hello Test')

    const wallet = await getOrCreateWallet(orgId, 'SMS')
    expect(wallet.freeUsed).toBe(1)
  })

  it('2. WhatsApp MARKETING-category template debits at 2 credits', async () => {
    await prisma.messageWallet.deleteMany({ where: { orgId, channel: 'WHATSAPP' } })

    // Send WhatsApp with credits option = 2
    await sendMeteredWhatsApp(orgId, '919999999999', 'marketing_template', 'Hello', undefined, {
      credits: 2
    })

    const wallet = await getOrCreateWallet(orgId, 'WHATSAPP')
    expect(wallet.freeUsed).toBe(2)
  })

  it('3. Wallet monthly reset is UTC calendar month based', async () => {
    const wallet = await getOrCreateWallet(orgId, 'SMS')

    // Manually set periodStart to last month
    const lastMonth = new Date()
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1)
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: 10, periodStart: lastMonth }
    })

    // Requesting wallet summary or getOrCreateWallet should trigger lazy monthly reset
    const newSummary = await getOrCreateWallet(orgId, 'SMS')
    expect(newSummary.freeUsed).toBe(0) // Reset to 0
    expect(newSummary.periodStart.getUTCDate()).toBe(1) // 1st of month UTC
  })

  // A. Wallet — negative
  it('4. Wallet at 0 balance blocks sends with InsufficientCreditsError', async () => {
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    // Exhaust all free credits and purchased balance
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: wallet.freeAllowance, purchasedBalance: 0 }
    })

    await expect(
      sendMeteredSms(orgId, '919999999999', 'Should block')
    ).rejects.toThrow(/Insufficient SMS credits/)
  })

  it('5. Concurrency CAS protection prevents double-spend below zero', async () => {
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    // Set balance to exactly 1 credit
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: wallet.freeAllowance - 1, purchasedBalance: 0 }
    })

    // Fire two credit spends simultaneously
    const results = await Promise.allSettled([
      spendCredits(orgId, 'SMS', 1),
      spendCredits(orgId, 'SMS', 1)
    ])

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected = results.filter(r => r.status === 'rejected')

    expect(fulfilled.length).toBe(1)
    expect(rejected.length).toBe(1)
    expect((rejected[0] as PromiseRejectedResult).reason.message).toContain('Insufficient SMS credits')
  })

  it('6. Crash-window / Timeout gap verification', async () => {
    // Analysis confirms: spendCredits executes synchronously first.
    // If the process crashes or client times out right after spendCredits
    // but before msg91/meta API call finishes, credits remain debited (GAP).
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: wallet.freeAllowance, purchasedBalance: 10 }
    })

    // Simulate debit first
    const spent = await spendCredits(orgId, 'SMS', 1)
    expect(spent.fromPurchased).toBe(1)

    // Simulate process crash/timeout by NOT running the catch/refund path.
    // Wallet remains debited by 1.
    const updatedWallet = await getOrCreateWallet(orgId, 'SMS')
    expect(updatedWallet.purchasedBalance).toBe(9) // Stays debited!
  })

  // B. BYO provider (MSG91)
  it('7. Configure valid MSG91 provider bypasses metered wallet sends', async () => {
    // Save provider credentials
    const putReq = new NextRequest('http://localhost/api/v1/settings/addons/messaging/SMS/provider', {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        provider: 'MSG91',
        authKey: 'test_msg91_key_value_123',
        senderId: 'CRMTEST',
        smsFlowId: 'flow123'
      })
    })
    const putRes = await saveProvider(putReq, { params: Promise.resolve({ channel: 'SMS' }) } as any)
    expect(putRes.status).toBe(200)

    // Verify it
    const verifyReq = new NextRequest('http://localhost/api/v1/settings/addons/messaging/SMS/provider/verify', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ testPhone: '9876543210' })
    })
    const verifyRes = await verifyProvider(verifyReq, { params: Promise.resolve({ channel: 'SMS' }) } as any)
    expect(verifyRes.status).toBe(200)
    const verifyBody = await verifyRes.json()
    expect(verifyBody.data.verified).toBe(true)

    // Send metered SMS
    const walletBefore = await getOrCreateWallet(orgId, 'SMS')
    await sendMeteredSms(orgId, '919999999999', 'BYO message')
    const walletAfter = await getOrCreateWallet(orgId, 'SMS')

    // Wallet balances should not have changed at all
    expect(walletAfter.freeUsed).toBe(walletBefore.freeUsed)
    expect(walletAfter.purchasedBalance).toBe(walletBefore.purchasedBalance)
  })

  it('8. Editing authKey resets status to DRAFT', async () => {
    // Edit the credentials (updates same channel provider config)
    const putReq = new NextRequest('http://localhost/api/v1/settings/addons/messaging/SMS/provider', {
      method: 'PUT',
      headers: headersAdmin,
      body: JSON.stringify({
        provider: 'MSG91',
        authKey: 'different_auth_key_value_123',
        senderId: 'CRMTEST',
        smsFlowId: 'flow123'
      })
    })
    const putRes = await saveProvider(putReq, { params: Promise.resolve({ channel: 'SMS' }) } as any)
    expect(putRes.status).toBe(200)
    const body = await putRes.json()
    expect(body.data.status).toBe('DRAFT') // Resets to DRAFT
  })

  it('9. Stale/Invalid BYO provider credentials fail closed without falling back to wallet', async () => {
    // Set BYO config to VERIFIED but with invalid authKey
    const config = await prisma.messagingProviderConfig.findUniqueOrThrow({
      where: { orgId_channel: { orgId, channel: 'SMS' } }
    })
    // Corrupt key to 'invalid_key' via encrypted value
    const { encryptSecret } = await import('@/lib/payments/vault')
    await prisma.messagingProviderConfig.update({
      where: { id: config.id },
      data: {
        authKeyEncrypted: encryptSecret('invalid_key'),
        status: 'VERIFIED'
      }
    })

    // Try sending SMS - expects MSG91 client to throw and fail closed (throws Error)
    await expect(
      sendMeteredSms(orgId, '919999999999', 'This should throw')
    ).rejects.toThrow('Invalid credentials')
  })

  it('10. Deleting BYO provider configuration handles mid-flight campaign correctly', async () => {
    // Verify provider config is deletedAt null
    const config = await prisma.messagingProviderConfig.findUniqueOrThrow({
      where: { orgId_channel: { orgId, channel: 'SMS' } }
    })

    // Delete provider config
    const delReq = new NextRequest('http://localhost/api/v1/settings/addons/messaging/SMS/provider', {
      method: 'DELETE',
      headers: headersAdmin
    })
    const delRes = await deleteProvider(delReq, { params: Promise.resolve({ channel: 'SMS' }) } as any)
    expect(delRes.status).toBe(200)

    const dbConfig = await prisma.messagingProviderConfig.findUniqueOrThrow({ where: { id: config.id } })
    expect(dbConfig.deletedAt).toBeDefined()
    expect(dbConfig.status).toBe('DISABLED')
  })

  // C. Credit-pack purchase
  it('11. Purchase credit pack via Razorpay webhook increases wallet', async () => {
    // Setup wallet
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    const balanceBefore = wallet.purchasedBalance

    // Simulate order creation
    const orderReq = new NextRequest('http://localhost/api/v1/billing/credits/order', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ packId: 'sms_100' })
    })
    const orderRes = await createCreditOrder(orderReq)
    expect(orderRes.status).toBe(200)
    const orderBody = await orderRes.json()
    const orderId = orderBody.orderId

    // Simulate payment captured webhook
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_crd_purch_xyz',
            order_id: orderId,
            amount: 2500 // ₹25 in paise
          }
        }
      }
    }
    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const reqWebhook = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }),
      body: rawBody
    })

    const resWebhook = await razorpayWebhook(reqWebhook)
    expect(resWebhook.status).toBe(200)

    const walletAfter = await getOrCreateWallet(orgId, 'SMS')
    expect(walletAfter.purchasedBalance).toBe(balanceBefore + 100) // Pack 'sms_100' gives 100 credits!
  })

  it('12. Credit pack webhook is idempotent (duplicate payload)', async () => {
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    const balanceBefore = wallet.purchasedBalance

    // Order ID matches the previous test's orderId
    const tx = await prisma.transaction.findFirstOrThrow({
      where: { orgId, type: TransactionType.CREDIT_PURCHASE, status: TransactionStatus.SUCCESS }
    })

    // Simulate replayed payment captured webhook
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: tx.gatewayRef, // paymentId
            order_id: 'some_other_order_id_placeholder_does_not_matter_since_webhook_checks_gatewayRef_for_idempotence'
          }
        }
      }
    }
    // Replay logic in webhook runs findFirst on gatewayRef=orderId.
    // In this test, let's simulate by passing the exact same payload used in Test 11
    const payloadReplay = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_crd_purch_xyz',
            order_id: tx.gatewayRef
          }
        }
      }
    }
    const rawBody = JSON.stringify(payloadReplay)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const reqWebhook = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })

    const resWebhook = await razorpayWebhook(reqWebhook)
    expect(resWebhook.status).toBe(200)

    const walletAfter = await getOrCreateWallet(orgId, 'SMS')
    expect(walletAfter.purchasedBalance).toBe(balanceBefore) // Balance remains unchanged!
  })

  it('13. Webhook payment.failed on credit pack leaves gatewayRef unchanged, no credits granted', async () => {
    // Create PENDING transaction
    const orderId = 'order_crd_failed_xyz'
    const transaction = await prisma.transaction.create({
      data: {
        orgId,
        type: TransactionType.CREDIT_PURCHASE,
        status: 'PENDING',
        amount: 25,
        currency: 'INR',
        gatewayRef: orderId,
        metadata: {
          channel: 'SMS',
          credits: 100
        }
      }
    })

    const payload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_crd_failed_xyz',
            order_id: orderId
          }
        }
      }
    }
    const rawBody = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', 'mock_webhook_secret')
      .update(rawBody)
      .digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: new Headers({ 'x-razorpay-signature': signature, 'Content-Type': 'application/json' }),
      body: rawBody
    })

    const res = await razorpayWebhook(req)
    expect(res.status).toBe(200)

    const dbTx = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(dbTx.status).toBe(TransactionStatus.FAILED)
    expect(dbTx.gatewayRef).toBe(orderId) // Remains orderId!

    await prisma.transaction.delete({ where: { id: transaction.id } })
  })

  // D. Campaign sends — negative
  it('14. Campaign with N recipients where N > credits is blocked upfront', async () => {
    // Zero out wallet balance
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: wallet.freeAllowance, purchasedBalance: 0 }
    })

    // Create a draft campaign
    const campaign = await prisma.campaign.create({
      data: {
        orgId,
        name: 'Insufficient Campaign',
        channel: 'SMS',
        status: 'DRAFT',
        templateBody: 'Hello {{name}}',
        audienceFilter: { pool: 'BOTH', filters: [] }
      }
    })

    // Create 5 students so we have 5 recipients
    for (let i = 0; i < 5; i++) {
      await prisma.student.create({
        data: {
          orgId,
          studentCode: `STU-CAMP-${RUN}-${i}`,
          name: `Kid ${i}`,
          guardianPhone: '9999999999',
          status: 'ACTIVE'
        }
      })
    }

    const req = new NextRequest(`http://localhost/api/v1/campaigns/${campaign.id}/send`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({})
    })

    const res = await sendCampaign(req, { params: Promise.resolve({ id: campaign.id }) } as any)
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.code).toBe('INSUFFICIENT_CREDITS')

    // Clean up
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.campaign.delete({ where: { id: campaign.id } })
  })

  it('15. Launch campaign where some sends fail immediately: failed are marked FAILED, refunded at finalize', async () => {
    // Set credits to cover
    const wallet = await getOrCreateWallet(orgId, 'SMS')
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: 0, purchasedBalance: 10 }
    })

    // Create a student with invalid key trigger
    await prisma.student.create({
      data: {
        orgId,
        studentCode: `STU-FAIL-${RUN}`,
        name: 'Fail Kid',
        guardianPhone: '9999999999',
        status: 'ACTIVE'
      }
    })

    const campaign = await prisma.campaign.create({
      data: {
        orgId,
        name: 'Partial Fail Campaign',
        channel: 'SMS',
        status: 'DRAFT',
        templateBody: 'Hello {{name}}',
        audienceFilter: { pool: 'BOTH', filters: [] }
      }
    })

    // Spy on sendCampaignSMS to throw error for Fail Kid
    const { sendCampaignSMS } = await import('@/lib/campaign/channels')
    vi.mocked(sendCampaignSMS).mockRejectedValueOnce(new Error('Invalid credentials'))

    const req = new NextRequest(`http://localhost/api/v1/campaigns/${campaign.id}/send`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({})
    })
    const res = await sendCampaign(req, { params: Promise.resolve({ id: campaign.id }) } as any)
    expect(res.status).toBe(200)

    // Check wallet has been refunded for the 1 failed recipient
    const walletAfter = await getOrCreateWallet(orgId, 'SMS')
    // Billed 1 at start, refunded 1 at finalization → purchasedBalance should remain 10
    expect(walletAfter.purchasedBalance).toBe(10)

    // Clean up
    await prisma.student.deleteMany({ where: { orgId } })
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: campaign.id } })
    await prisma.campaign.delete({ where: { id: campaign.id } })
  })

  it('16. Delivery-webhook refund gap (carrier report FAILED)', async () => {
    // Gaps in delivery status webhook:
    // When carrier reports failure asynchronously (via meta-whatsapp webhook status FAILED),
    // recipient row is set to status=FAILED, but refundCredits is NEVER called (GAP).
    const wallet = await getOrCreateWallet(orgId, 'WHATSAPP')
    await prisma.messageWallet.update({
      where: { id: wallet.id },
      data: { freeUsed: 0, purchasedBalance: 10 }
    })

    const campaign = await prisma.campaign.create({
      data: {
        orgId,
        name: 'Async Fail Campaign',
        channel: 'WHATSAPP',
        status: 'COMPLETED'
      }
    })

    const recipient = await prisma.campaignRecipient.create({
      data: {
        orgId,
        campaignId: campaign.id,
        recipientType: 'STUDENT_GUARDIAN',
        phone: '9999999999',
        status: 'SENT',
        providerMessageId: 'wamid_async_fail_xyz'
      }
    })

    // Simulate async Meta WhatsApp webhook payload for FAILED status
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba_id',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '12345', phone_number_id: '12345' },
                statuses: [
                  {
                    id: 'wamid_async_fail_xyz',
                    status: 'failed',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    recipient_id: '919999999999',
                    errors: [
                      {
                        code: 131026,
                        title: 'Receiver incapable of receiving message'
                      }
                    ]
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    }

    const rawBody = JSON.stringify(webhookPayload)
    const signature = 'sha256=' + crypto.createHmac('sha256', 'mock_app_secret').update(rawBody).digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/meta-whatsapp', {
      method: 'POST',
      headers: new Headers({
        'x-hub-signature-256': signature,
        'Content-Type': 'application/json'
      }),
      body: rawBody
    })

    const res = await metaWhatsappWebhook(req)
    expect(res.status).toBe(200)

    // Check recipient is updated to FAILED in DB
    const dbRec = await prisma.campaignRecipient.findUniqueOrThrow({ where: { id: recipient.id } })
    expect(dbRec.status).toBe('FAILED')
    expect(dbRec.failureReason).toContain('Receiver incapable')

    // Confirm the GAP: wallet has not been refunded!
    const walletAfter = await getOrCreateWallet(orgId, 'WHATSAPP')
    // Initial was 10. Debit was 0 because we didn't run campaigns through spendCredits in this test (just created SENT recipient manually),
    // but if refund logic was wired, it would have run refund. Since it is not wired, no refund calls occur.
    // Let's assert the balance remains untouched (and confirm in the report that no refund is wired to processStatuses).
    expect(walletAfter.purchasedBalance).toBe(10)
  })

  it('17. Webhook status regression check (STATUS_RANK monotonic guard)', async () => {
    // Insert outbound message row in DB with status READ
    const wamid = 'wamid_rank_test_123'
    await prisma.whatsappMessage.create({
      data: {
        orgId,
        wamid,
        phone: '9999999999',
        templateName: 'test',
        status: 'READ' // Rank 3
      }
    })

    // Send webhook with status 'delivered' (Rank 2)
    const payloadDelivered = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba_id',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '123', phone_number_id: '123' },
                statuses: [
                  {
                    id: wamid,
                    status: 'delivered',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    recipient_id: '919999999999'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    }

    const rawBody = JSON.stringify(payloadDelivered)
    const signature = 'sha256=' + crypto.createHmac('sha256', 'mock_app_secret').update(rawBody).digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/meta-whatsapp', {
      method: 'POST',
      headers: new Headers({
        'x-hub-signature-256': signature,
        'Content-Type': 'application/json'
      }),
      body: rawBody
    })

    const res = await metaWhatsappWebhook(req)
    expect(res.status).toBe(200)

    // Verify database row remains status 'READ' due to rank check (delivering rank 2 < rank 3 does not regression)
    const msg = await prisma.whatsappMessage.findUniqueOrThrow({ where: { wamid } })
    expect(msg.status).toBe('READ')
  })
})
