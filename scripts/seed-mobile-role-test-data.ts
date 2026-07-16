// Seeds one test login per mobile journey (parent / org staff roles) plus
// enough CRM data in the dedicated QA org (isDummy) that every mobile screen
// has something to show. Builds on seed-mobile-test-data.ts but creates the
// User/Parent rows directly — no prior login needed — and sets PIN 2580 on
// every seeded account so the new mobile PIN login can be tested.
//
//   npx tsx scripts/seed-mobile-role-test-data.ts            # dry-run
//   npx tsx scripts/seed-mobile-role-test-data.ts --apply
//
// Test logins (OTP bypass: add the phones to MOBILE_TEST_PHONES in Vercel
// env, then code 123456 works; PIN for all: 2580):
//   9999955001  PARENT       (kid + invoices + attendance + events)
//   9999955002  ORG_ADMIN
//   9999955003  COUNSELLOR   (assigned leads/admissions)
//   9999955004  TEACHER
//   9999955005  ACCOUNTANT
//
// Idempotent — reuses rows when they exist; only touches the QA org.

import argon2 from 'argon2'
import { prisma } from '../src/lib/db/client'
import { createDefaultAdmissionStages } from '../src/lib/utils/createDefaultAdmissionStages'
import { buildTargetKey } from '../src/lib/attendance/access'
import { encryptSecret, currentKeyVersion } from '../src/lib/payments/vault'
import { generateWebhookSecret } from '../src/lib/payments/config'

const ORG_SLUG = 'vidhyaan-mobile-qa'
const TEST_PIN = '2580'

const STAFF = [
  { phone: '9999955002', name: 'QA Org Admin', role: 'ORG_ADMIN' },
  { phone: '9999955003', name: 'QA Counsellor', role: 'COUNSELLOR' },
  { phone: '9999955004', name: 'QA Teacher', role: 'TEACHER' },
  { phone: '9999955005', name: 'QA Accountant', role: 'ACCOUNTANT' }
] as const

const PARENT = { phone: '9999955001', name: 'QA Parent One' }

const STUDENTS = [
  { code: 'QA-5001', name: 'Aarav Sharma', grade: 'Grade 5', section: 'A', guardian: PARENT },
  { code: 'QA-5002', name: 'Diya Sharma', grade: 'Grade 3', section: 'B', guardian: PARENT },
  { code: 'QA-5003', name: 'Vihaan Nair', grade: 'Grade 5', section: 'A', guardian: { phone: '9999955011', name: 'Ramesh Nair' } },
  { code: 'QA-5004', name: 'Ananya Iyer', grade: 'Grade 4', section: 'A', guardian: { phone: '9999955012', name: 'Lakshmi Iyer' } },
  { code: 'QA-5005', name: 'Kabir Menon', grade: 'Grade 3', section: 'B', guardian: { phone: '9999955013', name: 'Suresh Menon' } },
  { code: 'QA-5006', name: 'Ishita Rao', grade: 'Grade 4', section: 'B', guardian: { phone: '9999955014', name: 'Priya Rao' } }
]

const LEADS = [
  { parent: 'Rohit Verma', phone: '9999955021', kid: 'Arjun Verma', grade: 'Grade 1', status: 'NEW', priority: 'HIGH' },
  { parent: 'Sneha Kulkarni', phone: '9999955022', kid: 'Meera Kulkarni', grade: 'Grade 2', status: 'CONTACTED', priority: 'MEDIUM' },
  { parent: 'Amit Patel', phone: '9999955023', kid: 'Dev Patel', grade: 'LKG', status: 'INTERESTED', priority: 'HIGH' },
  { parent: 'Kavya Reddy', phone: '9999955024', kid: 'Sai Reddy', grade: 'Grade 3', status: 'FOLLOW_UP_PENDING', priority: 'MEDIUM' },
  { parent: 'Manoj Gupta', phone: '9999955025', kid: 'Riya Gupta', grade: 'UKG', status: 'NEW', priority: 'LOW' },
  { parent: 'Deepa Krishnan', phone: '9999955026', kid: 'Adi Krishnan', grade: 'Grade 1', status: 'CONTACTED', priority: 'MEDIUM' },
  { parent: 'Farhan Ali', phone: '9999955027', kid: 'Zara Ali', grade: 'Grade 2', status: 'NOT_INTERESTED', priority: 'LOW' },
  { parent: 'Nisha Pillai', phone: '9999955028', kid: 'Ved Pillai', grade: 'Grade 5', status: 'INTERESTED', priority: 'HIGH' }
] as const

