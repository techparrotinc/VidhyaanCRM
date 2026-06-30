import axios from 'axios'

/**
 * sendOtpSms
 * Sends an OTP SMS via MSG91 OTP API.
 */
export async function sendOtpSms(
  phone: string,
  otp: string,
  templateId: string
): Promise<{ success: boolean }> {
  const authKey = process.env.MSG91_AUTH_KEY
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }
  try {
    const res = await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: templateId,
        recipients: [
          {
            mobiles: '91' + phone,
            otp: otp,
          },
        ],
      },
      {
        headers: {
          authkey: authKey,
          accept: 'application/json',
          'content-type': 'application/json',
        },
      }
    )
    console.log('MSG91 response:', {
      raw: res.data,
      type: res.data?.type,
      templateId: templateId,
      mobile: '91' + phone,
    })
    if (res.data?.type !== 'success') {
      throw new Error(res.data?.message || 'MSG91 OTP SMS failed')
    }
    return { success: true }
  } catch (error: any) {
    console.error('MSG91 sendOtpSms FULL ERROR:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    })
    throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP SMS via MSG91')
  }
}

/**
 * sendOtpWhatsApp
 * Sends an OTP WhatsApp message via MSG91 WhatsApp API.
 */
export async function sendOtpWhatsApp(
  phone: string,
  otp: string
): Promise<{ success: boolean }> {
  const isEnabled = process.env.ENABLE_WHATSAPP === 'true'
  const whatsappNumber = process.env.MSG91_WHATSAPP_NUMBER

  if (!isEnabled || !whatsappNumber) {
    console.log('Skipping WhatsApp OTP: WhatsApp integration is disabled or number is not set')
    return { success: false }
  }

  const authKey = process.env.MSG91_AUTH_KEY
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }

  try {
    const res = await axios.post(
      'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
      {
        integrated_number: whatsappNumber,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: 'otp_template',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp
                  }
                ]
              }
            ]
          },
          to: '91' + phone
        }
      },
      {
        headers: {
          Authkey: authKey
        }
      }
    )

    if (res.data?.type === 'error') {
      throw new Error(res.data?.message || 'MSG91 WhatsApp OTP failed')
    }

    return { success: true }
  } catch (error: any) {
    console.error('MSG91 sendOtpWhatsApp error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || 'Failed to send WhatsApp OTP via MSG91')
  }
}

/**
 * sendTransactionalSms
 * Sends transactional flow message via MSG91.
 */
export async function sendTransactionalSms(
  phone: string,
  message: string,
  senderId = 'VIDHYN'
): Promise<any> {
  const authKey = process.env.MSG91_AUTH_KEY
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }

  try {
    const res = await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: process.env.MSG91_TRANSACTIONAL_TEMPLATE_ID || '',
        sender: senderId,
        recipients: [
          {
            mobiles: '91' + phone,
            message: message
          }
        ]
      },
      {
        headers: {
          authkey: authKey,
          accept: 'application/json',
          'content-type': 'application/json'
        }
      }
    )

    return res.data
  } catch (error: any) {
    console.error('MSG91 sendTransactionalSms error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || 'Failed to send Transactional SMS')
  }
}

/**
 * verifyOtpMsg91
 * Verifies an OTP code using MSG91 native verify.
 */
export async function verifyOtpMsg91(
  phone: string,
  otp: string
): Promise<any> {
  const authKey = process.env.MSG91_AUTH_KEY
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }

  try {
    const res = await axios.get('https://control.msg91.com/api/v5/otp/verify', {
      params: {
        mobile: '91' + phone,
        otp: otp
      },
      headers: {
        authkey: authKey
      }
    })

    return res.data
  } catch (error: any) {
    console.error('MSG91 verifyOtpMsg91 error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || 'Failed to verify OTP')
  }
}

/**
 * resendOtp
 * Resends an OTP code via text or voice.
 */
export async function resendOtp(
  phone: string,
  retryType = 'text'
): Promise<any> {
  const authKey = process.env.MSG91_AUTH_KEY
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }

  try {
    const res = await axios.get('https://control.msg91.com/api/v5/otp/retry', {
      params: {
        mobile: '91' + phone,
        retrytype: retryType
      },
      headers: {
        authkey: authKey
      }
    })

    return res.data
  } catch (error: any) {
    console.error('MSG91 resendOtp error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || 'Failed to retry OTP')
  }
}
