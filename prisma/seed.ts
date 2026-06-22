import { prisma } from '../src/lib/db/client'

async function main() {
  console.log('Seeding database...')

  // STEP 1: Clean existing data
  console.log('Cleaning existing data...')
  
  await prisma.school.deleteMany()
  await prisma.organizationModule.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany({
    where: {
      OR: [
        { orgId: { not: null } },
        { email: 'vimal@techparrot.co' }
      ]
    }
  })
  await prisma.branch.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.planModule.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.module.deleteMany()
  await prisma.otpCode.deleteMany()
  await prisma.auditLog.deleteMany()

  // STEP 2: Create Modules (13 total)
  console.log('Creating modules...')
  const modulesData = [
    'lead_management',
    'admission_management',
    'student_management',
    'fee_management',
    'campaign_management',
    'advanced_reports',
    'payment_gateway',
    'whatsapp_sms_notifications',
    'forms_requests',
    'admission_workflow',
    'student_lifecycle',
    'api_access',
    'custom_domain'
  ]

  const modules = await Promise.all(
    modulesData.map((slug) =>
      prisma.module.create({
        data: {
          slug,
          name: slug
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          description: `Features for ${slug.replace(/_/g, ' ')}`
        }
      })
    )
  )

  // STEP 3: Create Plans (4 plans)
  console.log('Creating plans...')
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      slug: 'free',
      monthlyPrice: 0,
      leadCap: 10,
      isPublic: true,
      sortOrder: 1
    }
  })

  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      monthlyPrice: 2999,
      leadCap: null,
      isPublic: true,
      sortOrder: 2
    }
  })

  const growthPlan = await prisma.plan.create({
    data: {
      name: 'Growth',
      slug: 'growth',
      monthlyPrice: 4999,
      leadCap: null,
      isPublic: true,
      sortOrder: 3
    }
  })

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      slug: 'enterprise',
      monthlyPrice: 9999,
      leadCap: null,
      isPublic: true,
      sortOrder: 4
    }
  })

  // STEP 4: Create PlanModules
  console.log('Creating plan modules...')
  // Free plan gets only lead_management
  await prisma.planModule.createMany({
    data: [
      { planId: freePlan.id, moduleSlug: 'lead_management' }
    ]
  })

  // Starter plan gets: lead_management, admission_management, student_management
  await prisma.planModule.createMany({
    data: [
      { planId: starterPlan.id, moduleSlug: 'lead_management' },
      { planId: starterPlan.id, moduleSlug: 'admission_management' },
      { planId: starterPlan.id, moduleSlug: 'student_management' }
    ]
  })

  // Growth plan gets all modules except: api_access, custom_domain
  const growthSlugs = modulesData.filter(slug => slug !== 'api_access' && slug !== 'custom_domain')
  await prisma.planModule.createMany({
    data: growthSlugs.map(slug => ({
      planId: growthPlan.id,
      moduleSlug: slug
    }))
  })

  // Enterprise plan gets all 13 modules
  await prisma.planModule.createMany({
    data: modulesData.map(slug => ({
      planId: enterprisePlan.id,
      moduleSlug: slug
    }))
  })

  // STEP 5: Create Super Admin User
  console.log('Creating super admin...')
  await prisma.user.create({
    data: {
      name: 'Vimal Das',
      email: 'vimal@techparrot.co',
      phone: '9884185362',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      orgId: null
    }
  })

  // STEP 6: Create Test Organization
  console.log('Creating test organization...')
  const testOrg = await prisma.organization.create({
    data: {
      name: 'Prince Matriculation School',
      slug: 'prince-matriculation-school',
      institutionType: 'SCHOOL',
      status: 'ACTIVE',
      email: 'admin@princematric.com',
      phone: '9884185361',
      planId: growthPlan.id,
      leadCap: 10,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  // STEP 7: Create Default Branch
  console.log('Creating default branch...')
  const mainBranch = await prisma.branch.create({
    data: {
      orgId: testOrg.id,
      name: 'Main Branch',
      isDefault: true,
      city: 'Chennai',
      state: 'Tamil Nadu'
    }
  })

  // STEP 8: Create Org Admin User
  console.log('Creating org admin user...')
  await prisma.user.create({
    data: {
      name: 'Saran Kumar',
      email: 'saran@princematric.com',
      phone: '9845000001',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      orgId: testOrg.id
    }
  })

  // STEP 9: Create Counsellors
  console.log('Creating counsellors...')
  const pradeep = await prisma.user.create({
    data: {
      name: 'Pradeep Kumar',
      email: 'pradeep@princematric.com',
      phone: '9845000002',
      role: 'COUNSELLOR',
      status: 'ACTIVE',
      orgId: testOrg.id
    }
  })

  const vimalCounsellor = await prisma.user.create({
    data: {
      name: 'Vimal Das',
      email: 'vimal@princematric.com',
      phone: '9845000003',
      role: 'COUNSELLOR',
      status: 'ACTIVE',
      orgId: testOrg.id
    }
  })

  // STEP 10: Enable Growth Modules for Test Org
  console.log('Enabling growth modules for test organization...')
  await prisma.organizationModule.createMany({
    data: growthSlugs.map(slug => {
      const mod = modules.find(m => m.slug === slug)
      return {
        orgId: testOrg.id,
        moduleId: mod!.id,
        enabled: true
      }
    })
  })

  // STEP 11: Create Academic Year
  console.log('Creating academic year...')
  const academicYear = await prisma.academicYear.create({
    data: {
      orgId: testOrg.id,
      name: 'AY 2026-27',
      type: 'ACADEMIC',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE'
    }
  })

  // STEP 12: Create Admission Stages (8 stages)
  console.log('Creating admission stages...')
  await prisma.admissionStage.createMany({
    data: [
      {
        orgId: testOrg.id,
        name: 'New',
        sortOrder: 1,
        color: 'blue',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Contacted',
        sortOrder: 2,
        color: 'amber',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Application Submitted',
        sortOrder: 3,
        color: 'indigo',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Docs Uploaded',
        sortOrder: 4,
        color: 'violet',
        isWon: false,
        isLost: false,
        requiresDocs: true,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Interview Scheduled',
        sortOrder: 5,
        color: 'cyan',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Payment Pending',
        sortOrder: 6,
        color: 'orange',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: true
      },
      {
        orgId: testOrg.id,
        name: 'Admitted',
        sortOrder: 7,
        color: 'green',
        isWon: true,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Rejected',
        sortOrder: 8,
        color: 'red',
        isWon: false,
        isLost: true,
        requiresDocs: false,
        requiresPayment: false
      }
    ]
  })

  // STEP 13: Create Sample School in marketplace schema
  console.log('Creating sample school in marketplace...')
  await prisma.school.create({
    data: {
      orgId: testOrg.id,
      name: 'Prince Matriculation School',
      slug: 'prince-matriculation-school',
      institutionType: 'SCHOOL',
      verificationStatus: 'VERIFIED',
      isVerified: true,
      admissionOpen: true,
      profileCompletion: 60,
      rankingScore: 75
    }
  })

  // STEP 14: Add sample leads (5 leads)
  console.log('Creating sample leads...')
  await prisma.lead.createMany({
    data: [
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00001',
        parentName: 'Aravind Swamy',
        phone: '9840111111',
        email: 'aravind@gmail.com',
        kidName: 'Aditya Swamy',
        gradeSought: 'Grade 1',
        source: 'VIDHYAAN',
        status: 'NEW',
        priority: 'HIGH',
        assignedToId: pradeep.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00002',
        parentName: 'Meera Krishnan',
        phone: '9840222222',
        email: 'meera@gmail.com',
        kidName: 'Sanjay Krishnan',
        gradeSought: 'Grade 3',
        source: 'WALK_IN',
        status: 'CONTACTED',
        priority: 'MEDIUM',
        assignedToId: vimalCounsellor.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00003',
        parentName: 'Rajesh Kumar',
        phone: '9840333333',
        email: 'rajesh@gmail.com',
        kidName: 'Rahul Kumar',
        gradeSought: 'Grade 5',
        source: 'PHONE',
        status: 'INTERESTED',
        priority: 'LOW',
        assignedToId: pradeep.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00004',
        parentName: 'Sangeetha Bala',
        phone: '9840444444',
        email: 'sangeetha@gmail.com',
        kidName: 'Nisha Bala',
        gradeSought: 'Grade 2',
        source: 'REFERRAL',
        status: 'FOLLOW_UP_PENDING',
        priority: 'MEDIUM',
        assignedToId: vimalCounsellor.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00005',
        parentName: 'Vijay Raghavan',
        phone: '9840555555',
        email: 'vijay@gmail.com',
        kidName: 'Ananya Raghavan',
        gradeSought: 'Kindergarten',
        source: 'WEBSITE',
        status: 'CONVERTED',
        priority: 'HIGH',
        assignedToId: pradeep.id
      }
    ]
  })

  // STEP 15: Log completion
  console.log('Seed complete:')
  console.log('- 13 modules created')
  console.log('- 4 plans created')
  console.log('- 1 test organization')
  console.log('- 1 main branch')
  console.log('- 4 users created')
  console.log('- 8 admission stages')
  console.log('- 1 academic year')
  console.log('- 1 school listing')
  console.log('- 5 sample leads')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
