// Direct Meta WhatsApp Cloud API adapter (graph.facebook.com) — no BSP.
// Used for the platform shared account when Meta credentials are configured
// in admin settings; MSG91 remains the BYO-org path and the env fallback.

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

export class MetaWhatsAppError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message)
    this.name = 'MetaWhatsAppError'
  }
}

export interface MetaSendParams {
  to: string
  templateName: string
  /** Meta language code of the approved template (default en). */
  language?: string
  /** Ordered positional body parameters {{1}}..{{n}}. */
  parameters?: string[]
  accessToken: string
  phoneNumberId: string
}

/** Sends an approved template message. Returns the Meta message id (wamid). */
export async function sendMetaWhatsAppTemplate(params: MetaSendParams): Promise<string | null> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  // Meta rejects empty text parameters ((#131008) Required parameter is
  // missing) where MSG91 tolerated '' — substitute a dash so a blank token
  // never kills the whole send.
  const parameterTexts = (params.parameters ?? []).map(text =>
    text.trim() === '' ? '-' : text
  )
  const components =
    parameterTexts.length > 0
      ? [
          {
            type: 'body',
            parameters: parameterTexts.map(text => ({ type: 'text', text }))
          }
        ]
      : []

  const response = await fetch(`${GRAPH_BASE}/${params.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.language ?? 'en' },
        components
      }
    })
  })

  const data: any = await response.json().catch(() => null)
  if (!response.ok) {
    throw new MetaWhatsAppError(
      data?.error?.message || 'Meta WhatsApp send failed',
      data?.error?.code
    )
  }
  return data?.messages?.[0]?.id ?? null
}

/**
 * Free-form text message — only deliverable inside the 24h customer-service
 * window (used for opt-out confirmations replying to an inbound message).
 */
export async function sendMetaTextMessage(params: {
  to: string
  body: string
  accessToken: string
  phoneNumberId: string
}): Promise<void> {
  const phone = params.to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`
  const response = await fetch(`${GRAPH_BASE}/${params.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: params.body }
    })
  })
  if (!response.ok) {
    const data: any = await response.json().catch(() => null)
    throw new MetaWhatsAppError(data?.error?.message || 'Meta text send failed', data?.error?.code)
  }
}

export interface MetaTemplate {
  name: string
  language: string
  status: string
  category: string
  body: string
  variableCount: number
}

/**
 * Lists approved templates on the WABA. Paginates until exhausted (WABAs
 * rarely exceed a page, but Meta caps page size at 100).
 */
export async function fetchMetaTemplates(
  accessToken: string,
  wabaId: string
): Promise<MetaTemplate[]> {
  const templates: MetaTemplate[] = []
  let url: string | null =
    `${GRAPH_BASE}/${wabaId}/message_templates?status=APPROVED&limit=100&fields=name,language,status,category,components`

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const data: any = await response.json().catch(() => null)
    if (!response.ok) {
      throw new MetaWhatsAppError(
        data?.error?.message || 'Meta template list failed',
        data?.error?.code
      )
    }

    for (const tpl of data?.data ?? []) {
      const bodyComponent = (tpl.components ?? []).find(
        (c: any) => String(c.type).toUpperCase() === 'BODY'
      )
      const body: string = bodyComponent?.text ?? ''
      const placeholders = body.match(/\{\{\s*\d+\s*\}\}/g) ?? []
      const variableCount = new Set(
        placeholders.map(p => p.replace(/\D/g, ''))
      ).size

      templates.push({
        name: tpl.name,
        language: tpl.language,
        status: tpl.status,
        category: tpl.category,
        body,
        variableCount
      })
    }

    url = data?.paging?.next ?? null
  }

  return templates
}
