import { prisma } from '../src/lib/db/client'

async function main() {
  console.log('STEP 1 — CHECK EXISTING DATA')

  const org = await prisma.organization.findFirst({
    where: {
      name: { contains: 'Prince' }
    },
    select: { id: true }
  })

  console.log(`org.id found? ${org ? 'Yes' : 'No'}`)
  if (!org) {
    console.log('Stopping: organization not found.')
    return
  }

  const branch = await prisma.branch.findFirst({
    where: { orgId: org.id },
    select: { id: true }
  })

  const academicYear = await prisma.academicYear.findFirst({
    where: { orgId: org.id },
    select: { id: true, name: true }
  })
  console.log(`academicYear found? ${academicYear ? 'Yes' : 'No'}`)
  if (!academicYear) {
    console.log('Stopping: academicYear not found.')
    return
  }

  const stages = await prisma.admissionStage.findMany({
    where: { orgId: org.id },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      isWon: true,
      isLost: true,
    }
  })
  console.log(`stages count? ${stages.length}`)
  console.log('Stages found:', stages.map(s => s.name).join(', '))

  const counsellors = await prisma.user.findMany({
    where: {
      orgId: org.id,
      status: 'ACTIVE',
    },
    select: { id: true, name: true }
  })
  console.log(`counsellors count? ${counsellors.length}`)

  console.log('\nSTEP 2 — MAPPING STAGES')
  const findStage = (nameSubstring: string, checkWonLost?: { isWon?: boolean, isLost?: boolean }) => {
    return stages.find(s => {
      const nameMatch = s.name.toLowerCase().includes(nameSubstring.toLowerCase());
      if (!nameMatch) return false;
      if (checkWonLost) {
        if (checkWonLost.isWon !== undefined && s.isWon !== checkWonLost.isWon) return false;
        if (checkWonLost.isLost !== undefined && s.isLost !== checkWonLost.isLost) return false;
      }
      return true;
    });
  };

  const newStage = findStage('new') || stages[0];
  const contactedStage = findStage('contact') || newStage;
  const appStage = findStage('application') || newStage;
  const docsStage = findStage('doc') || newStage;
  const interviewStage = findStage('interview') || newStage;
  const paymentStage = findStage('payment') || newStage;
  const admittedStage = stages.find(s => s.name.toLowerCase().includes('admit') && s.isWon) || findStage('admit') || newStage;
  const rejectedStage = stages.find(s => s.name.toLowerCase().includes('reject') && s.isLost) || findStage('reject') || newStage;

  console.log(`Mapped stages:
  New: ${newStage?.name} (${newStage?.id})
  Contacted: ${contactedStage?.name} (${contactedStage?.id})
  Application: ${appStage?.name} (${appStage?.id})
  Docs: ${docsStage?.name} (${docsStage?.id})
  Interview: ${interviewStage?.name} (${interviewStage?.id})
  Payment: ${paymentStage?.name} (${paymentStage?.id})
  Admitted: ${admittedStage?.name} (${admittedStage?.id})
  Rejected: ${rejectedStage?.name} (${rejectedStage?.id})`)

  const admissionsToCreate = [
    {
      applicantName: 'Arjun Sharma',
      parentName: 'Rajesh Sharma',
      phone: '9876543210',
      email: 'rajesh.sharma@gmail.com',
      gradeSought: 'class_1',
      stageId: newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      assignedToId: counsellors[0]?.id,
    },
    {
      applicantName: 'Priya Patel',
      parentName: 'Suresh Patel',
      phone: '9876543211',
      email: 'suresh.patel@gmail.com',
      gradeSought: 'lkg',
      stageId: contactedStage?.id || newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assignedToId: counsellors[0]?.id,
    },
    {
      applicantName: 'Ravi Kumar',
      parentName: 'Sunil Kumar',
      phone: '9876543212',
      email: 'sunil.kumar@gmail.com',
      gradeSought: 'ukg',
      stageId: appStage?.id || newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assignedToId: counsellors[1]?.id || counsellors[0]?.id,
    },
    {
      applicantName: 'Ananya Singh',
      parentName: 'Vikram Singh',
      phone: '9876543213',
      email: 'vikram.singh@gmail.com',
      gradeSought: 'nursery',
      stageId: docsStage?.id || newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      assignedToId: counsellors[0]?.id,
    },
    {
      applicantName: 'Karthik Nair',
      parentName: 'Mohan Nair',
      phone: '9876543214',
      email: 'mohan.nair@gmail.com',
      gradeSought: 'class_2',
      stageId: interviewStage?.id || newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'URGENT' as const,
      assignedToId: counsellors[1]?.id || counsellors[0]?.id,
    },
    {
      applicantName: 'Deepa Krishnan',
      parentName: 'Ramesh Krishnan',
      phone: '9876543215',
      email: 'ramesh.krishnan@gmail.com',
      gradeSought: 'class_3',
      stageId: paymentStage?.id || newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      assignedToId: counsellors[0]?.id,
    },
    {
      applicantName: 'Sneha Reddy',
      parentName: 'Venkat Reddy',
      phone: '9876543216',
      email: 'venkat.reddy@gmail.com',
      gradeSought: 'pre_kg',
      stageId: admittedStage?.id || newStage?.id,
      status: admittedStage?.isWon ? ('ADMITTED' as const) : ('IN_PROGRESS' as const),
      priority: 'MEDIUM' as const,
      assignedToId: counsellors[1]?.id || counsellors[0]?.id,
      decidedAt: new Date(),
    },
    {
      applicantName: 'Aditya Menon',
      parentName: 'Sanjay Menon',
      phone: '9876543217',
      email: 'sanjay.menon@gmail.com',
      gradeSought: 'class_4',
      stageId: rejectedStage?.id || newStage?.id,
      status: rejectedStage?.isLost ? ('REJECTED' as const) : ('IN_PROGRESS' as const),
      rejectionReason: 'Seats not available for requested grade',
      priority: 'LOW' as const,
      assignedToId: counsellors[0]?.id,
      decidedAt: new Date(),
    },
    {
      applicantName: 'Meera Iyer',
      parentName: 'Ganesh Iyer',
      phone: '9876543218',
      email: 'ganesh.iyer@gmail.com',
      gradeSought: 'class_5',
      stageId: newStage?.id,
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      assignedToId: counsellors[1]?.id || counsellors[0]?.id,
    },
    {
      applicantName: 'Rahul Verma',
      parentName: 'Ashok Verma',
      phone: '9876543219',
      email: 'ashok.verma@gmail.com',
      gradeSought: 'class_6',
      stageId: docsStage?.id || newStage?.id,
      status: 'WAITLISTED' as const,
      priority: 'LOW' as const,
      assignedToId: counsellors[0]?.id,
    }
  ]

  console.log('\nSTEP 3 & 4 — CREATING RECORDS & ACTIVITY LOGS')
  let nextNumber = 2;
  for (let i = 0; i < admissionsToCreate.length; i++) {
    const a = admissionsToCreate[i];
    
    // Get a unique code
    const uniqueResult = await getUniqueAdmissionCode(org.id, nextNumber);
    const code = uniqueResult.code;
    nextNumber = uniqueResult.nextNumber;

    const createdAt = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));

    const admission = await prisma.admission.create({
      data: {
        orgId: org.id,
        branchId: branch?.id || null,
        academicYearId: academicYear.id,
        admissionCode: code,
        applicantName: a.applicantName,
        parentName: a.parentName,
        phone: a.phone,
        email: a.email,
        gradeSought: a.gradeSought,
        stageId: a.stageId,
        status: a.status,
        assignedToId: a.assignedToId || null,
        rejectionReason: 'rejectionReason' in a ? (a as any).rejectionReason : null,
        decidedAt: 'decidedAt' in a ? (a as any).decidedAt : null,
        createdAt: createdAt,
      }
    });

    console.log(`Created: ${admission.applicantName} (${admission.admissionCode})`);

    // Add activity log
    await prisma.admissionActivity.create({
      data: {
        orgId: org.id,
        branchId: branch?.id || null,
        academicYearId: academicYear.id,
        admissionId: admission.id,
        type: 'SYSTEM',
        summary: 'Admission record created',
        performedById: counsellors[0]?.id || null,
        createdAt: createdAt,
      }
    });

    // For admitted record (Sneha Reddy / Admission 7), add STAGE_CHANGE activity
    if (a.applicantName === 'Sneha Reddy') {
      await prisma.admissionActivity.create({
        data: {
          orgId: org.id,
          branchId: branch?.id || null,
          academicYearId: academicYear.id,
          admissionId: admission.id,
          type: 'STAGE_CHANGE',
          summary: 'Stage changed from New to Admitted',
          performedById: counsellors[0]?.id || null,
          createdAt: createdAt,
        }
      });
      console.log('  -> Added extra STAGE_CHANGE activity');
    }
  }

  console.log('\nSTEP 5 — SUMMARY')
  const count = await prisma.admission.count({
    where: { orgId: org.id }
  });
  console.log(`Total admissions now: ${count}`);
  console.log(`New records added: 10`);

  // Print list of unique stages covered and statuses
  const finalAdmissions = await prisma.admission.findMany({
    where: { orgId: org.id },
    select: {
      status: true,
      stage: { select: { name: true } }
    }
  });

  const stagesCovered = Array.from(new Set(finalAdmissions.map(a => a.stage?.name || 'Unknown')));
  const statusesCovered = Array.from(new Set(finalAdmissions.map(a => a.status)));

  console.log('Different stages covered:', stagesCovered.join(', '));
  console.log('Different statuses:', statusesCovered.join(', '));
}

async function getUniqueAdmissionCode(orgId: string, baseNumber: number): Promise<{ code: string, nextNumber: number }> {
  let num = baseNumber;
  while (true) {
    const code = `AT-2026-${String(num).padStart(5, '0')}`;
    const exists = await prisma.admission.findFirst({
      where: {
        orgId,
        admissionCode: code
      }
    });
    if (!exists) {
      return { code, nextNumber: num + 1 };
    }
    num++;
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
