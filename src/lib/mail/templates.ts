export function welcomeSchoolTemplate(params: {
  schoolName: string
  adminName: string
  loginUrl: string
  trialDays: number
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1565D8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Welcome to Vidhyaan! 🎉</h1>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Hi ${params.adminName},</p>
        <p>We are absolutely thrilled to welcome you to the Vidhyaan platform! Your CRM space is initialized and ready for your team.</p>
        
        <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #1565D8; border-radius: 0 8px 8px 0;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">School / Center Account:</strong>
          <span style="font-size: 15px; color: #334155;">${params.schoolName}</span>
        </div>

        <p>Your free trial is active for the next <strong>${params.trialDays} days</strong>. Take control of admissions, fee schedules, student records, and public search marketing listings today.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.loginUrl}" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(21, 101, 216, 0.25);">Login to CRM Dashboard</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 13px; color: #64748b;">Need help getting started? Reach us at any time at <a href="mailto:support@vidhyaan.com" style="color: #1565D8; text-decoration: none;">support@vidhyaan.com</a>.</p>
      </div>
    </div>
  `
}

export function otpEmailTemplate(params: {
  otp: string
  expiryMinutes: number
  purpose: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">Verification Code</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Request for ${params.purpose}</p>
      </div>
      <div style="padding: 24px; text-align: center; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1565D8; margin-bottom: 12px;">
          ${params.otp}
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 0;">This OTP code expires in <strong>${params.expiryMinutes} minutes</strong>.</p>
      </div>
      <div style="padding: 20px 0; color: #475569; font-size: 14px; line-height: 1.5;">
        <p style="margin: 0; font-weight: bold; color: #dc2626;">⚠️ Security Notice:</p>
        <p style="margin-top: 4px; font-size: 13px; color: #64748b;">Never share this OTP code with anyone, including representatives of Vidhyaan. We will never ask for your code over phone, email, or chat.</p>
      </div>
    </div>
  `
}

