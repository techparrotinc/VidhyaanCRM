import { prisma } from '../src/lib/db/client'

async function main() {
  console.log('Seeding sample admissions...')

  const org = await prisma.organization.findFirst({
    where: { slug: 'prince-matriculation-school' }
  })
  if (!org) {
    throw new Error('Test organization not found. Please seed the main DB first.')
  }

  const branch = await prisma.branch.findFirst({
    where: { orgId: org.id }
  })
  if (!branch) {
    throw new Error('Default branch not found.')
  }

  const ay = await prisma.academicYear.findFirst({
    where: { orgId: org.id, name: 'AY 2026-27' }
  })
  if (!ay) {
    throw new Error('Academic year not found.')
  }

  const stages = await prisma.admissionStage.findMany({
    where: { orgId: org.id },
    orderBy: { sortOrder: 'asc' }
  })
  if (stages.length === 0) {
    throw new Error('Admission stages not found.')
  }

  const counsellors = await prisma.user.findMany({
    where: { orgId: org.id, role: 'COUNSELLOR' }
  })

  // Clean existing admissions
  await prisma.admissionDocument.deleteMany({
    where: { orgId: org.id }
  })
  await prisma.admissionActivity.deleteMany({
    where: { orgId: org.id }
  })
  await prisma.student.deleteMany({
    where: { orgId: org.id }
  })
  await prisma.admission.deleteMany({
    where: { orgId: org.id }
  })

  const newStage = stages.find(s => s.name === 'New') || stages[0]
  const contactedStage = stages.find(s => s.name === 'Contacted') || stages[1]
  const appStage = stages.find(s => s.name === 'Application Submitted') || stages[2]
  const docsStage = stages.find(s => s.name === 'Docs Uploaded') || stages[3]
  const admittedStage = stages.find(s => s.name === 'Admitted') || stages[6]

  const pradeep = counsellors.find(c => c.name === 'Pradeep Kumar')
  const vimal = counsellors.find(c => c.name === 'Vimal Das')

  const admissions = [
    {
      orgId: org.id,
      branchId: branch.id,
      academicYearId: ay.id,
      admissionCode: 'ADM-2026-00001',
      applicantName: 'Aditya Swamy',
      gradeSought: 'Class 1',
      phone: '9840111111',
      email: 'aditya@gmail.com',
      stageId: newStage.id,
      assignedToId: pradeep?.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      orgId: org.id,
      branchId: branch.id,
      academicYearId: ay.id,
      admissionCode: 'ADM-2026-00002',
      applicantName: 'Sanjay Krishnan',
      gradeSought: 'Class 3',
      phone: '9840222222',
      email: 'sanjay@gmail.com',
      stageId: contactedStage.id,
      assignedToId: vimal?.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      orgId: org.id,
      branchId: branch.id,
      academicYearId: ay.id,
      admissionCode: 'ADM-2026-00003',
      applicantName: 'Rahul Kumar',
      gradeSought: 'Class 5',
      phone: '9840333333',
      email: 'rahul@gmail.com',
      stageId: appStage.id,
      assignedToId: pradeep?.id,
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago (warning)
    },
    {
      orgId: org.id,
      branchId: branch.id,
      academicYearId: ay.id,
      admissionCode: 'ADM-2026-00004',
      applicantName: 'Nisha Bala',
      gradeSought: 'Class 2',
      phone: '9840444444',
      email: 'nisha@gmail.com',
      stageId: docsStage.id,
      assignedToId: vimal?.id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago (overdue)
    },
    {
      orgId: org.id,
      branchId: branch.id,
      academicYearId: ay.id,
      admissionCode: 'ADM-2026-00005',
      applicantName: 'Ananya Raghavan',
      gradeSought: 'UKG',
      phone: '9840555555',
      email: 'ananya@gmail.com',
      stageId: admittedStage.id,
      assignedToId: pradeep?.id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    }
  ]

  for (const adm of admissions) {
    const created = await prisma.admission.create({ data: adm })
    console.log(`Created admission: ${created.applicantName} (${created.admissionCode})`)

    // Seed some documents for Nisha Bala
    if (created.applicantName === 'Nisha Bala') {
      await prisma.admissionDocument.createMany({
        data: [
          {
            orgId: org.id,
            admissionId: created.id,
            name: 'Birth Certificate.pdf',
            type: 'PDF',
            url: 'https://example.com/birth.pdf',
            scanStatus: 'APPROVED'
          },
          {
            orgId: org.id,
            admissionId: created.id,
            name: 'Aadhar Card.jpg',
            type: 'JPG',
            url: 'https://example.com/aadhar.jpg',
            scanStatus: 'APPROVED'
          }
        ]
      })
    }
  }

  console.log('Admissions seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
