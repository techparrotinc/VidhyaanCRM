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

/** Render the campaign email body (plain text with newlines) + optional hero
 *  image into the same HTML used for real sends. `body` is treated as trusted
 *  author text; only the hero image URL is attribute-escaped. */
export function renderCampaignEmailHtml(params: {
  body: string
  imageUrl?: string | null
}): string {
  const hero = params.imageUrl
    ? `<img src="${escapeHtml(params.imageUrl)}" alt="" style="width:100%;max-width:560px;border-radius:12px;display:block;margin-bottom:16px;" />`
    : ''
  return `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px;">
    ${hero}${params.body.replace(/\n/g, '<br/>')}
  </div>`
}
