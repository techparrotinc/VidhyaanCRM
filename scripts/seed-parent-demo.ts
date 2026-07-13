/**
 * Demo data for the parent-portal UX review.
 * Links two demo students at "Chennai Brightpath Academy" (existing demo org)
 * to the test parent (phone 9300000093) and fills timetable, attendance,
 * invoices, events and notifications.
 *
 * Everything it creates is tagged with DEMO_TAG in notes/description or uses
 * the DEMO- code prefix, so `--clean` can remove it precisely.
 *
 *   npx tsx scripts/seed-parent-demo.ts          # seed
 *   npx tsx scripts/seed-parent-demo.ts --clean  # remove seeded rows
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PARENT_PHONE = '9300000093'
const ORG_NAME = 'Chennai Brightpath Academy'
const DEMO_TAG = '[parent-portal-demo]'

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
function istDate(daysFromToday: number, hh = 0, mm = 0): Date {
  const todayIst = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
  const base = new Date(`${todayIst}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + daysFromToday)
  return new Date(base.getTime() - IST_OFFSET_MS + (hh * 60 + mm) * 60 * 1000)
}

async function clean(orgId: string) {
  const students = await prisma.student.findMany({
    where: { orgId, studentCode: { startsWith: 'DEMO-' } },
    select: { id: true }
  })
  const ids = students.map((s) => s.id)
  await prisma.examResult.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.leaveRequest.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.attendanceRecord.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.payment.deleteMany({ where: { orgId, receiptNumber: { startsWith: 'DEMO-' } } })
  await prisma.invoiceItem.deleteMany({
    where: { invoice: { orgId, invoiceNumber: { startsWith: 'DEMO-' } } }
  })
  await prisma.invoice.deleteMany({ where: { orgId, invoiceNumber: { startsWith: 'DEMO-' } } })
  await prisma.studentGuardianLink.deleteMany({ where: { studentId: { in: ids } } })
  await prisma.student.deleteMany({ where: { id: { in: ids } } })
  await prisma.timetableSlot.deleteMany({ where: { orgId, room: { startsWith: 'DEMO' } } })
  await prisma.eventRsvp.deleteMany({ where: { event: { orgId, description: { contains: DEMO_TAG } } } })
  await prisma.event.deleteMany({ where: { orgId, description: { contains: DEMO_TAG } } })
  await prisma.notification.deleteMany({ where: { orgId, body: { contains: DEMO_TAG } } })
  await prisma.term.deleteMany({ where: { orgId, academicYear: { name: 'DEMO 2026-27' } } })
  await prisma.academicYear.deleteMany({ where: { orgId, name: 'DEMO 2026-27' } })
  console.log(`Cleaned demo rows (${ids.length} students + related).`)
}

async function main() {
  const parent = await prisma.parent.findFirst({ where: { phone: PARENT_PHONE } })
  if (!parent) throw new Error(`Parent with phone ${PARENT_PHONE} not found`)
  const org = await prisma.organization.findFirst({ where: { name: ORG_NAME, deletedAt: null } })
  if (!org) throw new Error(`Org "${ORG_NAME}" not found`)

  if (process.argv.includes('--clean')) {
    await clean(org.id)
    return
  }

  // Idempotent: clean first, then seed fresh
  await clean(org.id)

  // ---- Students ----
  const arjun = await prisma.student.create({
    data: {
      orgId: org.id,
      studentCode: 'DEMO-2026-00001',
      name: 'Arjun V',
      gradeLabel: 'Grade 5',
      section: 'A',
      rollNumber: '12',
      gender: 'MALE',
      status: 'ACTIVE',
      guardianName: parent.name ?? 'Triha V',
      guardianPhone: PARENT_PHONE,
      guardianEmail: parent.email,
      phoneNormalized: PARENT_PHONE
    }
  })
  const meera = await prisma.student.create({
    data: {
      orgId: org.id,
      studentCode: 'DEMO-2026-00002',
      name: 'Meera V',
      gradeLabel: 'Grade 2',
      section: 'B',
      rollNumber: '7',
      gender: 'FEMALE',
      status: 'ACTIVE',
      guardianName: parent.name ?? 'Triha V',
      guardianPhone: PARENT_PHONE,
      guardianEmail: parent.email,
      phoneNormalized: PARENT_PHONE
    }
  })

  for (const s of [arjun, meera]) {
    await prisma.studentGuardianLink.create({
      data: {
        orgId: org.id,
        studentId: s.id,
        parentId: parent.id,
        relation: 'MOTHER',
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    })
  }

  // ---- Timetable (Mon–Sat, 6 periods) ----
  const g5: [string, string][] = [
    ['Mathematics', 'Mr. Ramesh'], ['English', 'Ms. Divya'], ['Science', 'Mrs. Kavitha'],
    ['Social Studies', 'Mr. Arun'], ['Tamil', 'Mrs. Lakshmi'], ['Physical Education', 'Coach Vijay']
  ]
  const g2: [string, string][] = [
    ['English', 'Ms. Anita'], ['Mathematics', 'Mrs. Rekha'], ['EVS', 'Ms. Priya'],
    ['Tamil', 'Mrs. Meena'], ['Art & Craft', 'Ms. Sandhya'], ['Music', 'Mr. Karthik']
  ]
  const periods: [string, string][] = [
    ['09:00', '09:45'], ['09:45', '10:30'], ['10:45', '11:30'],
    ['11:30', '12:15'], ['13:00', '13:45'], ['13:45', '14:30']
  ]
  const slots: any[] = []
  for (let day = 1; day <= 6; day++) {
    const nPeriods = day === 6 ? 4 : 6 // Saturday half day
    for (let i = 0; i < nPeriods; i++) {
      // rotate subjects per day so the week isn't identical
      const s5 = g5[(i + day) % g5.length]
      const s2 = g2[(i + day * 2) % g2.length]
      slots.push({
        orgId: org.id, gradeLabel: 'Grade 5', section: 'A', sectionKey: 'A',
        dayOfWeek: day, startTime: periods[i][0], endTime: periods[i][1],
        subject: s5[0], room: `DEMO-Room 501`, teacherId: null
      })
      slots.push({
        orgId: org.id, gradeLabel: 'Grade 2', section: 'B', sectionKey: 'B',
        dayOfWeek: day, startTime: periods[i][0], endTime: periods[i][1],
        subject: s2[0], room: `DEMO-Room 201`, teacherId: null
      })
    }
  }
  await prisma.timetableSlot.createMany({ data: slots })

  // ---- Attendance (last 25 days, skip Sundays) ----
  const attRows: any[] = []
  for (let d = 25; d >= 1; d--) {
    const date = istDate(-d)
    const dow = new Date(date.getTime() + IST_OFFSET_MS).getUTCDay()
    if (dow === 0) continue // Sunday
    // Arjun: 2 absents + 1 half-day; Meera: 1 absent
    const arjunStatus = d === 4 || d === 11 ? 'ABSENT' : d === 7 ? 'HALF_DAY' : 'PRESENT'
    const meeraStatus = d === 9 ? 'ABSENT' : 'PRESENT'
    const arjunNote =
      d === 4 ? 'Sick leave — fever (informed by parent)' : d === 7 ? 'Left early — dental appointment' : null
    attRows.push(
      { orgId: org.id, studentId: arjun.id, date, status: arjunStatus, source: 'MANUAL', note: arjunNote },
      { orgId: org.id, studentId: meera.id, date, status: meeraStatus, source: 'MANUAL', note: d === 9 ? 'Family function' : null }
    )
  }
  await prisma.attendanceRecord.createMany({ data: attRows })

  // ---- Academic year + terms (Term 1/2/3 grouping on the fees page) ----
  const ay = await prisma.academicYear.create({
    data: {
      orgId: org.id, name: 'DEMO 2026-27', type: 'ACADEMIC', status: 'ACTIVE',
      startDate: istDate(-60), endDate: istDate(305)
    }
  })
  const [term1, term2] = await Promise.all([
    prisma.term.create({ data: { orgId: org.id, academicYearId: ay.id, name: 'Term 1', order: 1, startDate: istDate(-60), endDate: istDate(30) } }),
    prisma.term.create({ data: { orgId: org.id, academicYearId: ay.id, name: 'Term 2', order: 2, startDate: istDate(31), endDate: istDate(150) } }),
    prisma.term.create({ data: { orgId: org.id, academicYearId: ay.id, name: 'Term 3', order: 3, startDate: istDate(151), endDate: istDate(305) } })
  ])

  // ---- Invoices ----
  // Arjun (term-fee pattern): paid Term 1, unpaid Term 2 (due in 3 days), overdue transport
  const invPaid = await prisma.invoice.create({
    data: {
      orgId: org.id, invoiceNumber: 'DEMO-INV-2026-00001', studentId: arjun.id,
      academicYearId: ay.id, termId: term1.id,
      totalAmount: 18500, paidAmount: 18500, status: 'PAID', invoiceType: 'ADHOC',
      dueDate: istDate(-30), notes: `Term 1 tuition fee ${DEMO_TAG}`,
      items: { create: [
        { orgId: org.id, head: 'Tuition Fee — Term 1', amount: 15000 },
        { orgId: org.id, head: 'Books & Stationery', amount: 2500 },
        { orgId: org.id, head: 'Activity Fee', amount: 1000 }
      ] }
    }
  })
  await prisma.payment.create({
    data: {
      orgId: org.id, receiptNumber: 'DEMO-RCP-2026-00001', invoiceId: invPaid.id,
      studentId: arjun.id, amount: 18500, method: 'UPI', status: 'SUCCESS',
      paidAt: istDate(-28, 10, 30)
    }
  })
  await prisma.invoice.create({
    data: {
      orgId: org.id, invoiceNumber: 'DEMO-INV-2026-00002', studentId: arjun.id,
      academicYearId: ay.id, termId: term2.id,
      totalAmount: 16500, paidAmount: 0, status: 'UNPAID', invoiceType: 'ADHOC',
      dueDate: istDate(3), notes: `Term 2 tuition fee ${DEMO_TAG}`,
      items: { create: [
        { orgId: org.id, head: 'Tuition Fee — Term 2', amount: 15000 },
        { orgId: org.id, head: 'Lab Fee', amount: 1500 }
      ] }
    }
  })
  await prisma.invoice.create({
    data: {
      orgId: org.id, invoiceNumber: 'DEMO-INV-2026-00003', studentId: arjun.id,
      academicYearId: ay.id,
      totalAmount: 4200, paidAmount: 0, status: 'OVERDUE', invoiceType: 'ADHOC',
      dueDate: istDate(-6), notes: `Transport fee ${DEMO_TAG}`,
      items: { create: [{ orgId: org.id, head: 'Transport Fee — Q2', amount: 4200 }] }
    }
  })
  // Meera (monthly-fee pattern): May paid, June paid, July unpaid — no term
  const meeraMonthly = [
    { n: 4, amount: 7500, paid: 7500, status: 'PAID', due: istDate(-65), label: 'May' },
    { n: 5, amount: 7500, paid: 7500, status: 'PAID', due: istDate(-35), label: 'June' },
    { n: 6, amount: 7500, paid: 0, status: 'UNPAID', due: istDate(10), label: 'July' }
  ] as const
  for (const m of meeraMonthly) {
    const inv = await prisma.invoice.create({
      data: {
        orgId: org.id, invoiceNumber: `DEMO-INV-2026-0000${m.n}`, studentId: meera.id,
        academicYearId: ay.id,
        totalAmount: m.amount, paidAmount: m.paid, status: m.status, invoiceType: 'ADHOC',
        dueDate: m.due, notes: `${m.label} monthly fee ${DEMO_TAG}`,
        items: { create: [{ orgId: org.id, head: `Monthly Tuition — ${m.label}`, amount: m.amount }] }
      }
    })
    if (m.paid > 0) {
      await prisma.payment.create({
        data: {
          orgId: org.id, receiptNumber: `DEMO-RCP-2026-0000${m.n}`, invoiceId: inv.id,
          studentId: meera.id, amount: m.paid, method: 'UPI', status: 'SUCCESS',
          paidAt: new Date(m.due.getTime() - 2 * 24 * 60 * 60 * 1000)
        }
      })
    }
  }

  // ---- Events (published) ----
  await prisma.event.createMany({
    data: [
      {
        orgId: org.id, title: 'Parent–Teacher Meeting', type: 'PTM', status: 'PUBLISHED',
        startsAt: istDate(1, 16, 0), endsAt: istDate(1, 18, 0),
        location: 'School Auditorium', publishedAt: new Date(), audience: 'PARENTS',
        description: `Discuss your child's Term 1 progress with class teachers. ${DEMO_TAG}`
      },
      {
        orgId: org.id, title: 'Science Fair 2026', type: 'EXHIBITION', status: 'PUBLISHED',
        startsAt: istDate(3, 9, 30), endsAt: istDate(3, 13, 0),
        location: 'Main Block — Labs', publishedAt: new Date(), audience: 'ALL', capacity: 200,
        description: `Student projects on display; parents welcome. ${DEMO_TAG}`
      },
      {
        orgId: org.id, title: 'Annual Day Celebration', type: 'ANNUAL_DAY', status: 'PUBLISHED',
        startsAt: istDate(9, 17, 30), endsAt: istDate(9, 20, 30),
        location: 'Open Grounds', publishedAt: new Date(), audience: 'ALL', capacity: 500,
        description: `Cultural performances by students. Dinner follows. ${DEMO_TAG}`
      }
    ]
  })

  // ---- Exam results (report card) ----
  const arjunUnit: [string, number, number, string][] = [
    ['Mathematics', 42, 50, 'A'], ['English', 44, 50, 'A'], ['Science', 38, 50, 'B+'],
    ['Social Studies', 40, 50, 'A'], ['Tamil', 35, 50, 'B']
  ]
  const arjunMid: [string, number, number, string][] = [
    ['Mathematics', 88, 100, 'A'], ['English', 91, 100, 'A+'], ['Science', 76, 100, 'B+'],
    ['Social Studies', 84, 100, 'A'], ['Tamil', 71, 100, 'B']
  ]
  const meeraUnit: [string, number, number, string][] = [
    ['English', 46, 50, 'A+'], ['Mathematics', 43, 50, 'A'], ['EVS', 45, 50, 'A+'], ['Tamil', 40, 50, 'A']
  ]
  const meeraMid: [string, number, number, string][] = [
    ['English', 94, 100, 'A+'], ['Mathematics', 87, 100, 'A'], ['EVS', 92, 100, 'A+'], ['Tamil', 82, 100, 'A']
  ]
  await prisma.examResult.createMany({
    data: [
      ...arjunUnit.map(([subject, marks, max, grade]) => ({
        orgId: org.id, studentId: arjun.id, academicYearId: ay.id, termId: term1.id,
        examName: 'Unit Test 1', subject, marksObtained: marks, maxMarks: max, grade,
        examDate: istDate(-40),
        remarks: subject === 'Tamil' ? 'Needs more practice with grammar' : null
      })),
      ...arjunMid.map(([subject, marks, max, grade]) => ({
        orgId: org.id, studentId: arjun.id, academicYearId: ay.id, termId: term1.id,
        examName: 'Mid-Term Exam', subject, marksObtained: marks, maxMarks: max, grade,
        examDate: istDate(-12),
        remarks: subject === 'English' ? 'Excellent comprehension skills' : null
      })),
      ...meeraUnit.map(([subject, marks, max, grade]) => ({
        orgId: org.id, studentId: meera.id, academicYearId: ay.id, termId: term1.id,
        examName: 'Unit Test 1', subject, marksObtained: marks, maxMarks: max, grade,
        examDate: istDate(-40)
      })),
      ...meeraMid.map(([subject, marks, max, grade]) => ({
        orgId: org.id, studentId: meera.id, academicYearId: ay.id, termId: term1.id,
        examName: 'Mid-Term Exam', subject, marksObtained: marks, maxMarks: max, grade,
        examDate: istDate(-12)
      }))
    ]
  })

  // ---- Leave requests (one approved, one pending) ----
  await prisma.leaveRequest.create({
    data: {
      orgId: org.id, studentId: arjun.id, parentId: parent.id,
      fromDate: istDate(-11), toDate: istDate(-11),
      reason: 'Fever — doctor advised rest',
      status: 'APPROVED', reviewNote: 'Get well soon!', reviewedAt: istDate(-11, 12, 0)
    }
  })
  await prisma.leaveRequest.create({
    data: {
      orgId: org.id, studentId: meera.id, parentId: parent.id,
      fromDate: istDate(5), toDate: istDate(6),
      reason: 'Family wedding out of town',
      status: 'PENDING'
    }
  })

  // ---- Notifications ----
  await prisma.notification.createMany({
    data: [
      {
        orgId: org.id, recipientType: 'PARENT', recipientId: parent.id,
        title: 'Fee reminder: ₹16,500 due soon',
        body: `Term 2 tuition for Arjun V is due in 3 days. ${DEMO_TAG}`,
        data: { href: '/parent/fees' },
        createdAt: istDate(0, 8, 15)
      },
      {
        orgId: org.id, recipientType: 'PARENT', recipientId: parent.id,
        title: 'Mid-Term Exam results published',
        body: `Report cards for Arjun V and Meera V are now available. ${DEMO_TAG}`,
        data: { href: '/parent/results' },
        createdAt: istDate(0, 9, 30)
      },
      {
        orgId: org.id, recipientType: 'PARENT', recipientId: parent.id,
        title: 'PTM tomorrow at 4 PM',
        body: `Parent–Teacher Meeting in the School Auditorium. ${DEMO_TAG}`,
        createdAt: istDate(0, 7, 0)
      },
      {
        orgId: org.id, recipientType: 'PARENT', recipientId: parent.id,
        title: 'Arjun marked absent',
        body: `Arjun V was marked absent on ${istDate(-4).toDateString()}. ${DEMO_TAG}`,
        readAt: istDate(-3, 9, 0), createdAt: istDate(-4, 10, 0)
      },
      {
        orgId: org.id, recipientType: 'PARENT', recipientId: parent.id,
        title: 'Payment received — ₹18,500',
        body: `Term 1 tuition for Arjun V. Receipt DEMO-RCP-2026-00001. ${DEMO_TAG}`,
        readAt: istDate(-27, 9, 0), createdAt: istDate(-28, 10, 35)
      }
    ]
  })

  console.log('Seeded:')
  console.log(`  students: Arjun V (Grade 5A), Meera V (Grade 2B) @ ${org.name}`)
  console.log(`  timetable: ${slots.length} slots, attendance: ${attRows.length} records`)
  console.log('  invoices: 4 (paid/unpaid/overdue/partial) + 1 payment')
  console.log('  events: 3 published, notifications: 4')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
