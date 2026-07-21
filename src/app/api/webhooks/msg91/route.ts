import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    
    // Verify MSG91 signature if authkey is configured and signature header exists
    const signature = req.headers.get('msg91-signature')
    const authKey = process.env.MSG91_AUTH_KEY

    if (authKey && signature) {
      const hmac = crypto.createHmac('sha256', authKey)
      hmac.update(rawBody)
      const expectedSignature = hmac.digest('hex')
      
      if (signature !== expectedSignature) {
        console.warn('[MSG91 Webhook] Invalid signature. Expected:', expectedSignature, 'Got:', signature)
      }
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (parseErr) {
      console.error('[MSG91 Webhook] Failed to parse body as JSON:', parseErr)
      return NextResponse.json({ success: true, message: 'Invalid JSON parsed but bypassed' })
    }

    const { requestId, status, mobile } = payload

    console.log(`[MSG91 Webhook] Ingestion report: mobile=${mobile}, status=${status}, requestId=${requestId}`)

    if (requestId) {
      // Find communication log by MSG91 provider ref
      const commLog = await prisma.communicationLog.findFirst({
        where: { providerRef: requestId }
      })

      if (commLog) {
        await prisma.communicationLog.update({
          where: { id: commLog.id },
          data: { status }
        })
        console.log(`[MSG91 Webhook] Updated CommunicationLog ${commLog.id} status to: ${status}`)
      }

      // Per-campaign SMS delivery tracking: the requestId was stored as the
      // recipient's providerMessageId at send time.
      const s = String(status ?? '').toLowerCase()
      const mapped =
        /deliver/.test(s) ? 'DELIVERED'
        : /(fail|reject|block|expire|undeliver|invalid)/.test(s) ? 'FAILED'
        : null
      if (mapped) {
        await prisma.campaignRecipient
          .updateMany({
            where: {
              providerMessageId: requestId,
              // never downgrade a terminal state
              status: mapped === 'DELIVERED' ? { in: ['SENT'] } : { notIn: ['FAILED'] },
            },
            data: mapped === 'DELIVERED'
              ? { status: 'DELIVERED', deliveredAt: new Date() }
              : { status: 'FAILED', failureReason: `SMS ${status}` },
          })
          .catch((err) => console.error('[MSG91 Webhook] recipient update failed:', err))
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[MSG91 Webhook] Error processing report:', error)
    // Return 200 always as requested so MSG91 doesn't retry on non-200
    return NextResponse.json({ success: true, error: error.message || 'Internal process error' })
  }
}
