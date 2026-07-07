// MSG91 WhatsApp template listing for bring-your-own accounts.
// NOTE: MSG91's template API is not formally versioned in their public
// docs; the response shapes below cover the two formats observed. Any
// mismatch throws Msg91TemplateSyncError and callers fall back to manual
// template entry.

export class Msg91TemplateSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Msg91TemplateSyncError'
  }
}

export interface Msg91Template {
  name: string
  language: string
  body: string
  variableCount: number
  status?: string
}

function countPlaceholders(body: string): number {
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? []
  const nums = matches.map(m => Number(m.replace(/\D/g, '')))
  return nums.length ? Math.max(...nums) : 0
}

/**
 * Fetches approved WhatsApp templates for an integrated number using the
 * org's own MSG91 auth key.
 */
export async function fetchMsg91Templates(
  authKey: string,
  integratedNumber: string
): Promise<Msg91Template[]> {
  const url = `https://api.msg91.com/api/v5/whatsapp/whatsapp-template/${encodeURIComponent(integratedNumber)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { authkey: authKey, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    throw new Msg91TemplateSyncError(`MSG91 unreachable: ${err.message}`)
  }

  if (!response.ok) {
    throw new Msg91TemplateSyncError(`MSG91 template list failed (${response.status})`)
  }

  let json: any
  try {
    json = await response.json()
  } catch {
    throw new Msg91TemplateSyncError('MSG91 returned a non-JSON response')
  }

  // Observed shapes: { data: [...] } or { data: { data: [...] } }
  const rawList: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.data?.data)
    ? json.data.data
    : []

  if (rawList.length === 0 && !Array.isArray(json?.data) && !Array.isArray(json?.data?.data)) {
    throw new Msg91TemplateSyncError('Unrecognized MSG91 template response shape')
  }

  const templates: Msg91Template[] = []
  for (const raw of rawList) {
    const name = raw?.name ?? raw?.template_name
    if (!name || typeof name !== 'string') continue

    const status = (raw?.status ?? raw?.template_status ?? '').toString().toUpperCase()
    // Only approved templates are sendable
    if (status && !['APPROVED', 'ENABLED', 'ACTIVE'].includes(status)) continue

    // Body may live in a components array (Meta shape) or a flat field
    let body = ''
    if (Array.isArray(raw?.components)) {
      const bodyComponent = raw.components.find(
        (c: any) => (c?.type ?? '').toString().toUpperCase() === 'BODY'
      )
      body = bodyComponent?.text ?? ''
    }
    if (!body) body = raw?.body ?? raw?.template_body ?? ''

    templates.push({
      name,
      language: raw?.language?.code ?? raw?.language ?? 'en',
      body: typeof body === 'string' ? body : '',
      variableCount: countPlaceholders(typeof body === 'string' ? body : ''),
      status
    })
  }

  return templates
}
