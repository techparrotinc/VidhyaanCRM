import { promises as dns } from 'node:dns'
import { redis } from '@/lib/redis'

// Deliverability gate for user-entered emails (leads/admissions/students/
// registration). Syntax + common-domain typo detection + MX lookup with a
// Redis cache. DNS infra failures fail OPEN — never block a record create
// because a resolver timed out; only a definitive NXDOMAIN/no-MX rejects.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Domains our audience actually uses — typo suggestions match against these.
const KNOWN_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.in', 'hotmail.com',
  'outlook.com', 'live.com', 'icloud.com', 'rediffmail.com', 'aol.com',
  'protonmail.com', 'zoho.com', 'zohomail.in',
]

const TLD_FIXES: Record<string, string> = {
  con: 'com', cmo: 'com', comm: 'com', vom: 'com', xom: 'com',
  co: 'com', om: 'com', 'co.on': 'co.in',
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      diag = tmp
    }
  }
  return prev[b.length]
}

/** "someone@gamil.con" → "someone@gmail.com"; null when no confident fix. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 1) return null
  const local = email.slice(0, at)
  let domain = email.slice(at + 1).toLowerCase()
  if (KNOWN_DOMAINS.includes(domain)) return null

  const dot = domain.indexOf('.')
  if (dot > 0) {
    const tld = domain.slice(dot + 1)
    if (TLD_FIXES[tld]) domain = domain.slice(0, dot + 1) + TLD_FIXES[tld]
  }
  if (KNOWN_DOMAINS.includes(domain)) return `${local}@${domain}`

  let best: string | null = null
  let bestDist = 3
  for (const known of KNOWN_DOMAINS) {
    const d = levenshtein(domain, known)
    if (d < bestDist) { bestDist = d; best = known }
  }
  // Distance 1-2 = near-certain typo of a major provider.
  return best && bestDist <= 2 ? `${local}@${best}` : null
}

const MX_CACHE_PREFIX = 'email:mx:'
const MX_VALID_TTL = 30 * 24 * 3600 // domains rarely lose MX
const MX_INVALID_TTL = 24 * 3600 // typo domains might get registered; recheck daily
const DNS_TIMEOUT_MS = 2500

/** true = has MX (or A fallback), false = definitively none, null = DNS unavailable. */
async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  const key = MX_CACHE_PREFIX + domain
  try {
    const cached = await redis.get(key)
    if (cached === '1') return true
    if (cached === '0') return false
  } catch { /* cache miss path */ }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('DNS_TIMEOUT')), DNS_TIMEOUT_MS)
  )
  let valid: boolean | null
  try {
    const mx = await Promise.race([dns.resolveMx(domain), timeout])
    valid = mx.length > 0
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      // No MX record — RFC 5321 falls back to the A record.
      try {
        await Promise.race([dns.resolve4(domain), timeout])
        valid = true
      } catch (err4: unknown) {
        const code4 = (err4 as NodeJS.ErrnoException)?.code
        valid = code4 === 'ENOTFOUND' || code4 === 'ENODATA' ? false : null
      }
    } else {
      valid = null // timeout/SERVFAIL — fail open, don't cache
    }
  }

  if (valid !== null) {
    try {
      await redis.set(key, valid ? '1' : '0', 'EX', valid ? MX_VALID_TTL : MX_INVALID_TTL)
    } catch { /* cache write best-effort */ }
  }
  return valid
}

export type EmailCheck =
  | { ok: true }
  | { ok: false; reason: 'syntax' | 'domain'; message: string; suggestion?: string }

/**
 * Full deliverability check for a user-entered email. Call from create/update
 * handlers AFTER zod parse; throw Errors.businessRule(check.message) on !ok.
 */
export async function checkEmailDeliverable(email: string): Promise<EmailCheck> {
  const trimmed = email.trim()
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, reason: 'syntax', message: `"${trimmed}" is not a valid email address` }
  }
  const suggestion = suggestEmail(trimmed) ?? undefined
  const domain = trimmed.slice(trimmed.lastIndexOf('@') + 1).toLowerCase()
  const accepts = await domainAcceptsMail(domain)
  if (accepts === false) {
    return {
      ok: false,
      reason: 'domain',
      message: suggestion
        ? `"${domain}" cannot receive email — did you mean ${suggestion}?`
        : `"${domain}" cannot receive email. Please check the address.`,
      suggestion,
    }
  }
  // Domain resolves (or DNS was unavailable — fail open) but still flag a
  // near-certain typo of a major provider (e.g. gmail.co resolves!).
  if (suggestion) {
    return {
      ok: false,
      reason: 'domain',
      message: `Did you mean ${suggestion}? "${domain}" looks like a typo.`,
      suggestion,
    }
  }
  return { ok: true }
}
