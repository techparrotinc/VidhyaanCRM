// Pure campaign-email HTML renderer — NO server imports, so it can be shared by
// the server send path (channels.ts), the test-send route, and the client-side
// live preview. Keep it dependency-free.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Conservative allowlist-ish sanitizer for the rich-text (WYSIWYG) email body.
 *  Authors are staff and the output renders in email clients (which strip
 *  scripts anyway), but we still remove the dangerous bits: script/style/iframe
 *  blocks, inline event handlers, and javascript: URLs. Keeps formatting tags
 *  (b/i/u/font/span-style/div-align/ul/ol/li/a/br/p/h1-3). */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return ''
  return html
    // strip whole dangerous elements + their content
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // strip inline event handlers  on*="..."  /  on*='...'
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    // neutralize javascript: / data: URLs in href/src
    .replace(/(href|src)\s*=\s*"(\s*(javascript|data):[^"]*)"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'(\s*(javascript|data):[^']*)'/gi, "$1='#'")
}

/** Split an optional leading "Subject: …" line off the body, mirroring the
 *  convention the compose UI writes. Returns the resolved subject + body. */
export function splitSubject(
  raw: string,
  fallbackSubject: string
): { subject: string; body: string } {
  const lines = raw.split('\n')
  const first = (lines[0] ?? '').trim()
  if (first.startsWith('Subject:')) {
    return {
      subject: first.replace('Subject:', '').trim() || fallbackSubject,
      body: lines.slice(1).join('\n').trim()
    }
  }
  return { subject: fallbackSubject, body: raw }
}

/** Render the campaign email body + optional hero image into the same HTML
 *  used for real sends. Pass `html` for pre-rendered content (e.g. blocks) or
 *  `body` for plain author text (newlines → <br/>). Only the hero image URL is
 *  attribute-escaped; body/html are trusted author content. */
export function renderCampaignEmailHtml(params: {
  body?: string
  html?: string
  imageUrl?: string | null
}): string {
  const hero = params.imageUrl
    ? `<img src="${escapeHtml(params.imageUrl)}" alt="" style="width:100%;max-width:560px;border-radius:12px;display:block;margin-bottom:16px;" />`
    : ''
  const content = params.html ?? (params.body ?? '').replace(/\n/g, '<br/>')
  return `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px;">
    ${hero}${content}
  </div>`
}

// ── Block builder ──────────────────────────────────────────────────────────
// A rich email body composed of stackable blocks. Stored as JSON on the
// campaign and rendered to HTML (pure) both in the client preview and at send
// time; {{variable}} tokens are substituted by the caller after render.

export type EmailBlock =
  | { type: 'heading'; text: string; level?: 1 | 2 }
  | { type: 'text'; text: string }
  | { type: 'image'; url: string }
  | { type: 'button'; label: string; url: string }
  | { type: 'divider' }
  | { type: 'spacer'; size?: number }

const BTN_STYLE =
  'display:inline-block;background:#1565D8;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;'

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case 'heading': {
      const size = b.level === 2 ? '18px' : '24px'
      return `<h${b.level === 2 ? 2 : 1} style="font-size:${size};font-weight:700;color:#0f172a;margin:0 0 12px;">${escapeHtml(b.text)}</h${b.level === 2 ? 2 : 1}>`
    }
    case 'text':
      return `<p style="margin:0 0 14px;">${escapeHtml(b.text).replace(/\n/g, '<br/>')}</p>`
    case 'image':
      return b.url
        ? `<img src="${escapeHtml(b.url)}" alt="" style="width:100%;max-width:560px;border-radius:12px;display:block;margin:0 0 16px;" />`
        : ''
    case 'button':
      return b.url
        ? `<div style="margin:0 0 16px;"><a href="${escapeHtml(b.url)}" style="${BTN_STYLE}">${escapeHtml(b.label || 'Learn more')}</a></div>`
        : ''
    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />`
    case 'spacer':
      return `<div style="height:${Math.max(4, Math.min(80, b.size ?? 24))}px;"></div>`
    default:
      return ''
  }
}

/** Render an ordered list of blocks to inner HTML (no wrapper, no var
 *  substitution — the caller wraps via renderCampaignEmailHtml and substitutes
 *  {{tokens}} afterwards). */
export function renderBlocksToHtml(blocks: EmailBlock[]): string {
  if (!Array.isArray(blocks)) return ''
  return blocks.map(renderBlock).join('\n')
}
