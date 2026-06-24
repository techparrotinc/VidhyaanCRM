import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { sendEmail } from '@/lib/integrations/resend'

export type NotificationType =
  | 'LEAD_RECEIVED'
  | 'LEAD_FOLLOWUP_DUE'
  | 'ADMISSION_STAGE_CHANGED'
  | 'FEE_PAYMENT_RECEIVED'
  | 'FEE_OVERDUE'
  | 'TRIAL_ENDING'
  | 'PAYMENT_FAILED'
  | 'PROFILE_APPROVED'

export interface CreateNotificationParams {
  orgId: string
  recipientType: 'USER' | 'PARENT'
  recipientId: string
  type: NotificationType
  title: string
  body: string
  data?: any
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { orgId, recipientType, recipientId, type, title, body, data } = params

    // 1. Create Notification record
    const notification = await prisma.notification.create({
      data: {
        orgId,
        recipientType,
        recipientId,
        title,
        body,
        data: data || {},
      }
    })

    // 2. Clear Redis cache for the unread count
    const cacheKey = `unread_notification_count:${recipientId}`
    await redis.del(cacheKey)

    // 3. Determine category based on type
    let category = 'system'
    if (type === 'LEAD_RECEIVED' || type === 'LEAD_FOLLOWUP_DUE') {
      category = 'leads'
    } else if (type === 'ADMISSION_STAGE_CHANGED') {
      category = 'admissions'
    } else if (type === 'FEE_PAYMENT_RECEIVED' || type === 'FEE_OVERDUE' || type === 'PAYMENT_FAILED') {
      category = 'fees'
    }

    // 4. Retrieve email address & check notification preferences
    let recipientEmail: string | null = null
    let emailEnabled = true

    if (recipientType === 'USER') {
      const user = await prisma.user.findUnique({
        where: { id: recipientId }
      })
      if (user) {
        recipientEmail = user.email
        
        // Check preferences
        const preference = await prisma.notificationPreference.findUnique({
          where: {
            userId_category: {
              userId: recipientId,
              category
            }
          }
        })
        if (preference) {
          emailEnabled = preference.email
        }
      }
    } else if (recipientType === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { id: recipientId },
        include: { user: true }
      })
      if (parent && parent.user) {
        recipientEmail = parent.user.email
      }
    }

    // 5. Send email via Resend if enabled and email address exists
    if (emailEnabled && recipientEmail) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const relativeHref = data?.href || ''
      const absoluteUrl = relativeHref ? `${baseUrl}${relativeHref}` : baseUrl

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #1565D8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">Vidhyaan Notification</h1>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p style="font-size: 16px; margin-top: 0; color: #0f172a; font-weight: 600;">${title}</p>
            <p style="font-size: 14px;">${body}</p>
            ${relativeHref ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${absoluteUrl}" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Details</a>
              </div>
            ` : ''}
          </div>
        </div>
      `
      
      await sendEmail(recipientEmail, title, htmlBody)
    }

    return notification
  } catch (error) {
    console.error('Failed to trigger notification:', error)
  }
}
