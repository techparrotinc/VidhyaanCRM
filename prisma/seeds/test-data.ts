import { PrismaClient, StudentStatus, AdmissionStatus, InvoiceStatus, InvoiceType, PaymentMethod, LeadStatus, LeadSource, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

const ORG_ID          = 'cmqxu48dy001cqtyti3zf0ywk'
const ACADEMIC_YEAR_ID = 'cmqxu48v3001xqtyts0e8aykj'
const USER_ID         = 'cmqxu48k5001gqtyt4ana37lp' // Saran Kumar - ORG_ADMIN
const COUNSELLOR_ID   = 'cmqxu48ln001iqtyt8ibid3sc' // Pradeep Kumar

const STAGE_NEW         = 'cmqxu48y8001yqtytz7vrbayt'
const STAGE_CONTACTED   = 'cmqxu48y8001zqtyt5mcnppjf'
const STAGE_APP_SUB     = 'cmqxu48y80020qtytdtxha90k'
const STAGE_DOCS        = 'cmqxu48y80021qtyttxrg11za'
const STAGE_INTERVIEW   = 'cmqxu48y80022qtyt4lt09atu'
const STAGE_PAYMENT     = 'cmqxu48y80023qtytk3y5vbg1'
const STAGE_ADMITTED    = 'cmqxu48y80024qtytzbrp4yeb'
const STAGE_REJECTED    = 'cmqxu48y80025qtyt7ayr4l6n'

const TERM_1 = 'cmqy215z00006m2wdmv91qlww'
const TERM_2 = 'cmqy215z00007m2wdgv4l0gcg'
const TERM_3 = 'cmqy215z00008m2wd8pxkfpss'

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15)
}

