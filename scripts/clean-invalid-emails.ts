// One-time bulk clean of stored emails (leads, admissions, students'
// guardianEmail). Classifies every distinct address:
//   invalid-syntax  → fails the email regex
//   dead-domain     → domain has no MX and no A record (definitive)
//   typo-suspect    → domain resolves but looks like a typo of a major
//                     provider (gmail.co etc.) — REPORTED ONLY, never suppressed
//   ok / unknown    → deliverable, or DNS unavailable (fail open)
//
// READ-ONLY on CRM records. Only writes rows to platform.email_suppressions,
// and only with --apply; default is a dry run. Never deletes anything.
//
// Usage: npx tsx --env-file=.env.local scripts/clean-invalid-emails.ts [--apply]
// Report CSV written next to nothing important: ./email-clean-report.csv

import { writeFileSync } from 'node:fs'
import { prisma } from '../src/lib/db/client'
import { suggestEmail, domainAcceptsMail } from '../src/lib/email/validate'
import { suppressEmail } from '../src/lib/email/suppression'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const APPLY = process.argv.includes('--apply')

type Verdict = 'invalid-syntax' | 'dead-domain' | 'typo-suspect' | 'ok' | 'unknown'
interface Row { email: string; verdict: Verdict; suggestion: string; sources: string }

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writes suppression rows)' : 'dry run (report only)'}`)

  const [leads, admissions, students] = await Promise.all([
    prisma.lead.findMany({ where: { email: { not: null } }, select: { email: true } }),
    prisma.admission.findMany({ where: { email: { not: null } }, select: { email: true } }),
    prisma.student.findMany({ where: { guardianEmail: { not: null } }, select: { guardianEmail: true } }),
  ])

  // distinct lowercased email → which tables it appears in
  const sources = new Map<string, Set<string>>()
  const collect = (email: string | null, src: string) => {
    const norm = email?.trim().toLowerCase()
    if (!norm) return
    if (!sources.has(norm)) sources.set(norm, new Set())
    sources.get(norm)!.add(src)
  }
  for (const l of leads) collect(l.email, 'lead')
  for (const a of admissions) collect(a.email, 'admission')
  for (const s of students) collect(s.guardianEmail, 'student')

  console.log(
    `Distinct emails: ${sources.size} (leads ${leads.length}, admissions ${admissions.length}, students ${students.length})`
  )

  // Resolve each distinct DOMAIN once, not per email.
  const domains = new Set<string>()
  for (const email of sources.keys()) {
    if (EMAIL_RE.test(email)) domains.add(email.slice(email.lastIndexOf('@') + 1))
  }
  const domainStatus = new Map<string, boolean | null>()
  const domainList = [...domains]
  const CONCURRENCY = 10
  for (let i = 0; i < domainList.length; i += CONCURRENCY) {
    const batch = domainList.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(d => domainAcceptsMail(d)))
    batch.forEach((d, j) => domainStatus.set(d, results[j]))
    if (i % 100 === 0 && i > 0) console.log(`  resolved ${i}/${domainList.length} domains…`)
  }

  const rows: Row[] = []
  const counts: Record<Verdict, number> = {
    'invalid-syntax': 0, 'dead-domain': 0, 'typo-suspect': 0, ok: 0, unknown: 0,
  }

  for (const [email, srcs] of sources) {
    let verdict: Verdict
    let suggestion = ''
    if (!EMAIL_RE.test(email)) {
      verdict = 'invalid-syntax'
    } else {
      const domain = email.slice(email.lastIndexOf('@') + 1)
      const status = domainStatus.get(domain)
      suggestion = suggestEmail(email) ?? ''
      if (status === false) verdict = 'dead-domain'
      else if (suggestion) verdict = 'typo-suspect'
      else verdict = status === null ? 'unknown' : 'ok'
    }
    counts[verdict]++
    if (verdict !== 'ok') {
      rows.push({ email, verdict, suggestion, sources: [...srcs].join('+') })
    }
  }

  console.log('\nVerdicts:')
  for (const [v, n] of Object.entries(counts)) console.log(`  ${v.padEnd(15)} ${n}`)

  rows.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.email.localeCompare(b.email))
  const csv = ['email,verdict,suggestion,sources']
    .concat(rows.map(r => `${r.email},${r.verdict},${r.suggestion},${r.sources}`))
    .join('\n')
  writeFileSync('email-clean-report.csv', csv)
  console.log(`\nReport: email-clean-report.csv (${rows.length} flagged rows)`)

  if (APPLY) {
    const toSuppress = rows.filter(r => r.verdict === 'invalid-syntax' || r.verdict === 'dead-domain')
    console.log(`\nSuppressing ${toSuppress.length} definitively-bad addresses…`)
    let done = 0
    for (const r of toSuppress) {
      await suppressEmail(r.email, r.verdict, 'bulk-clean')
      if (++done % 50 === 0) console.log(`  ${done}/${toSuppress.length}`)
    }
    console.log(`Done: ${done} addresses suppressed. Typo-suspects NOT suppressed — fix those in the UI (see CSV).`)
  } else {
    console.log('\nDry run — nothing written. Re-run with --apply to suppress invalid-syntax + dead-domain addresses.')
  }
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