export function enquiryNotificationTemplate(params: {
  schoolName: string
  parentName: string
  phone: string
  childName: string
  gradeSought: string
  message: string
  crmLink: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">New Enquiry Received! 🏫</h2>
      </div>
      <div style="color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Hi Admin at ${params.schoolName},</p>
        <p>A parent has submitted a directory profile enquiry for admission. Here are the details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tbody>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 35%;">Parent Name:</td>
              <td style="padding: 8px 0; color: #0f172a;">${params.parentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Contact Phone:</td>
              <td style="padding: 8px 0; color: #0f172a;">+91 ${params.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Child Name:</td>
              <td style="padding: 8px 0; color: #0f172a;">${params.childName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Grade Sought:</td>
              <td style="padding: 8px 0; color: #0f172a;">${params.gradeSought}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #0f172a; white-space: pre-wrap;">${params.message || 'No additional message.'}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.crmLink}" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in CRM</a>
        </div>
      </div>
    </div>
  `
}

export function enquiryConfirmationTemplate(params: {
  parentName: string
  schoolName: string
  schoolPhone: string
  referenceId: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="padding: 20px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 24px; text-align: center;">
        <h2 style="color: #166534; margin: 0; font-size: 18px; font-weight: bold;">Enquiry Sent Successfully!</h2>
      </div>
      <div style="color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Dear ${params.parentName},</p>
        <p>Your enquiry has been successfully delivered to <strong>${params.schoolName}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #edf2f7;">
          <p style="margin: 0 0 8px 0;"><strong>School Contact Info:</strong> +91 ${params.schoolPhone}</p>
          <p style="margin: 0;"><strong>Enquiry Reference ID:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${params.referenceId}</code></p>
        </div>

        <p>The school's administrative office will review your details and contact you directly via call or email soon.</p>
      </div>
    </div>
  `
}

export function schoolVerifiedTemplate(params: {
  schoolName: string
  adminName: string
  listingUrl: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding: 20px; background-color: #f0fdf4; border-radius: 8px 8px 0 0; border-bottom: 4px solid #22c55e;">
        <div style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-bottom: 12px;">VERIFIED</div>
        <h1 style="color: #14532d; margin: 0; font-size: 22px;">Your Listing is Live! 🏫</h1>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Hi ${params.adminName},</p>
        <p>Great news! Your school listing for <strong>${params.schoolName}</strong> has been verified by the Vidhyaan operations team and is now live on our marketplace.</p>
        
        <p>Parents can now locate your center, RSVP to events, leave ratings, and directly submit admission enquiries.</p>
        
        <div style="text-align: center; margin: 30px 0; gap: 15px; display: flex; justify-content: center;">
          <a href="${params.listingUrl}" style="display: inline-block; background-color: #ffffff; color: #1e293b; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #cbd5e1; font-size: 13px;">View Listing Profile</a>
          <a href="${params.listingUrl.split('/schools/')[0]}/login" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Go to CRM Dashboard</a>
        </div>
      </div>
    </div>
  `
}

export function trialEndingTemplate(params: {
  schoolName: string
  adminName: string
  daysLeft: number
  upgradeUrl: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; border-bottom: 4px solid #f59e0b;">
        <h2 style="color: #78350f; margin: 0; font-size: 20px;">Vidhyaan Trial Period Ending ⚠️</h2>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Hi ${params.adminName},</p>
        <p>This is a notification that the trial period for <strong>${params.schoolName}</strong> will expire in <strong style="color: #d97706; font-size: 16px;">${params.daysLeft} days</strong>.</p>
        
        <p>To avoid service disruption, keep CRM dashboards active, and continue receiving leads, please upgrade your plan.</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <strong style="color: #0f172a; display: block; margin-bottom: 8px;">Premium Features you will lose on expiry:</strong>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 6px;">Admission pipeline automation</li>
            <li style="margin-bottom: 6px;">Automated invoice & fee receipts generation</li>
            <li style="margin-bottom: 6px;">SMS & WhatsApp parent notifications</li>
            <li>Advanced reports & analytics exports</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.upgradeUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upgrade Account Now</a>
        </div>
      </div>
    </div>
  `
}

export function paymentFailedTemplate(params: {
  schoolName: string
  amount: number
  retryUrl: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; border-bottom: 4px solid #ef4444;">
        <h2 style="color: #991b1b; margin: 0; font-size: 20px;">Payment Collection Failure 🚨</h2>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Hi Billing Contact,</p>
        <p>We attempted to process your subscription payment for <strong>${params.schoolName}</strong>, but the transaction was declined by your bank.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fcfcfc; border: 1px solid #edf2f7;">
          <tbody>
            <tr>
              <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Amount Due:</td>
              <td style="padding: 10px 16px; font-weight: bold; color: #ef4444; font-size: 16px;">INR ${params.amount}</td>
            </tr>
            <tr style="border-top: 1px solid #edf2f7;">
              <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Status:</td>
              <td style="padding: 10px 16px; color: #991b1b; font-weight: bold;">DECLINED / FAILED</td>
            </tr>
          </tbody>
        </table>

        <p>Please click the button below to update your payment details or retry the transaction manually.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.retryUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Retry Payment</a>
        </div>
      </div>
    </div>
  `
}

export function feeInvoiceTemplate(params: {
  studentName: string
  schoolName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  paymentLink: string
}): string {
  const isSoon = new Date(params.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Fee Invoice Outstanding 📄</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">${params.schoolName}</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Dear Parent,</p>
        <p>Here are the outstanding school fee invoice details generated for your ward <strong>${params.studentName}</strong>:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #f1f5f9;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 16px; font-weight: bold; color: #475569; width: 40%;">Invoice No:</td>
              <td style="padding: 10px 16px; color: #0f172a; font-family: monospace;">${params.invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Amount Due:</td>
              <td style="padding: 10px 16px; font-weight: bold; color: #1e293b; font-size: 16px;">INR ${params.amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; font-weight: bold; color: #475569;">Due Date:</td>
              <td style="padding: 10px 16px; color: #0f172a; font-weight: bold;">${new Date(params.dueDate).toLocaleDateString()}</td>
            </tr>
          </tbody>
        </table>

        ${isSoon ? `
          <div style="margin: 15px 0; padding: 12px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; color: #b45309; font-size: 13px; font-weight: bold; text-align: center;">
            ⚠️ Payment Due Soon! Please settle the invoice prior to the deadline to avoid late fees.
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.paymentLink}" style="display: inline-block; background-color: #1565D8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Invoice Now</a>
        </div>
      </div>
    </div>
  `
}

export function contactSupportNotificationTemplate(params: {
  name: string
  email: string
  phone: string
  role: string
  subject?: string
  message: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1565D8; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">New Contact Form Enquiry 📨</h2>
      </div>
      <div style="color: #334155; line-height: 1.6; font-size: 14px;">
        <p>A new support request has been submitted on the Vidhyaan Contact Us page:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tbody>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 35%;">Submitter Name:</td>
              <td style="padding: 8px 0; color: #0f172a;">${params.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${params.email}">${params.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
              <td style="padding: 8px 0; color: #0f172a;">+91 ${params.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Role / User Type:</td>
              <td style="padding: 8px 0; color: #0f172a; text-transform: capitalize;">${params.role}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
              <td style="padding: 8px 0; color: #0f172a;">${params.subject || 'No Subject'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #0f172a; white-space: pre-wrap;">${params.message}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

export function contactUserConfirmationTemplate(params: {
  name: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="padding: 20px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 24px; text-align: center;">
        <h2 style="color: #166534; margin: 0; font-size: 18px; font-weight: bold;">Message Received!</h2>
      </div>
      <div style="color: #334155; line-height: 1.6; font-size: 14px;">
        <p>Dear ${params.name},</p>
        <p>Thank you for contacting Vidhyaan. We have received your message and support ticket.</p>
        
        <p>Our support team is reviewing your request and we will get back to you within 24 hours.</p>
        
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0;">This is an automated confirmation of your request. Please do not reply directly to this email.</p>
      </div>
    </div>
  `
}