async function main() {
  console.log('🌱 Seeding test data for Prince Matriculation School...')

  // ─── LEADS ──────────────────────────────────────────
  console.log('Creating leads...')

  const leadData = [
    { parentName: 'Rajesh Sharma',    kidName: 'Arjun Sharma',    phone: '9841001001', gradeSought: 'Class 6',  status: LeadStatus.NEW,       source: LeadSource.WALK_IN },
    { parentName: 'Meena Krishnan',   kidName: 'Kavya Krishnan',  phone: '9841001002', gradeSought: 'Class 3',  status: LeadStatus.CONTACTED, source: LeadSource.PHONE },
    { parentName: 'Suresh Patel',     kidName: 'Rohan Patel',     phone: '9841001003', gradeSought: 'Class 9',  status: LeadStatus.FOLLOW_UP_PENDING, source: LeadSource.WEBSITE },
    { parentName: 'Anitha Rajan',     kidName: 'Priya Rajan',     phone: '9841001004', gradeSought: 'Class 1',  status: LeadStatus.NEW,       source: LeadSource.REFERRAL },
    { parentName: 'Venkat Subramani', kidName: 'Karthik Venkat',  phone: '9841001005', gradeSought: 'Class 11', status: LeadStatus.FOLLOW_UP_PENDING, source: LeadSource.SOCIAL_MEDIA },
    { parentName: 'Deepa Nair',       kidName: 'Anika Nair',      phone: '9841001006', gradeSought: 'Class 4',  status: LeadStatus.CONTACTED, source: LeadSource.WALK_IN },
    { parentName: 'Murugan Pillai',   kidName: 'Surya Murugan',   phone: '9841001007', gradeSought: 'Class 7',  status: LeadStatus.NEW,       source: LeadSource.VIDHYAAN },
  ]

  let leadIndex = 1
  for (const lead of leadData) {
    const leadCode = `LD-2026-SEED-0000${leadIndex++}`
    await prisma.lead.upsert({
      where: { id: 'lead_' + lead.phone },
      update: {},
      create: {
        id:            'lead_' + lead.phone,
        orgId:         ORG_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        leadCode,
        parentName:    lead.parentName,
        kidName:       lead.kidName,
        phone:         lead.phone,
        gradeSought:   lead.gradeSought,
        status:        lead.status,
        source:        lead.source,
        assignedToId:  COUNSELLOR_ID,
        createdById:   USER_ID,
      }
    })
  }
  console.log(`✅ ${leadData.length} leads created`)

  // ─── STUDENTS ───────────────────────────────────────
  console.log('Creating students...')

  const studentData = [
    { code: 'ST-2026-00001', name: 'Aarav Mehta',       grade: 'Class 1',  gender: 'MALE',   status: StudentStatus.ACTIVE,      guardian: 'Rahul Mehta',      phone: '9841002001', roll: '101' },
    { code: 'ST-2026-00002', name: 'Diya Sharma',        grade: 'Class 2',  gender: 'FEMALE', status: StudentStatus.ACTIVE,      guardian: 'Priya Sharma',     phone: '9841002002', roll: '201' },
    { code: 'ST-2026-00003', name: 'Karan Singh',        grade: 'Class 3',  gender: 'MALE',   status: StudentStatus.ACTIVE,      guardian: 'Harpreet Singh',   phone: '9841002003', roll: '301' },
    { code: 'ST-2026-00004', name: 'Ananya Krishnan',    grade: 'Class 4',  gender: 'FEMALE', status: StudentStatus.ACTIVE,      guardian: 'Sunita Krishnan',  phone: '9841002004', roll: '401' },
    { code: 'ST-2026-00005', name: 'Rohan Patel',        grade: 'Class 5',  gender: 'MALE',   status: StudentStatus.ACTIVE,      guardian: 'Amit Patel',       phone: '9841002005', roll: '501' },
    { code: 'ST-2026-00006', name: 'Sneha Nair',         grade: 'Class 6',  gender: 'FEMALE', status: StudentStatus.ACTIVE,      guardian: 'Deepa Nair',       phone: '9841002006', roll: '601' },
    { code: 'ST-2026-00007', name: 'Arjun Rajan',        grade: 'Class 7',  gender: 'MALE',   status: StudentStatus.ACTIVE,      guardian: 'Suresh Rajan',     phone: '9841002007', roll: '701' },
    { code: 'ST-2026-00008', name: 'Kavya Venkat',       grade: 'Class 8',  gender: 'FEMALE', status: StudentStatus.ACTIVE,      guardian: 'Venkat Kumar',     phone: '9841002008', roll: '801' },
    { code: 'ST-2026-00009', name: 'Vikram Subramani',   grade: 'Class 9',  gender: 'MALE',   status: StudentStatus.ACTIVE,      guardian: 'Raja Subramani',   phone: '9841002009', roll: '901' },
    { code: 'ST-2026-00010', name: 'Priya Murugan',      grade: 'Class 10', gender: 'FEMALE', status: StudentStatus.ACTIVE,      guardian: 'Murugan Pillai',   phone: '9841002010', roll: '1001' },
    { code: 'ST-2026-00011', name: 'Siddharth Iyer',     grade: 'Class 11', gender: 'MALE',   status: StudentStatus.ALUMNI,      guardian: 'Ramesh Iyer',      phone: '9841002011', roll: '1101' },
    { code: 'ST-2026-00012', name: 'Meera Chandrasekhar',grade: 'Class 12', gender: 'FEMALE', status: StudentStatus.TRANSFERRED, guardian: 'Chandrasekhar R',  phone: '9841002012', roll: '1201' },
  ]

  const studentIds: string[] = []

  for (const s of studentData) {
    const id = 'student_' + s.code.replace(/-/g, '_')
    studentIds.push(id)
    await prisma.student.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orgId:          ORG_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        studentCode:    s.code,
        name:           s.name,
        gradeLabel:     s.grade,
        gender:         s.gender as any,
        status:         s.status,
        rollNumber:     s.roll,
        guardianName:   s.guardian,
        guardianPhone:  s.phone,
      }
    })
  }
  console.log(`✅ ${studentData.length} students created`)

  // ─── ADMISSIONS ─────────────────────────────────────
  console.log('Creating admissions...')

  const admissionData = [
    { code: 'ADM-2026-00001', name: 'Arjun Sharma',    parent: 'Rajesh Sharma',  phone: '9841003001', grade: 'Class 6',  stageId: STAGE_NEW,       status: AdmissionStatus.IN_PROGRESS },
    { code: 'ADM-2026-00002', name: 'Kavya Krishnan',  parent: 'Meena Krishnan', phone: '9841003002', grade: 'Class 3',  stageId: STAGE_CONTACTED, status: AdmissionStatus.IN_PROGRESS },
    { code: 'ADM-2026-00003', name: 'Rohan Patel',     parent: 'Suresh Patel',   phone: '9841003003', grade: 'Class 9',  stageId: STAGE_APP_SUB,   status: AdmissionStatus.IN_PROGRESS },
    { code: 'ADM-2026-00004', name: 'Priya Rajan',     parent: 'Anitha Rajan',   phone: '9841003004', grade: 'Class 1',  stageId: STAGE_DOCS,      status: AdmissionStatus.IN_PROGRESS },
    { code: 'ADM-2026-00005', name: 'Karthik Venkat',  parent: 'Venkat S',       phone: '9841003005', grade: 'Class 11', stageId: STAGE_INTERVIEW, status: AdmissionStatus.IN_PROGRESS },
    { code: 'ADM-2026-00006', name: 'Anika Nair',      parent: 'Deepa Nair',     phone: '9841003006', grade: 'Class 4',  stageId: STAGE_ADMITTED,  status: AdmissionStatus.ADMITTED },
    { code: 'ADM-2026-00007', name: 'Surya Murugan',   parent: 'Murugan Pillai', phone: '9841003007', grade: 'Class 7',  stageId: STAGE_REJECTED,  status: AdmissionStatus.REJECTED },
  ]

  for (const a of admissionData) {
    const id = 'admission_' + a.code.replace(/-/g, '_')
    await prisma.admission.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orgId:          ORG_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        admissionCode:  a.code,
        applicantName:  a.name,
        parentName:     a.parent,
        phone:          a.phone,
        gradeSought:    a.grade,
        stageId:        a.stageId,
        status:         a.status,
        assignedToId:   COUNSELLOR_ID,
        createdById:    USER_ID,
      }
    })
  }
  console.log(`✅ ${admissionData.length} admissions created`)

  // ─── INVOICES ───────────────────────────────────────
  console.log('Creating invoices...')

  const invoiceData = [
    { num: 'INV-2026-00001', studentIdx: 0,  termId: TERM_1, amount: 15000, status: InvoiceStatus.PAID,            due: '2026-04-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00002', studentIdx: 1,  termId: TERM_1, amount: 12000, status: InvoiceStatus.PAID,            due: '2026-04-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00003', studentIdx: 2,  termId: TERM_1, amount: 18000, status: InvoiceStatus.PAID,            due: '2026-04-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00004', studentIdx: 3,  termId: TERM_1, amount: 15000, status: InvoiceStatus.UNPAID,          due: '2026-05-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00005', studentIdx: 4,  termId: TERM_1, amount: 12000, status: InvoiceStatus.UNPAID,          due: '2026-05-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00006', studentIdx: 5,  termId: TERM_2, amount: 15000, status: InvoiceStatus.UNPAID,          due: '2026-06-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00007', studentIdx: 6,  termId: TERM_2, amount: 18000, status: InvoiceStatus.OVERDUE,         due: '2026-05-01', type: InvoiceType.TERM },
    { num: 'INV-2026-00008', studentIdx: 7,  termId: TERM_2, amount: 12000, status: InvoiceStatus.OVERDUE,         due: '2026-05-01', type: InvoiceType.TERM },
    { num: 'INV-2026-00009', studentIdx: 8,  termId: TERM_2, amount: 15000, status: InvoiceStatus.PARTIALLY_PAID,  due: '2026-06-15', type: InvoiceType.TERM },
    { num: 'INV-2026-00010', studentIdx: 9,  termId: TERM_3, amount: 18000, status: InvoiceStatus.UNPAID,          due: '2026-07-10', type: InvoiceType.TERM },
    { num: 'INV-2026-00011', studentIdx: 10, termId: TERM_3, amount: 5000,  status: InvoiceStatus.WAIVED,          due: '2026-07-10', type: InvoiceType.ADHOC },
    { num: 'INV-2026-00012', studentIdx: 11, termId: TERM_1, amount: 15000, status: InvoiceStatus.SCHEDULED,       due: '2026-08-01', type: InvoiceType.TERM },
  ]

  for (const inv of invoiceData) {
    const id        = 'invoice_' + inv.num.replace(/-/g, '_')
    const studentId = studentIds[inv.studentIdx]

    await prisma.invoice.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orgId:          ORG_ID,
        academicYearId: ACADEMIC_YEAR_ID,
        studentId,
        termId:         inv.termId,
        invoiceNumber:  inv.num,
        totalAmount:    inv.amount,
        status:         inv.status,
        invoiceType:    inv.type,
        dueDate:        new Date(inv.due),
      }
    })
  }
  console.log(`✅ ${invoiceData.length} invoices created`)

  // ─── PAYMENTS (for PAID + PARTIALLY_PAID invoices) ──
  console.log('Creating payments...')

  const paymentData = [
    { invoiceId: 'invoice_INV_2026_00001', amount: 15000, method: PaymentMethod.CASH },
    { invoiceId: 'invoice_INV_2026_00002', amount: 12000, method: PaymentMethod.UPI },
    { invoiceId: 'invoice_INV_2026_00003', amount: 18000, method: PaymentMethod.NEFT },
    { invoiceId: 'invoice_INV_2026_00009', amount: 7500,  method: PaymentMethod.CASH },
  ]

  let paymentIndex = 1
  for (const p of paymentData) {
    const id = 'payment_' + p.invoiceId + '_1'
    const receiptNumber = `RCP-2026-SEED-0000${paymentIndex++}`
    await prisma.payment.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orgId:         ORG_ID,
        invoiceId:     p.invoiceId,
        receiptNumber,
        amount:        p.amount,
        method:        p.method,
        status:        PaymentStatus.SUCCESS,
        paidAt:        new Date(),
        createdById:   USER_ID,
      }
    })
  }
  console.log(`✅ ${paymentData.length} payments created`)

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('   Org:        Prince Matriculation School')
  console.log('   Leads:      7')
  console.log('   Students:   12')
  console.log('   Admissions: 7')
  console.log('   Invoices:   12')
  console.log('   Payments:   4')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
