import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { contactSupportNotificationTemplate, contactUserConfirmationTemplate } from '@/lib/mail/templates'
import { cleanPhoneNumber } from '@/lib/utils'

// Zod Validation Schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine((val) => {
    const cleaned = cleanPhoneNumber(val) as string
    return /^[6-9]\d{9}$/.test(cleaned)
  }, 'Please enter a valid 10-digit mobile number'),
  role: z.enum(['PARENT', 'SCHOOL', 'LEARNING_CENTER', 'OTHER']),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    const result = contactFormSchema.safeParse(body)
    if (!result.success) {
      const errorMsg = (result.error as any).errors[0]?.message || 'Invalid form input'
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      )
    }

    const { name, email, phone: rawPhone, role, subject, message } = result.data
    const phone = cleanPhoneNumber(rawPhone) as string

    // Destination for platform support emails
    const platformSupportEmail = process.env.PLATFORM_SUPPORT_EMAIL || 'support@vidhyaan.com'

    // 1. Send Support Notification Email
    try {
      await sendTransactionalEmail({
        to: platformSupportEmail,
        subject: `[Vidhyaan Support] ${subject || 'New Contact Us Submission'} 📨`,
        htmlBody: contactSupportNotificationTemplate({
          name,
          email,
          phone,
          role,
          subject,
          message,
        }),
        textBody: `New contact form submission from ${name} (${role}): ${message}`,
      })
    } catch (emailErr: any) {
      console.error('Failed to send support notification email:', emailErr?.message || emailErr)
    }

    // 2. Send Submitter Confirmation Email
    try {
      await sendTransactionalEmail({
        to: email,
        subject: 'Thank you for contacting Vidhyaan',
        htmlBody: contactUserConfirmationTemplate({ name }),
        textBody: `Dear ${name}, thank you for contacting Vidhyaan. We will get back to you within 24 hours.`,
      })
    } catch (emailErr: any) {
      console.error('Failed to send submitter confirmation email:', emailErr?.message || emailErr)
    }

    return NextResponse.json({
      success: true,
      message: "We'll get back within 24 hours",
    })
  } catch (error: any) {
    console.error('Contact API Error:', error?.message || error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
