import { AppError, ErrorCode } from '@/lib/api/errors'
import { DedupResult } from './service'

/**
 * Throw a 409 when a create should be blocked:
 *  - action 'hard'  → always blocked (cannot override)
 *  - action 'soft'  → blocked unless the caller passes force:true ("Create anyway")
 *  - action 'off'   → never blocked
 *
 * The thrown AppError carries the matches in `details.dedup` so the client can
 * render "Open existing" / "Create anyway".
 */
export function assertNotDuplicate(dedup: DedupResult, opts?: { force?: boolean }): void {
  const blocked = dedup.action === 'hard' || (dedup.action === 'soft' && !opts?.force)
  if (!blocked) return

  const first = dedup.matches[0]
  const label = first?.code ? ` (${first.code})` : ''
  const msg =
    dedup.action === 'hard'
      ? `A record already exists for this person${label}. Open it instead of creating a duplicate.`
      : `Possible duplicate found${label}. Review the match, or choose "Create anyway".`

  throw new AppError(ErrorCode.CONFLICT, msg, 409, {
    dedup: { severity: dedup.action, matches: dedup.matches },
  })
}
