// Multi-branch backfill (multi-branch-architecture.md §6). Idempotent,
// set-based — one UPDATE per table, not per row.
//   1. Orgs without any branch get a default branch created.
//   2. branch_id IS NULL rows in branch-aware tables are stamped with the
//      org's default branch.
//   3. BRANCH_ADMINs with zero UserBranchAccess grants are granted the
//      default branch (fail-closed enforcement would otherwise strand them).
// Usage: npx tsx scripts/backfill-branch-ids.ts [--dry-run] [--org <orgId>]
import { prisma } from '../src/lib/db/client'

const dryRun = process.argv.includes('--dry-run')
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const onlyOrg = arg('org')

// schema-qualified tables carrying org_id + branch_id
const TABLES = [
  'crm.leads', 'crm.lead_activities', 'crm.admissions',
  'crm.admission_activities', 'crm.admission_capacity', 'crm.students',
  'crm.student_batches', 'crm.fee_plans', 'crm.invoices', 'crm.payments',
  'crm.events', 'crm.campaigns', 'crm.counsellor_targets'
]

async function main() {
  const orgFilter = onlyOrg ? { id: onlyOrg } : {}

  // 1. Create a default branch for orgs that have none
  const orgsWithoutBranch = await prisma.organization.findMany({
    where: {
      ...orgFilter,
      deletedAt: null,
      branches: { none: { deletedAt: null } }
    },
    select: { id: true, name: true }
  })

  console.log(`${orgsWithoutBranch.length} org(s) without a branch`)
  if (!dryRun) {
    for (const org of orgsWithoutBranch) {
      await prisma.branch.create({
        data: { orgId: org.id, name: 'Main Branch', isDefault: true }
      })
      console.log(`  created default branch for ${org.name} (${org.id})`)
    }
  }

  // Ensure every org has exactly one isDefault branch (older orgs may have
  // branches but none flagged default — promote the oldest).
  const promoted: Array<{ id: string }> = dryRun ? [] : await prisma.$queryRawUnsafe(`
    UPDATE platform.branches b SET is_default = true
    WHERE b.deleted_at IS NULL
      AND b.id = (
        SELECT b2.id FROM platform.branches b2
        WHERE b2.org_id = b.org_id AND b2.deleted_at IS NULL
        ORDER BY b2.created_at ASC LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM platform.branches d
        WHERE d.org_id = b.org_id AND d.is_default = true AND d.deleted_at IS NULL
      )
      ${onlyOrg ? `AND b.org_id = '${onlyOrg}'` : ''}
    RETURNING b.id
  `)
  if (!dryRun) console.log(`${promoted.length} branch(es) promoted to default`)

  // 2. Stamp null branch_id rows with the org's default branch
  for (const table of TABLES) {
    const sql = `
      UPDATE ${table} t SET branch_id = d.id
      FROM platform.branches d
      WHERE d.org_id = t.org_id AND d.is_default = true AND d.deleted_at IS NULL
        AND t.branch_id IS NULL
        ${onlyOrg ? `AND t.org_id = '${onlyOrg}'` : ''}
    `
    if (dryRun) {
      const rows: Array<{ n: bigint }> = await prisma.$queryRawUnsafe(`
        SELECT count(*)::bigint AS n FROM ${table} t
        WHERE t.branch_id IS NULL ${onlyOrg ? `AND t.org_id = '${onlyOrg}'` : ''}
      `)
      console.log(`[dry-run] ${table}: ${rows[0].n} row(s) would be stamped`)
    } else {
      const n = await prisma.$executeRawUnsafe(sql)
      console.log(`${table}: ${n} row(s) stamped`)
    }
  }

  // 3. Grant default branch to BRANCH_ADMINs with no grants
  const grantSql = `
    INSERT INTO platform.user_branch_access (id, user_id, branch_id, role, created_at, updated_at)
    SELECT gen_random_uuid()::text, u.id, d.id, 'BRANCH_ADMIN', now(), now()
    FROM platform.users u
    JOIN platform.user_role_assignments ra
      ON ra.user_id = u.id AND ra.role = 'BRANCH_ADMIN' AND ra.status = 'ACTIVE'
    JOIN platform.branches d
      ON d.org_id = u.org_id AND d.is_default = true AND d.deleted_at IS NULL
    WHERE u.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM platform.user_branch_access a WHERE a.user_id = u.id
      )
      ${onlyOrg ? `AND u.org_id = '${onlyOrg}'` : ''}
    ON CONFLICT (user_id, branch_id) DO NOTHING
  `
  if (dryRun) {
    console.log('[dry-run] skipping BRANCH_ADMIN grant insert')
  } else {
    const n = await prisma.$executeRawUnsafe(grantSql)
    console.log(`${n} BRANCH_ADMIN grant(s) created`)
  }

  console.log(dryRun ? 'Dry run complete.' : 'Backfill complete.')
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