const ADMISSIONS = [
  { applicant: 'Arnav Joshi', parent: 'Prakash Joshi', phone: '9999955031', grade: 'Grade 1', stage: 'New' },
  { applicant: 'Tara Bhat', parent: 'Ganesh Bhat', phone: '9999955032', grade: 'Grade 2', stage: 'Application Submitted' },
  { applicant: 'Reyansh Das', parent: 'Bijoy Das', phone: '9999955033', grade: 'LKG', stage: 'Docs Uploaded' },
  { applicant: 'Myra Shetty', parent: 'Dinesh Shetty', phone: '9999955034', grade: 'Grade 3', stage: 'Interview Scheduled' },
  { applicant: 'Advait Kumar', parent: 'Rajan Kumar', phone: '9999955035', grade: 'UKG', stage: 'Payment Pending' }
] as const

function day(offset: number): Date {
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000)
}

async function main() {
  const apply = process.argv.includes('--apply')
  if (!apply) {
    console.log('DRY RUN — will create/reuse in QA org:')
    console.log(`  Org "${ORG_SLUG}" (isDummy) + all modules enabled + default admission stages`)
    console.log(`  1 parent + 4 staff logins (PIN ${TEST_PIN}): ${[PARENT, ...STAFF].map((u) => u.phone).join(', ')}`)
    console.log(`  ${STUDENTS.length} students, invoices (paid+unpaid), attendance (today), ${LEADS.length} leads, ${ADMISSIONS.length} admissions, 2 events`)
    console.log('\nPass --apply to write.')
    return
  }

  const org =
    (await prisma.organization.findUnique({ where: { slug: ORG_SLUG } })) ??
    (await prisma.organization.create({
      data: {
        name: 'Vidhyaan Mobile QA School',
        slug: ORG_SLUG,
        institutionType: 'SCHOOL',
        email: 'mobile-qa@vidhyaan.test',
        phone: '0000000000',
        isDummy: true,
        status: 'ACTIVE'
      }
    }))
  console.log(`Org: ${org.name} (${org.id})`)

  // Enable every catalog module so no mobile screen hits the module gate.
  const modules = await prisma.module.findMany({ select: { id: true, slug: true } })
  for (const mod of modules) {
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: org.id, moduleId: mod.id } },
      update: { enabled: true },
      create: { orgId: org.id, moduleId: mod.id, enabled: true, enabledAt: new Date() }
    })
  }
  console.log(`Modules enabled: ${modules.map((m) => m.slug).join(', ')}`)

  await createDefaultAdmissionStages(org.id)
  const stages = await prisma.admissionStage.findMany({ where: { orgId: org.id } })
  const stageByName = new Map(stages.map((s) => [s.name, s.id]))

  const pinHash = await argon2.hash(TEST_PIN, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  })

  async function upsertLogin(phone: string, name: string, role: string, withOrg: boolean) {
    let user = await prisma.user.findFirst({ where: { phone } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name,
          orgId: withOrg ? org.id : null,
          status: 'ACTIVE',
          pinHash,
          pinSetAt: new Date()
        }
      })
      console.log(`Created user ${name} (${phone})`)
    } else if (!user.pinHash) {
      await prisma.user.update({ where: { id: user.id }, data: { pinHash, pinSetAt: new Date() } })
      console.log(`Set PIN for existing user ${phone}`)
    }
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role_orgId: { userId: user.id, role: role as never, orgId: withOrg ? org.id : null }
      } as never,
      update: { status: 'ACTIVE' },
      create: {
        userId: user.id,
        role: role as never,
        orgId: withOrg ? org.id : null,
        status: 'ACTIVE',
        isDefault: true
      }
    }).catch(async () => {
      // @@unique([userId, role, orgId]) with null orgId can miss in upsert —
      // fall back to find-or-create.
      const existing = await prisma.userRoleAssignment.findFirst({
        where: { userId: user!.id, role: role as never, orgId: withOrg ? org.id : null }
      })
      if (!existing) {
        await prisma.userRoleAssignment.create({
          data: { userId: user!.id, role: role as never, orgId: withOrg ? org.id : null, status: 'ACTIVE', isDefault: true }
        })
      }
    })
    return user
  }

  // Staff logins
  const staffUsers = new Map<string, { id: string }>()
  for (const s of STAFF) {
    staffUsers.set(s.role, await upsertLogin(s.phone, s.name, s.role, true))
  }
  const counsellorId = staffUsers.get('COUNSELLOR')!.id

  // Teacher class assignments — attendance marking requires a matching
  // TeacherAssignment (src/lib/attendance/access.ts), else the register 403s.
  const teacherId = staffUsers.get('TEACHER')!.id
  const teacherClasses = [
    { gradeLabel: 'Grade 5', section: 'A' },
    { gradeLabel: 'Grade 3', section: 'B' },
    { gradeLabel: 'Grade 4', section: null } // no section = covers all of Grade 4
  ]
  for (const c of teacherClasses) {
    const targetKey = buildTargetKey({ gradeLabel: c.gradeLabel, section: c.section })
    await prisma.teacherAssignment.upsert({
      where: { orgId_teacherId_targetKey: { orgId: org.id, teacherId, targetKey } },
      update: {},
      create: { orgId: org.id, teacherId, gradeLabel: c.gradeLabel, section: c.section, targetKey }
    })
  }
  console.log(`Teacher assignments: ${teacherClasses.map((c) => `${c.gradeLabel}${c.section ? '-' + c.section : ''}`).join(', ')}`)

  // Parent login + marketplace Parent row (parent portal identity)
  const parentUser = await upsertLogin(PARENT.phone, PARENT.name, 'PARENT', false)
  const parentRow = await prisma.parent.upsert({
    where: { phone: PARENT.phone },
    update: { userId: parentUser.id },
    create: { phone: PARENT.phone, name: PARENT.name, userId: parentUser.id }
  })
  console.log(`Parent row: ${parentRow.id}`)

  // Students + fees + attendance
  const todayUtc = new Date(new Date().toISOString().slice(0, 10))
  for (const [i, s] of STUDENTS.entries()) {
    let student = await prisma.student.findFirst({
      where: { orgId: org.id, studentCode: s.code }
    })
    if (!student) {
      student = await prisma.student.create({
        data: {
          orgId: org.id,
          studentCode: s.code,
          name: s.name,
          gradeLabel: s.grade,
          section: s.section,
          guardianName: s.guardian.name,
          guardianPhone: s.guardian.phone,
          phoneNormalized: s.guardian.phone,
          status: 'ACTIVE'
        }
      })
      console.log(`Student: ${s.name}`)
    }

    // One unpaid invoice due soon + one paid (receipt screen)
    const unpaid = await prisma.invoice.findFirst({ where: { studentId: student.id, status: 'UNPAID' } })
    if (!unpaid) {
      const inv = await prisma.invoice.create({
        data: {
          orgId: org.id,
          invoiceNumber: `QA-INV-${s.code}-U`,
          studentId: student.id,
          totalAmount: 12500,
          paidAmount: 0,
          status: 'UNPAID',
          dueDate: day(5)
        }
      })
      await prisma.invoiceItem.create({
        data: { orgId: org.id, invoiceId: inv.id, head: 'Term 2 Tuition', amount: 12500, quantity: 1 }
      })
    }
    const paid = await prisma.invoice.findFirst({ where: { studentId: student.id, status: 'PAID' } })
    if (!paid) {
      const inv = await prisma.invoice.create({
        data: {
          orgId: org.id,
          invoiceNumber: `QA-INV-${s.code}-P`,
          studentId: student.id,
          totalAmount: 11000,
          paidAmount: 11000,
          status: 'PAID',
          dueDate: day(-30)
        }
      })
      await prisma.invoiceItem.create({
        data: { orgId: org.id, invoiceId: inv.id, head: 'Term 1 Tuition', amount: 11000, quantity: 1 }
      })
      await prisma.payment.create({
        data: {
          orgId: org.id,
          receiptNumber: `QA-RCP-${s.code}`,
          invoiceId: inv.id,
          studentId: student.id,
          amount: 11000,
          method: 'CASH',
          status: 'SUCCESS',
          paidAt: day(-30)
        }
      })
    }

    // Attendance for today — one absent kid so the parent alert path shows
    const att = await prisma.attendanceRecord.findFirst({
      where: { orgId: org.id, studentId: student.id, date: todayUtc, sessionKey: 'DAY' }
    })
    if (!att) {
      await prisma.attendanceRecord.create({
        data: {
          orgId: org.id,
          studentId: student.id,
          date: todayUtc,
          status: i === 4 ? 'ABSENT' : 'PRESENT',
          source: 'MANUAL'
        }
      })
    }
  }

  // Leads (assigned to the counsellor so the counsellor work queue fills)
  for (const [i, l] of LEADS.entries()) {
    const exists = await prisma.lead.findFirst({ where: { orgId: org.id, phone: l.phone } })
    if (!exists) {
      await prisma.lead.create({
        data: {
          orgId: org.id,
          leadCode: `QA-LD-${String(i + 1).padStart(4, '0')}`,
          parentName: l.parent,
          phone: l.phone,
          phoneNormalized: l.phone,
          kidName: l.kid,
          gradeSought: l.grade,
          status: l.status,
          priority: l.priority,
          source: 'WALK_IN',
          assignedToId: counsellorId,
          nextFollowUpAt: l.status === 'FOLLOW_UP_PENDING' ? day(1) : null
        }
      })
      console.log(`Lead: ${l.parent}`)
    }
  }

  // Admissions across pipeline stages
  for (const [i, a] of ADMISSIONS.entries()) {
    const exists = await prisma.admission.findFirst({ where: { orgId: org.id, phone: a.phone } })
    if (!exists) {
      await prisma.admission.create({
        data: {
          orgId: org.id,
          admissionCode: `QA-ADM-${String(i + 1).padStart(4, '0')}`,
          applicantName: a.applicant,
          parentName: a.parent,
          phone: a.phone,
          phoneNormalized: a.phone,
          gradeSought: a.grade,
          stageId: stageByName.get(a.stage) ?? null,
          status: 'IN_PROGRESS',
          assignedToId: counsellorId
        }
      })
      console.log(`Admission: ${a.applicant} (${a.stage})`)
    }
  }

  // Courses + batches + today's sessions — feeds the enrol wizard and the
  // schedule screens (course_schedule module).
  const courseDefs = [
    { name: 'JEE Foundation', amount: 3500, durationMonths: 12 },
    { name: 'NEET Weekend', amount: 4200, durationMonths: 10 }
  ]
  const courseByName = new Map<string, { id: string }>()
  for (const c of courseDefs) {
    let course = await prisma.course.findFirst({ where: { orgId: org.id, name: c.name } })
    if (!course) {
      course = await prisma.course.create({
        data: {
          orgId: org.id,
          name: c.name,
          amount: c.amount,
          frequency: 'MONTHLY',
          billingDay: 5,
          durationMonths: c.durationMonths,
          isActive: true
        }
      })
      console.log(`Course: ${c.name}`)
    }
    courseByName.set(c.name, course)
  }

  const batchDefs = [
    { name: 'Batch A · MWF 5–7 PM', course: 'JEE Foundation', days: ['Mon', 'Wed', 'Fri'], start: '17:00', end: '19:00' },
    { name: 'Batch B · Weekend', course: 'NEET Weekend', days: ['Sat', 'Sun'], start: '09:00', end: '11:00' }
  ]
  const batchByName = new Map<string, { id: string }>()
  for (const b of batchDefs) {
    let batch = await prisma.studentBatch.findFirst({ where: { orgId: org.id, name: b.name } })
    if (!batch) {
      batch = await prisma.studentBatch.create({
        data: {
          orgId: org.id,
          name: b.name,
          courseId: courseByName.get(b.course)!.id,
          daysOfWeek: b.days,
          startTime: b.start,
          endTime: b.end,
          sessionDurationMin: 120,
          isActive: true
        }
      })
      console.log(`Batch: ${b.name}`)
    }
    batchByName.set(b.name, batch)
  }

  // Sessions: two today (one soon, one later) + one tomorrow.
  const sessionSlots = [
    { batch: 'Batch A · MWF 5–7 PM', course: 'JEE Foundation', hoursFromNow: 2, durationMin: 60 },
    { batch: 'Batch A · MWF 5–7 PM', course: 'JEE Foundation', hoursFromNow: 5, durationMin: 90 },
    { batch: 'Batch B · Weekend', course: 'NEET Weekend', hoursFromNow: 26, durationMin: 120 }
  ]
  for (const slot of sessionSlots) {
    const startsAt = new Date(Date.now() + slot.hoursFromNow * 3_600_000)
    startsAt.setMinutes(0, 0, 0)
    const batchId = batchByName.get(slot.batch)!.id
    const exists = await prisma.courseSession.findFirst({ where: { batchId, startsAt } })
    if (!exists) {
      await prisma.courseSession.create({
        data: {
          orgId: org.id,
          batchId,
          courseId: courseByName.get(slot.course)!.id,
          teacherId: teacherId,
          startsAt,
          durationMin: slot.durationMin,
          status: 'SCHEDULED'
        }
      })
      console.log(`Session: ${slot.course} +${slot.hoursFromNow}h`)
    }
  }

  // Payment gateway — Razorpay TEST creds from env so the parent Pay flow
  // works end-to-end (skipped when env keys are absent or not rzp_test_).
  const rzpKeyId = process.env.RAZORPAY_KEY_ID
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET
  if (rzpKeyId?.startsWith('rzp_test_') && rzpSecret) {
    const existingGw = await prisma.paymentGatewayConfig.findFirst({
      where: { orgId: org.id, provider: 'RAZORPAY', environment: 'TEST' }
    })
    if (!existingGw) {
      await prisma.paymentGatewayConfig.create({
        data: {
          orgId: org.id,
          provider: 'RAZORPAY',
          environment: 'TEST',
          status: 'ACTIVE',
          isCurrent: true,
          keyIdEncrypted: encryptSecret(rzpKeyId),
          keySecretEncrypted: encryptSecret(rzpSecret),
          webhookSecretEnc: encryptSecret(generateWebhookSecret()),
          encryptionKeyVer: currentKeyVersion(),
          keyIdLast4: rzpKeyId.slice(-4),
          verifiedAt: new Date()
        }
      })
      console.log('Payment gateway: Razorpay TEST config created')
    } else if (existingGw.status !== 'ACTIVE' || !existingGw.isCurrent) {
      await prisma.paymentGatewayConfig.update({
        where: { id: existingGw.id },
        data: { status: 'ACTIVE', isCurrent: true, deletedAt: null }
      })
      console.log('Payment gateway: existing config activated')
    } else {
      console.log('Payment gateway: already active')
    }
  } else {
    console.log('Payment gateway: skipped (no rzp_test_ keys in env)')
  }

  // Learning-centre QA org — same admin gets a second workspace (tests the
  // picker) and the LC home variant (collections card + sessions tile).
  const lcOrg =
    (await prisma.organization.findUnique({ where: { slug: `${ORG_SLUG}-lc` } })) ??
    (await prisma.organization.create({
      data: {
        name: 'Brainwave Learning Centre (QA)',
        slug: `${ORG_SLUG}-lc`,
        institutionType: 'LEARNING_CENTER',
        email: 'mobile-qa-lc@vidhyaan.test',
        phone: '0000000001',
        isDummy: true,
        status: 'ACTIVE'
      }
    }))
  for (const mod of modules) {
    await prisma.organizationModule.upsert({
      where: { orgId_moduleId: { orgId: lcOrg.id, moduleId: mod.id } },
      update: { enabled: true },
      create: { orgId: lcOrg.id, moduleId: mod.id, enabled: true, enabledAt: new Date() }
    })
  }
  const adminUser = staffUsers.get('ORG_ADMIN')!
  const lcAssignment = await prisma.userRoleAssignment.findFirst({
    where: { userId: adminUser.id, role: 'ORG_ADMIN', orgId: lcOrg.id }
  })
  if (!lcAssignment) {
    await prisma.userRoleAssignment.create({
      data: { userId: adminUser.id, role: 'ORG_ADMIN', orgId: lcOrg.id, status: 'ACTIVE' }
    })
    console.log('LC org admin assignment created (workspace picker will appear for 9999955002)')
  }

  // LC data: a course/batch/session + a student + payments this month and
  // same month last year (feeds the collections comparison).
  let lcCourse = await prisma.course.findFirst({ where: { orgId: lcOrg.id, name: 'Spoken English' } })
  if (!lcCourse) {
    lcCourse = await prisma.course.create({
      data: { orgId: lcOrg.id, name: 'Spoken English', amount: 2000, frequency: 'MONTHLY', billingDay: 5, isActive: true }
    })
  }
  let lcBatch = await prisma.studentBatch.findFirst({ where: { orgId: lcOrg.id, name: 'Evening batch' } })
  if (!lcBatch) {
    lcBatch = await prisma.studentBatch.create({
      data: {
        orgId: lcOrg.id,
        name: 'Evening batch',
        courseId: lcCourse.id,
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu'],
        startTime: '18:00',
        endTime: '19:00',
        sessionDurationMin: 60,
        isActive: true
      }
    })
  }
  const lcSessionStart = new Date(Date.now() + 3 * 3_600_000)
  lcSessionStart.setMinutes(0, 0, 0)
  if (!(await prisma.courseSession.findFirst({ where: { batchId: lcBatch.id, startsAt: lcSessionStart } }))) {
    await prisma.courseSession.create({
      data: { orgId: lcOrg.id, batchId: lcBatch.id, courseId: lcCourse.id, startsAt: lcSessionStart, durationMin: 60, status: 'SCHEDULED' }
    })
  }
  let lcStudent = await prisma.student.findFirst({ where: { orgId: lcOrg.id, studentCode: 'QA-LC-01' } })
  if (!lcStudent) {
    lcStudent = await prisma.student.create({
      data: {
        orgId: lcOrg.id,
        studentCode: 'QA-LC-01',
        name: 'Nikhil J',
        guardianName: 'Jayan K',
        guardianPhone: '9999955041',
        phoneNormalized: '9999955041',
        status: 'ACTIVE',
        batchId: lcBatch.id
      }
    })
  }
  const lcPayments = [
    { rcp: 'QA-LC-RCP-1', amount: 8000, paidAt: new Date() },
    { rcp: 'QA-LC-RCP-2', amount: 6500, paidAt: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 12) }
  ]
  for (const p of lcPayments) {
    if (!(await prisma.payment.findFirst({ where: { orgId: lcOrg.id, receiptNumber: p.rcp } }))) {
      const inv = await prisma.invoice.create({
        data: {
          orgId: lcOrg.id,
          invoiceNumber: `QA-LC-INV-${p.rcp.slice(-1)}`,
          studentId: lcStudent.id,
          courseId: lcCourse.id,
          totalAmount: p.amount,
          paidAmount: p.amount,
          status: 'PAID',
          dueDate: p.paidAt
        }
      })
      await prisma.payment.create({
        data: {
          orgId: lcOrg.id,
          receiptNumber: p.rcp,
          invoiceId: inv.id,
          studentId: lcStudent.id,
          amount: p.amount,
          method: 'CASH',
          status: 'SUCCESS',
          paidAt: p.paidAt
        }
      })
    }
  }
  console.log(`LC org ready: ${lcOrg.name}`)

  // Two published events
  const events = [
    { title: 'Annual Day 2026', desc: 'Annual cultural evening — performances by every grade.', at: day(10), loc: 'Main ground' },
    { title: 'Parent-Teacher Meeting', desc: 'Term 2 progress discussion — slots by class.', at: day(3), loc: 'Classrooms, Block A' }
  ]
  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { orgId: org.id, title: e.title } })
    if (!exists) {
      await prisma.event.create({
        data: {
          orgId: org.id,
          title: e.title,
          description: e.desc,
          status: 'PUBLISHED',
          startsAt: e.at,
          location: e.loc,
          publishedAt: new Date()
        }
      })
      console.log(`Event: ${e.title}`)
    }
  }

  console.log('\nDone. Logins (PIN 2580; OTP 123456 if phone is in MOBILE_TEST_PHONES):')
  for (const u of [{ ...PARENT, role: 'PARENT' }, ...STAFF]) {
    console.log(`  ${u.phone}  ${u.role.padEnd(12)} ${u.name}`)
  }
}

main().finally(() => prisma.$disconnect())
