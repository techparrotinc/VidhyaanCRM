// One-off: seeds sample data for the two mobile Phase 1 test parents
// (9876543210, 9999955001) so the Home/Fees/Attendance/Events screens have
// something to show. Creates a dedicated test org (isDummy: true) so it's
// obviously not real school data; reuses existing User/Parent rows for
// these numbers if already present (both logged in successfully already),
// only creates what's missing. Idempotent — safe to re-run.
//
//   npx tsx scripts/seed-mobile-test-data.ts              # dry-run, prints plan
//   npx tsx scripts/seed-mobile-test-data.ts --apply
//
// NOTE: this does NOT configure a payment gateway. The org has no
// PaymentGatewayConfig, so createCheckout() will return "Online payments
// are not enabled for this school" when Pay is tapped — Razorpay test-mode
// keys must be added separately via the web CRM (Settings → Payments) if
// you want to test the actual checkout flow, not just the UI.

import { prisma } from '../src/lib/db/client'

const TEST_PARENTS = [
  { phone: '9876543210', name: 'Vimal Das', kidName: 'Test Kid One', grade: 'Grade 5', section: 'A' },
  { phone: '9999955001', name: 'Test Parent Two', kidName: 'Test Kid Two', grade: 'Grade 3', section: 'B' }
]

const ORG_SLUG = 'vidhyaan-mobile-qa'

async function main() {
  const apply = process.argv.includes('--apply')

  const org = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } })
  console.log(org ? `Org exists: ${org.name} (${org.id})` : `Would create org "Vidhyaan Mobile QA School" (slug: ${ORG_SLUG})`)

  for (const p of TEST_PARENTS) {
    const user = await prisma.user.findFirst({ where: { phone: p.phone } })
    const parent = await prisma.parent.findUnique({ where: { phone: p.phone } })
    const student = await prisma.student.findFirst({ where: { guardianPhone: p.phone, orgId: org?.id ?? '__none__' } })
    console.log(`\n${p.phone}:`)
    console.log(`  User: ${user ? user.id : 'MISSING — will not be created (must exist from a real login first)'}`)
    console.log(`  Parent: ${parent ? parent.id : 'MISSING — will not be created (must exist from a real login first)'}`)
    console.log(`  Student in QA org: ${student ? `${student.id} (${student.name})` : 'would create'}`)
    if (!user || !parent) {
      console.log(`  SKIP — log in as ${p.phone} on the app at least once before running this script.`)
    }
  }

  if (!apply) {
    console.log('\nDry run — pass --apply to create the org, students, invoices, attendance, and one event.')
    return
  }

  const orgRow = org ?? await prisma.organization.create({
    data: {
      name: 'Vidhyaan Mobile QA School',
      slug: ORG_SLUG,
      institutionType: 'SCHOOL',
      email: 'mobile-qa@vidhyaan.test',
      phone: '0000000000',
      isDummy: true,
      status: 'ACTIVE'
    }
  })
  console.log(`\nOrg: ${orgRow.id}`)

  const today = new Date()
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const dueSoon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)

  for (const p of TEST_PARENTS) {
    const parent = await prisma.parent.findUnique({ where: { phone: p.phone } })
    if (!parent) {
      console.log(`Skipping ${p.phone} — no Parent row (log in on the app first).`)
      continue
    }

    let student = await prisma.student.findFirst({ where: { guardianPhone: p.phone, orgId: orgRow.id } })
    if (!student) {
      student = await prisma.student.create({
        data: {
          orgId: orgRow.id,
          studentCode: `QA-${p.phone.slice(-4)}`,
          name: p.kidName,
          guardianPhone: p.phone,
          guardianName: p.name,
          gradeLabel: p.grade,
          section: p.section,
          status: 'ACTIVE'
        }
      })
      console.log(`Created student ${student.name} (${student.id}) for ${p.phone}`)
    } else {
      console.log(`Student already exists for ${p.phone}: ${student.name}`)
    }

    const existingInvoice = await prisma.invoice.findFirst({ where: { studentId: student.id, status: 'UNPAID' } })
    if (!existingInvoice) {
      const invoice = await prisma.invoice.create({
        data: {
          orgId: orgRow.id,
          invoiceNumber: `QA-${p.phone.slice(-4)}-${Date.now()}`,
          studentId: student.id,
          totalAmount: 12500,
          paidAmount: 0,
          status: 'UNPAID',
          dueDate: dueSoon
        }
      })
      await prisma.invoiceItem.create({
        data: { orgId: orgRow.id, invoiceId: invoice.id, head: 'Term 2 Tuition', amount: 12500, quantity: 1 }
      })
      console.log(`Created invoice ${invoice.invoiceNumber} — ₹12,500 due ${dueSoon.toDateString()}`)
    } else {
      console.log(`Open invoice already exists for ${student.name}: ${existingInvoice.invoiceNumber}`)
    }

    const existingAttendance = await prisma.attendanceRecord.findFirst({
      where: { studentId: student.id, date: todayUtc }
    })
    if (!existingAttendance) {
      await prisma.attendanceRecord.create({
        data: { orgId: orgRow.id, studentId: student.id, date: todayUtc, status: 'PRESENT' }
      })
      console.log(`Marked ${student.name} present for today`)
    } else {
      console.log(`Attendance already marked for ${student.name} today: ${existingAttendance.status}`)
    }
  }

  const existingEvent = await prisma.event.findFirst({ where: { orgId: orgRow.id, status: 'PUBLISHED' } })
  if (!existingEvent) {
    const event = await prisma.event.create({
      data: {
        orgId: orgRow.id,
        title: 'Annual Day 2026',
        description: 'Annual cultural evening — performances by every grade.',
        status: 'PUBLISHED',
        startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: 'Main ground',
        publishedAt: new Date()
      }
    })
    console.log(`Created event: ${event.title}`)
  } else {
    console.log(`Published event already exists: ${existingEvent.title}`)
  }

  console.log('\nDone.')
}

main().finally(() => prisma.$disconnect())
