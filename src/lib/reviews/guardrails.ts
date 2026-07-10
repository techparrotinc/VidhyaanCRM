// Automated review guardrails (Option 3 hybrid moderation).
// Clean reviews auto-publish; risky ones are BLOCKED (contact info — user can
// fix and resubmit) or HELD (profanity / suspicious pattern — published as
// FLAGGED, hidden, moderator alerted). ~95% of reviews never touch a human.

export type GuardrailVerdict =
  | { action: 'PUBLISH' }
  | { action: 'BLOCK'; message: string }
  | { action: 'HOLD'; reason: string }

// ── Contact info: reviews must not carry phone numbers / emails / links ──
// Indian mobile (optionally +91/91/0 prefixed, spaces/dashes tolerated)
const PHONE_RE = /(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}/
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const URL_RE = /(https?:\/\/|www\.)\S+|[a-z0-9-]+\.(com|in|org|net|io|co)\b/i

// ── Profanity auto-hold (English + common Tanglish/Hinglish) ──
// Word-boundary matched, lowercased input. Deliberately conservative — a
// false hold costs a moderator glance; a false pass costs brand damage.
const PROFANITY = [
  'fuck', 'fucking', 'fucker', 'shit', 'bullshit', 'bastard', 'bitch',
  'asshole', 'dickhead', 'cunt', 'whore', 'slut', 'motherfucker',
  'chutiya', 'bhosdi', 'bhosdike', 'madarchod', 'behenchod', 'bhenchod',
  'gandu', 'gaandu', 'harami', 'kamina', 'kaminey', 'randi', 'saala kutta',
  'punda', 'thevidiya', 'otha', 'baadu', 'koothi', 'lavada', 'lund',
]
const PROFANITY_RE = new RegExp(`\\b(${PROFANITY.join('|')})\\b`, 'i')

/** Pure text checks — no I/O. */
export function checkReviewContent(text: string): GuardrailVerdict {
  const t = text.trim()

  if (PHONE_RE.test(t) || EMAIL_RE.test(t) || URL_RE.test(t)) {
    return {
      action: 'BLOCK',
      message:
        'Reviews cannot contain phone numbers, email addresses or links. Please remove them and resubmit.',
    }
  }

  if (PROFANITY_RE.test(t)) {
    return {
      action: 'HOLD',
      reason: 'Auto-hold: language filter match',
    }
  }

  return { action: 'PUBLISH' }
}

/**
 * Risk-based hold: a 1-2★ review from a brand-new account with no admission
 * history smells like a drive-by/revenge review — hold it for a human look.
 * Genuine parents overwhelmingly have older accounts or verified admissions.
 */
export function checkReviewRisk(opts: {
  rating: number
  parentCreatedAt: Date
  isVerifiedAdmission: boolean
}): GuardrailVerdict {
  const accountAgeMs = Date.now() - opts.parentCreatedAt.getTime()
  const isNewAccount = accountAgeMs < 24 * 60 * 60 * 1000

  if (opts.rating <= 2 && isNewAccount && !opts.isVerifiedAdmission) {
    return {
      action: 'HOLD',
      reason: 'Auto-hold: low rating from account created <24h ago',
    }
  }
  return { action: 'PUBLISH' }
}
