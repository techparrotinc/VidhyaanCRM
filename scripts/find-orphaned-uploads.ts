// Audit of orphaned S3 uploads under uploads/** — reports candidates by
// default; pass --delete to actually remove the "Orphaned" list (never the
// "Claim-audit-only" list — those still have an audit-trail reference).
// uploadObject() writes the binary first and the caller
// registers its URL in a DB row/JSON blob as a second step (see
// src/lib/storage.ts, AdmissionDocument/documents route) — a dropped second
// step (network blip, client crash) leaves the object with no reference.
//
// Usage: npx tsx scripts/find-orphaned-uploads.ts [--org <orgId>] [--min-age-hours 48]
//
// Coverage — every known place an uploaded URL can be persisted:
//   - crm.admission_documents.url
//   - marketplace.school_media.url
//   - crm.events.image_url
//   - crm.form_submissions.files (JSON array of {url})
//   - platform.audit_logs.after (JSON; SCHOOL_CLAIM documentUrl only lands
//     here, as an audit trail, not an active reference — flagged separately,
//     see below)
//
// NOT covered (add before ever wiring a --delete flag): any upload path
// added after this script was written. Grep `uploadObject(` call sites in
// src/app/api and re-check this list stays exhaustive.
//
// min-age-hours guards against flagging an object mid-upload, between the S3
// write and the DB-registration call that's still in flight.

// tsx only auto-loads .env (DATABASE_URL/DIRECT_URL live there) — the S3
// credentials (AWS_REGION/S3_BUCKET_NAME/AWS_ACCESS_KEY_ID/...) live in
// .env.local, which nothing loads outside the Next.js runtime. Without this,
// getStorageConfig() falls back to an empty bucket and listObjectKeys()
// silently returns 0 objects — no error, just a report that's always empty.
import { existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'
if (existsSync('.env.local')) loadEnv({ path: '.env.local' })

import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/db/client'
import { listObjectKeys, deleteObject } from '../src/lib/storage'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

async function main() {
  const orgId = arg('org')
  const minAgeHours = Number(arg('min-age-hours') ?? '48')
  const cutoff = new Date(Date.now() - minAgeHours * 60 * 60 * 1000)

  const prefix = orgId ? `uploads/${orgId}/` : 'uploads/'
  console.log(`Listing S3 objects under "${prefix}" …`)
  const objects = await listObjectKeys(prefix)
  console.log(`${objects.length} object(s) found.`)

  const candidates = objects.filter(o => !o.lastModified || o.lastModified < cutoff)
  console.log(`${candidates.length} object(s) older than ${minAgeHours}h — checking references…`)

  const [admissionDocs, schoolMedia, events, formSubmissions, claimAudits] = await Promise.all([
    prisma.admissionDocument.findMany({ select: { url: true } }),
    prisma.schoolMedia.findMany({ select: { url: true } }),
    prisma.event.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    prisma.formSubmission.findMany({ where: { files: { not: Prisma.DbNull } }, select: { files: true } }),
    prisma.auditLog.findMany({
      where: { entityType: 'SCHOOL_CLAIM' },
      select: { after: true }
    })
  ])

  const referenced = new Set<string>()
  for (const d of admissionDocs) if (d.url) referenced.add(d.url)
  for (const m of schoolMedia) if (m.url) referenced.add(m.url)
  for (const e of events) if (e.imageUrl) referenced.add(e.imageUrl)
  for (const s of formSubmissions) {
    const files = Array.isArray(s.files) ? s.files : []
    for (const f of files as any[]) if (f?.url) referenced.add(f.url)
  }
  // Audit-trail reference, not an active display reference — kept separate
  // so it's visible in the report rather than silently excluded.
  const claimReferenced = new Set<string>()
  for (const a of claimAudits) {
    const url = (a.after as any)?.documentUrl
    if (url) claimReferenced.add(url)
  }

  const isReferenced = (key: string) =>
    [...referenced].some(url => url.includes(key))
  const isClaimReferenced = (key: string) =>
    [...claimReferenced].some(url => url.includes(key))

  const orphans: string[] = []
  const claimOnly: string[] = []
  for (const { key } of candidates) {
    if (isReferenced(key)) continue
    if (isClaimReferenced(key)) {
      claimOnly.push(key)
      continue
    }
    orphans.push(key)
  }

  console.log('')
  console.log(`=== Orphaned (no reference found anywhere) — ${orphans.length} ===`)
  orphans.forEach(k => console.log(k))

  console.log('')
  console.log(`=== Claim-audit-only (referenced only in a SCHOOL_CLAIM audit log, not live) — ${claimOnly.length} ===`)
  claimOnly.forEach(k => console.log(k))

  const shouldDelete = flag('delete')
  if (!shouldDelete) {
    console.log('')
    console.log('Dry run only — nothing was deleted. Pass --delete to remove the')
    console.log('"Orphaned" list above (the "Claim-audit-only" list is never auto-deleted).')
    return
  }

  console.log('')
  console.log(`--delete passed — removing ${orphans.length} orphaned object(s)…`)
  let deleted = 0
  for (const key of orphans) {
    try {
      await deleteObject(key)
      console.log(`deleted: ${key}`)
      deleted++
    } catch (err) {
      console.error(`FAILED to delete ${key}:`, err)
    }
  }
  console.log(`Done. ${deleted}/${orphans.length} deleted.`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
