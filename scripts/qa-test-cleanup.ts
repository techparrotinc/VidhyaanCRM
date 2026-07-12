/**
 * One-off cleanup of QA-TEST records created by the 2026-07-12 browser
 * regression run. Every delete is scoped to exact IDs/markers captured
 * during the test session — nothing pattern-matches beyond them.
 *
 * Run: npx tsx scripts/qa-test-cleanup.ts --apply   (dry-run without --apply)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const ORG_ID = 'cmrgo10wx001089wg52tkek34'
const ORG_NAME = 'QA-TEST Academy Delete Me'
const ORG_OWNER_ID = 'cmrgo12gi002689wg68qa2fe1'
const ORG_OWNER_PHONE = '9990000222'
const PARENT_USER_ID = 'cmrgozxob004v89wgx9ip3209'
const PARENT_PHONE = '9990000444'
const GUEST_ENQUIRY_PHONE = '9990000111' // unauth marketplace enquiry to Prince Matriculation
const TEST_PHONES = ['9990000222', '9990000333', '9990000444', '9990000111', '9990000555', '9990000556', '9990009999']

async function main() {
  console.log(APPLY ? '=== APPLY MODE ===' : '=== DRY RUN (pass --apply to delete) ===')

  // Guard: org must exist with the exact QA-TEST name
  const org = await prisma.organization.findUnique({ where: { id: ORG_ID }, select: { id: true, name: true } })
  if (org && org.name !== ORG_NAME) {
    throw new Error(`Org ${ORG_ID} name mismatch: "${org.name}" — aborting`)
  }
  console.log('org:', org ? `${org.id} "${org.name}"` : 'not found (already cleaned?)')

  const parentUser = await prisma.user.findUnique({ where: { id: PARENT_USER_ID }, select: { id: true, name: true, phone: true } })
  if (parentUser && parentUser.phone !== PARENT_PHONE) {
    throw new Error(`Parent user ${PARENT_USER_ID} phone mismatch: ${parentUser.phone} — aborting`)
  }
  console.log('parent user:', parentUser ? `${parentUser.id} "${parentUser.name}" ${parentUser.phone}` : 'not found')

  // Guest parent created by the unauth marketplace enquiry
  const guestParents = await prisma.parent.findMany({
    where: { phone: { in: [GUEST_ENQUIRY_PHONE, PARENT_PHONE] } },
    select: { id: true, name: true, phone: true }
  })
  console.log('parent records:', guestParents.map(p => `${p.id} "${p.name}" ${p.phone}`))
  for (const p of guestParents) {
    if (!(p.name ?? '').startsWith('QA-TEST')) {
      throw new Error(`Parent ${p.id} name "${p.name}" not QA-TEST — aborting`)
    }
  }
  const parentIds = guestParents.map(p => p.id)

  const enquiries = await prisma.parentEnquiry.findMany({
    where: { parentId: { in: parentIds } },
    select: { id: true, schoolId: true, leadId: true }
  })
  console.log('parent enquiries:', enquiries.length)

  // Leads the public enquiry endpoint pushed into the (real) school's org —
  // scoped to test phones AND QA-TEST parent name.
  const strayLeads = await prisma.lead.findMany({
    where: { phone: { in: TEST_PHONES }, parentName: { startsWith: 'QA-TEST' } },
    select: { id: true, orgId: true, parentName: true, phone: true }
  })
  console.log('QA-TEST leads (incl. inside real orgs):', strayLeads.length)

  const otps = await prisma.otpCode.count({ where: { identifier: { in: TEST_PHONES } } })
  console.log('otp codes for test phones:', otps)

  if (!APPLY) return

  // Enquiries + stray leads first (leads may be referenced by enquiry.leadId)
  if (enquiries.length) {
    const r = await prisma.parentEnquiry.deleteMany({ where: { id: { in: enquiries.map(e => e.id) } } })
    console.log('deleted parent enquiries:', r.count)
  }
  if (strayLeads.length) {
    const r = await prisma.lead.deleteMany({ where: { id: { in: strayLeads.map(l => l.id) } } })
    console.log('deleted QA-TEST leads:', r.count)
  }

  await prisma.otpCode.deleteMany({ where: { identifier: { in: TEST_PHONES } } })
  console.log('deleted otp codes')

  // Parent records (kids cascade or explicit)
  if (parentIds.length) {
    await prisma.kidProfile.deleteMany({ where: { parentId: { in: parentIds } } })
    await prisma.parentBookmark.deleteMany({ where: { parentId: { in: parentIds } } }).catch(() => {})
    await prisma.parentApplication.deleteMany({ where: { parentId: { in: parentIds } } }).catch(() => {})
    const r = await prisma.parent.deleteMany({ where: { id: { in: parentIds } } })
    console.log('deleted parent records:', r.count)
  }
  if (parentUser) {
    await prisma.auditLog.deleteMany({ where: { userId: PARENT_USER_ID } })
    await prisma.userRoleAssignment.deleteMany({ where: { userId: PARENT_USER_ID } })
    await prisma.user.delete({ where: { id: PARENT_USER_ID } })
    console.log('deleted parent user')
  }

  // Org: schema cascades cover children; owner user may survive
  if (org) {
    await prisma.auditLog.deleteMany({ where: { userId: ORG_OWNER_ID } })
    await prisma.organization.delete({ where: { id: ORG_ID } })
    console.log('deleted org (cascade)')
    const owner = await prisma.user.findUnique({ where: { id: ORG_OWNER_ID }, select: { id: true, phone: true } })
    if (owner) {
      if (owner.phone !== ORG_OWNER_PHONE) throw new Error('Owner phone mismatch — aborting user delete')
      await prisma.userRoleAssignment.deleteMany({ where: { userId: ORG_OWNER_ID } })
      await prisma.user.delete({ where: { id: ORG_OWNER_ID } })
      console.log('deleted org owner user')
    }
  }

  console.log('CLEANUP DONE')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
