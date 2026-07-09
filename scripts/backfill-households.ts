// Backfill dedup identity: normalize phones, build households, link records.
// Set-based (a handful of statements for the whole DB), idempotent — safe to
// re-run. Usage: npx tsx scripts/backfill-households.ts
import { prisma } from '../src/lib/db/client'

// Postgres expression that mirrors cleanPhoneNumber(): strip non-digits, drop a
// leading 91 (12-digit) or 0 (11-digit), NULL when nothing remains.
const NORM = (col: string) => `
  NULLIF(
    CASE
      WHEN length(regexp_replace(${col}, '\\D', '', 'g')) = 12 AND left(regexp_replace(${col}, '\\D', '', 'g'), 2) = '91'
        THEN substring(regexp_replace(${col}, '\\D', '', 'g') FROM 3)
      WHEN length(regexp_replace(${col}, '\\D', '', 'g')) = 11 AND left(regexp_replace(${col}, '\\D', '', 'g'), 1) = '0'
        THEN substring(regexp_replace(${col}, '\\D', '', 'g') FROM 2)
      ELSE regexp_replace(${col}, '\\D', '', 'g')
    END, '')`

async function main() {
  const t0 = Date.now()

  console.log('1/3  Normalizing phones…')
  await prisma.$executeRawUnsafe(`UPDATE crm.leads SET phone_normalized = ${NORM('phone')} WHERE phone IS NOT NULL`)
  await prisma.$executeRawUnsafe(`UPDATE crm.admissions SET phone_normalized = ${NORM('phone')} WHERE phone IS NOT NULL`)
  await prisma.$executeRawUnsafe(`UPDATE crm.students SET phone_normalized = ${NORM('guardian_phone')} WHERE guardian_phone IS NOT NULL`)

  console.log('2/3  Building households…')
  const created = await prisma.$executeRawUnsafe(`
    INSERT INTO crm.households (id, org_id, phone_normalized, primary_name, primary_email, created_at, updated_at)
    SELECT gen_random_uuid()::text, org_id, phone_normalized,
           (array_agg(name  ORDER BY created_at) FILTER (WHERE name  IS NOT NULL))[1],
           (array_agg(email ORDER BY created_at) FILTER (WHERE email IS NOT NULL))[1],
           now(), now()
    FROM (
      SELECT org_id, phone_normalized, parent_name   AS name, email,          created_at FROM crm.leads      WHERE phone_normalized IS NOT NULL
      UNION ALL
      SELECT org_id, phone_normalized, parent_name,          email,          created_at FROM crm.admissions WHERE phone_normalized IS NOT NULL
      UNION ALL
      SELECT org_id, phone_normalized, guardian_name,        guardian_email, created_at FROM crm.students   WHERE phone_normalized IS NOT NULL
    ) src
    GROUP BY org_id, phone_normalized
    ON CONFLICT (org_id, phone_normalized) DO NOTHING`)

  console.log('3/3  Linking records to households…')
  for (const table of ['leads', 'admissions', 'students']) {
    await prisma.$executeRawUnsafe(`
      UPDATE crm.${table} t SET household_id = h.id
      FROM crm.households h
      WHERE h.org_id = t.org_id AND h.phone_normalized = t.phone_normalized
        AND t.phone_normalized IS NOT NULL`)
  }

  console.log(`Done: ${created} new households in ${((Date.now() - t0) / 1000).toFixed(1)}s.`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
