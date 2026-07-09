import crypto from 'crypto'

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXTAUTH_URL ??
  'https://www.vidhyaan.com'

export function publicFormUrl(token: string): string {
  return `${BASE.replace(/\/$/, '')}/apply/${token}`
}

/** Unguessable instance token — the sole security boundary for the public
 *  form route (no session there). */
export function newFormToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}
